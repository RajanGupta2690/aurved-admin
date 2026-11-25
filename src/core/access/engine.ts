import { matchesAny } from './match';

/**
 * Layer 3 and 4: what a person may do, and where.
 * Order of evaluation, the same one the backend must use later:
 *   1. memberships whose scope covers the place (organization or institution)
 *   2. an explicit deny anywhere in those memberships wins over every allow
 *   3. an allow from a role or a direct grant
 *   4. otherwise denied
 */
/** How much data a role reaches inside a module. Wider scopes include the narrower ones. */
export type ScopeKind = 'own' | 'assigned' | 'campus' | 'department' | 'institution' | 'organization';
export const SCOPE_ORDER: ScopeKind[] = ['own', 'assigned', 'campus', 'department', 'institution', 'organization'];
export const SCOPE_LABEL: Record<ScopeKind, string> = {
  own: 'Own records only',
  assigned: 'Assigned classes or groups',
  campus: 'One campus',
  department: 'One department',
  institution: 'Whole institution',
  organization: 'Whole organization',
};

export interface RoleScope {
  default: ScopeKind;
  /** Module key to scope, where a module needs something different from the default. */
  byModule?: Record<string, ScopeKind>;
}

export interface RoleDef {
  id: string;
  name: string;
  description: string;
  /** Where the role can be given: inside one institution or across an organization. */
  level: 'inst' | 'org';
  /** Permission patterns. A pattern starting with ! is a deny. */
  permissions: string[];
  system: boolean;
  /** Custom roles belong to the organization that made them. System roles have no owner. */
  ownerOrgId?: string;
  archived?: boolean;
  scope?: RoleScope;
}

export interface Membership {
  scope: { type: 'org' | 'inst'; id: string };
  roleIds: string[];
  /** Extra allows for this person only. */
  grants?: string[];
  /** Extra denies for this person only. They beat every allow. */
  denies?: string[];
  /** A temporary membership, such as a delegation. First and last day, inclusive (yyyy-mm-dd). */
  validFrom?: string;
  until?: string;
  /** Who handed it over, for delegations. Shown as the source of an allow. */
  delegatedBy?: string;
  delegationId?: string;
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  email: string;
  memberships: Membership[];
}

export interface Place {
  orgId: string;
  instId?: string;
  /**
   * The institution runs independently (affiliated, autonomous or partner).
   * A role held over the whole organization does not reach into it. Only a role given in the institution itself does.
   */
  external?: boolean;
}

export type DenyReason = 'no_membership' | 'explicit_deny' | 'no_grant' | 'external_institution';

export interface AccessResult {
  allowed: boolean;
  reason?: DenyReason;
  detail: string;
  /** Where the allow came from, for the access explainer. */
  source?: string;
}

/** Today as yyyy-mm-dd. Tests pass their own day. */
export const isoToday = () => new Date().toISOString().slice(0, 10);

function covers(membership: Membership, place: Place, today: string = isoToday()): boolean {
  if (membership.until && today > membership.until) return false;
  if (membership.validFrom && today < membership.validFrom) return false;
  if (membership.scope.type === 'org') return membership.scope.id === place.orgId && !(place.instId && place.external);
  return place.instId !== undefined && membership.scope.id === place.instId;
}

