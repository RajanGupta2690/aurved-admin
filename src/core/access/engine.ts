import { matchesAny } from './match';

/**
 * Layer 3 and 4: what a person may do, and where.
 * Order of evaluation, the same one the backend must use later:
 *   1. memberships whose scope covers the place (organization or institution)
 *   2. an explicit deny anywhere in those memberships wins over every allow
 *   3. an allow from a role or a direct grant
 *   4. otherwise denied
 */
export interface RoleDef {
  id: string;
  name: string;
  description: string;
  /** Where the role can be given: inside one institution or across an organization. */
  level: 'inst' | 'org';
  /** Permission patterns. A pattern starting with ! is a deny. */
  permissions: string[];
  system: boolean;
}

export interface Membership {
  scope: { type: 'org' | 'inst'; id: string };
  roleIds: string[];
  /** Extra allows for this person only. */
  grants?: string[];
  /** Extra denies for this person only. They beat every allow. */
  denies?: string[];
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

function covers(membership: Membership, place: Place): boolean {
  if (membership.scope.type === 'org') return membership.scope.id === place.orgId && !(place.instId && place.external);
  return place.instId !== undefined && membership.scope.id === place.instId;
}

export function evaluate(persona: Persona, roles: RoleDef[], permission: string, place: Place): AccessResult {
  const applicable = persona.memberships.filter((membership) => covers(membership, place));
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
      if (viaGrant) allowSource = `Direct grant for ${persona.name}`;
      for (const role of roleDefs) {
        if (!allowSource && matchesAny(role.permissions.filter((p) => !p.startsWith('!')), permission)) allowSource = `Role "${role.name}"`;
      }
    }
  }
  if (allowSource) return { allowed: true, detail: `Allowed.`, source: allowSource };
  return { allowed: false, reason: 'no_grant', detail: `No role gives ${permission}.` };
}