export function evaluate(persona: Persona, roles: RoleDef[], permission: string, place: Place, today: string = isoToday()): AccessResult {
  const applicable = persona.memberships.filter((membership) => covers(membership, place, today));
  if (applicable.length === 0) {
    if (place.instId && place.external && persona.memberships.some((membership) => membership.scope.type === 'org' && membership.scope.id === place.orgId)) {
      return { allowed: false, reason: 'external_institution', detail: 'This institution runs independently. The organization sees only the data the institution agrees to share.' };
    }
    return { allowed: false, reason: 'no_membership', detail: `${persona.name} has no role in this place.` };
  }

  let allowSource: string | undefined;
  for (const membership of applicable) {
    const roleDefs = membership.roleIds.map((id) => roles.find((role) => role.id === id)).filter((role): role is RoleDef => Boolean(role));
    const denies = [
      ...(membership.denies ?? []),
      ...roleDefs.flatMap((role) => role.permissions.filter((p) => p.startsWith('!')).map((p) => p.slice(1))),
    ];
    if (matchesAny(denies, permission)) {
      return { allowed: false, reason: 'explicit_deny', detail: `Access to ${permission} is explicitly denied.` };
    }
    if (!allowSource) {
      const viaGrant = (membership.grants ?? []).find((pattern) => matchesAny([pattern], permission));
      if (viaGrant) allowSource = membership.delegatedBy ? `Delegated by ${membership.delegatedBy} until ${membership.until}` : `Direct grant for ${persona.name}`;
      for (const role of roleDefs) {
        if (!allowSource && matchesAny(role.permissions.filter((p) => !p.startsWith('!')), permission)) allowSource = `Role "${role.name}"`;
      }
    }
  }
  if (allowSource) return { allowed: true, detail: `Allowed.`, source: allowSource };
  return { allowed: false, reason: 'no_grant', detail: `No role gives ${permission}.` };
}

// ---------- data scope
export function roleScopeFor(role: RoleDef, moduleKey: string): ScopeKind {
  return role.scope?.byModule?.[moduleKey] ?? role.scope?.default ?? (role.level === 'org' ? 'organization' : 'institution');
}

/** The widest scope a person has in a module at a place, or null when they have no role there. */
export function dataScopeFor(persona: Persona, roles: RoleDef[], moduleKey: string, place: Place): ScopeKind | null {
  let best: ScopeKind | null = null;
  persona.memberships
    .filter((membership) => covers(membership, place))
    .forEach((membership) =>
      membership.roleIds.forEach((id) => {
        const role = roles.find((item) => item.id === id);
        if (!role) return;
        const scope = roleScopeFor(role, moduleKey);
        if (best === null || SCOPE_ORDER.indexOf(scope) > SCOPE_ORDER.indexOf(best)) best = scope;
      }),
    );
  return best;
}

// ---------- explanation
export interface ExplainStep {
  label: string;
  passed: boolean;
  detail: string;
}

/** Same decision as evaluate, in steps a person can read. */
export function explainAccess(persona: Persona, roles: RoleDef[], permission: string, place: Place): { result: AccessResult; steps: ExplainStep[] } {
  const result = evaluate(persona, roles, permission, place);
  const steps: ExplainStep[] = [];
  const applicable = persona.memberships.filter((membership) => covers(membership, place));
  const roleName = (id: string) => roles.find((role) => role.id === id)?.name ?? id;
  const held = applicable.flatMap((membership) => membership.roleIds.map(roleName));
  steps.push({
    label: 'Does the person hold a role here?',
    passed: applicable.length > 0,
    detail:
      applicable.length > 0
        ? `Yes: ${held.join(', ') || 'direct grants only'}.`
        : result.reason === 'external_institution'
          ? 'No. This institution runs independently, so a role over the whole organization does not reach into it.'
          : `No role covers this place.`,
  });
  if (applicable.length > 0) {
    const denies = applicable.flatMap((membership) => [
      ...(membership.denies ?? []).map((pattern) => ({ pattern, from: `a direct deny for ${persona.name}` })),
      ...membership.roleIds.flatMap((id) => {
        const role = roles.find((item) => item.id === id);
        return (role?.permissions ?? []).filter((p) => p.startsWith('!')).map((p) => ({ pattern: p.slice(1), from: `the role "${role?.name}"` }));
      }),
    ]);
    const hit = denies.find((item) => matchesAny([item.pattern], permission));
    steps.push({
      label: 'Is it denied on purpose?',
      passed: !hit,
      detail: hit ? `Yes. ${hit.pattern} is denied by ${hit.from}. A deny beats every allow.` : 'No deny matches.',
    });
    steps.push({
      label: 'Does a role or grant allow it?',
      passed: result.allowed,
      detail: result.allowed ? `Yes. ${result.source}.` : hit ? 'Not checked, the deny already decided.' : `No. None of ${held.join(', ') || 'the grants'} includes ${permission}.`,
    });
  }
  return { result, steps };
}
