import { evaluate } from '../access/engine';
import type { Place, RoleDef, RoleScope } from '../access/engine';
import { allowedKeys } from '../access/matrix';
import { matchesAny } from '../access/match';
import { effectiveConfig, OPEN_CONFIG } from '../features/effective';
import { allFeatureKeys, getFeature, getModuleOf, MODULES } from '../features/registry';
import { resolveFeature } from '../features/resolve';
import type { FeatureConfig, PolicyMode } from '../features/resolve';
import type { Actor, AuditEvent, ConfigChange, Snapshot } from './model';
import { record } from './ops';
import type { Res } from './ops';
import { isExternal, nextId, slugify } from './rules';
import type { Institution } from './types';

/** Changes to feature configuration, roles and scope. Pure functions, same style as ops.ts. */
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const orgOf = (snap: Snapshot, id: string) => snap.orgs.organizations.find((org) => org.id === id);
const instOf = (snap: Snapshot, id: string) => snap.orgs.institutions.find((inst) => inst.id === id);

export const featureLabel = (key: string): string => getFeature(key)?.label ?? MODULES.find((module) => module.key === key)?.label ?? key;

// ---------- feature configuration
export function configOf(snap: Snapshot, id: string): FeatureConfig {
  return snap.features[id] ?? clone(OPEN_CONFIG);
}

function effectiveFor(snap: Snapshot, inst: Institution): FeatureConfig {
  return effectiveConfig(snap.features, snap.orgs.organizations, inst);
}

/** Feature keys that apply to the institution and are available under a configuration. */
export function availableKeys(config: FeatureConfig, inst: Institution): string[] {
  return allFeatureKeys().filter((key) => {
    const result = resolveFeature(config, inst.profile, key);
    return result.available;
  });
}

/** The local switches after turning one feature on or off. A module-level off is spread over its features first. */
export function applyLocal(config: FeatureConfig, key: string, enabled: boolean): FeatureConfig {
  const next = clone(config);
  const module = getModuleOf(key);
  if (module && next.local[module.key] === false) {
    delete next.local[module.key];
    module.features.forEach((feature) => {
      // Switching one feature on inside an off module turns the module on, so its overview stays on too.
      if (feature.key !== key && feature.key !== `${module.key}.overview`) next.local[feature.key] = false;
    });
  }
  if (enabled) delete next.local[key];
  else next.local[key] = false;
  return next;
}

/** What turning a feature on or off would take away or give. */
export function featureImpact(snap: Snapshot, instId: string, key: string, enabled: boolean): { lost: string[]; gained: string[] } {
  const inst = instOf(snap, instId);
  if (!inst) return { lost: [], gained: [] };
  const before = effectiveFor(snap, inst);
  const after = applyLocal(before, key, enabled);
  const was = new Set(availableKeys(before, inst));
  const will = new Set(availableKeys(after, inst));
  return {
    lost: [...was].filter((item) => !will.has(item) && item !== key),
    gained: [...will].filter((item) => !was.has(item) && item !== key),
  };
}

function nextChangeId(snap: Snapshot): string {
  return nextId('cfg', snap.world.configHistory.map((item) => item.id));
}

function saveConfig(
  snap: Snapshot,
  target: { id: string; kind: ConfigChange['targetKind']; orgId: string; instId?: string },
  after: FeatureConfig,
  summary: string,
  actor: Actor,
  now: string,
  reason?: string,
): Snapshot {
  const before = configOf(snap, target.id);
  const change: ConfigChange = { id: nextChangeId(snap), at: now, byName: actor.name, orgId: target.orgId, targetId: target.id, targetKind: target.kind, summary, reason: reason?.trim() || undefined, before: clone(before), after: clone(after) };
  const next: Snapshot = { ...snap, features: { ...snap.features, [target.id]: after }, world: { ...snap.world, configHistory: [change, ...snap.world.configHistory] } };
  return record(next, { orgId: target.orgId, instId: target.instId, kind: 'feature', summary, reason }, actor, now);
}

export function setLocalFeature(snap: Snapshot, instId: string, key: string, enabled: boolean, actor: Actor, now: string): Res {
  const inst = instOf(snap, instId);
  const feature = getFeature(key);
  if (!inst || !feature) return fail('This feature or institution does not exist.');
  const effective = effectiveFor(snap, inst);
  const current = resolveFeature(effective, inst.profile, key);
  if (!enabled) {
    if (feature.required || current.mandatory) return fail(`"${feature.label}" cannot be switched off. ${feature.required ? 'The platform needs it.' : 'The organization requires it.'}`);
    if (!current.available && current.reason === 'disabled_locally') return fail(`"${feature.label}" is already off.`);
    if (!current.available) return fail(`"${feature.label}" is not available here anyway. ${current.detail ?? ''}`.trim());
  } else {
    if (current.available) return fail(`"${feature.label}" is already on.`);
    if (current.reason !== 'disabled_locally' && current.reason !== 'dependency_missing') return fail(current.detail ?? 'It cannot be switched on here.');
    // Switch on, then check that it really works. The cause may be a dependency that is still off.
    const trial = resolveFeature(applyLocal(effective, key, true), inst.profile, key);
    if (!trial.available) return fail(`"${feature.label}" cannot be switched on yet. ${trial.detail ?? ''}`.trim());
  }
  const after = applyLocal(configOf(snap, inst.id), key, enabled);
  return {
    ok: true,
    snap: saveConfig(snap, { id: inst.id, kind: 'institution', orgId: inst.orgId, instId: inst.id }, after, `${enabled ? 'Switched on' : 'Switched off'} "${feature.label}" for ${inst.shortName}.`, actor, now),
  };
}

/** Why a configuration cannot stand, or null. Run on every institution the change reaches. */
export function configProblems(snap: Snapshot, institutions: Institution[]): string | null {
  for (const inst of institutions) {
    const effective = effectiveFor(snap, inst);
    for (const key of allFeatureKeys()) {
      const feature = getFeature(key);
      const module = getModuleOf(key);
      if (!feature || !module) continue;
      const policy = effective.policy[key] ?? effective.policy[module.key];
      const result = resolveFeature(effective, inst.profile, key);
      if (result.reason === 'not_applicable' || result.reason === 'unknown_feature') continue;
      if (feature.required && policy === 'locked_off') return `"${feature.label}" is needed by the platform and cannot be locked off.`;
      if (policy === 'mandatory' && !result.available) return `"${feature.label}" is required, but it cannot work in ${inst.shortName}. ${result.detail ?? ''}`.trim();
    }
  }
  return null;
}

export type PolicyTarget = { kind: 'organization'; orgId: string } | { kind: 'institution'; instId: string };

export function setPolicy(snap: Snapshot, target: PolicyTarget, key: string, mode: PolicyMode | null, actor: Actor, now: string, reason?: string): Res {
  if (!getFeature(key) && !MODULES.some((module) => module.key === key)) return fail('Unknown feature.');
  let orgId: string;
  let affected: Institution[];
  let targetId: string;
  let where: string;
  if (target.kind === 'organization') {
    const org = orgOf(snap, target.orgId);
    if (!org || org.implicit) return fail('Only a group, trust or university has an organization policy.');
    orgId = org.id;
    targetId = org.id;
    where = `all institutions of ${org.name}`;
    affected = snap.orgs.institutions.filter((inst) => inst.orgId === org.id && !isExternal(inst));
  } else {
    const inst = instOf(snap, target.instId);
    const org = inst ? orgOf(snap, inst.orgId) : undefined;
    if (!inst || !org || org.implicit) return fail('Only an institution inside an organization can have a policy.');
    if (isExternal(inst)) return fail(`${inst.shortName} runs independently. ${org.name} cannot set its features.`);
    orgId = org.id;
    targetId = inst.id;
    where = inst.shortName;
    affected = [inst];
  }
  const before = configOf(snap, targetId);
  if ((before.policy[key] ?? null) === mode) return fail('This policy is already set.');
  if (mode === 'locked_off') {
    const keys = getFeature(key) ? [key] : (MODULES.find((module) => module.key === key)?.features.map((feature) => feature.key) ?? []);
    const required = keys.map((item) => getFeature(item)).find((feature) => feature?.required);
    if (required) return fail(`"${required.label}" is needed by the platform and cannot be locked off.`);
  }
  const policy = { ...before.policy };
  if (mode) policy[key] = mode;
  else delete policy[key];
  const after: FeatureConfig = { ...before, policy };
  const trial: Snapshot = { ...snap, features: { ...snap.features, [targetId]: after } };
  const problem = configProblems(trial, affected);
  if (problem) return fail(problem);
  const verb = mode === 'mandatory' ? 'Made required' : mode === 'locked_off' ? 'Locked off' : 'Set to optional';
  return { ok: true, snap: saveConfig(snap, { id: targetId, kind: target.kind, orgId, instId: target.kind === 'institution' ? targetId : undefined }, after, `${verb}: "${featureLabel(key)}" for ${where}.`, actor, now, reason) };
}

/** Puts a configuration back to how it was before a change. The undo is itself a change in the history. */
export function revertConfig(snap: Snapshot, changeId: string, actor: Actor, now: string, reason: string): Res {
  const change = snap.world.configHistory.find((item) => item.id === changeId);
  if (!change) return fail('This change does not exist.');
  if (reason.trim().length < 3) return fail('Write a reason.');
  const current = configOf(snap, change.targetId);
  if (JSON.stringify(current) === JSON.stringify(change.before)) return fail('The configuration is already like that.');
  const affected =
    change.targetKind === 'institution'
      ? snap.orgs.institutions.filter((inst) => inst.id === change.targetId)
      : snap.orgs.institutions.filter((inst) => inst.orgId === change.targetId && !isExternal(inst));
  if (affected.length === 0) return fail('The institution no longer exists.');
  const trial: Snapshot = { ...snap, features: { ...snap.features, [change.targetId]: clone(change.before) } };
  const problem = configProblems(trial, affected);
  if (problem) return fail(`It cannot go back: ${problem}`);
  const label = change.targetKind === 'institution' ? instOf(snap, change.targetId)?.shortName ?? change.targetId : orgOf(snap, change.targetId)?.name ?? change.targetId;
  return {
    ok: true,
    snap: saveConfig(snap, { id: change.targetId, kind: change.targetKind, orgId: change.orgId, instId: change.targetKind === 'institution' ? change.targetId : undefined }, clone(change.before), `Went back to the configuration before ${change.id} for ${label}.`, actor, now, reason),
  };
}

/** Lines that say what differs between two configurations. */
export function describeDiff(before: FeatureConfig, after: FeatureConfig): string[] {
  const lines: string[] = [];
  const keys = new Set([...Object.keys(before.policy), ...Object.keys(after.policy)]);
  keys.forEach((key) => {
    const was = before.policy[key] ?? 'optional';
    const now = after.policy[key] ?? 'optional';
    if (was !== now) lines.push(`Policy for "${featureLabel(key)}": ${was.replace('_', ' ')} to ${now.replace('_', ' ')}`);
  });
  const localKeys = new Set([...Object.keys(before.local), ...Object.keys(after.local)]);
  localKeys.forEach((key) => {
    const was = before.local[key] === false ? 'off' : 'on';
    const now = after.local[key] === false ? 'off' : 'on';
    if (was !== now) lines.push(`Switch for "${featureLabel(key)}": ${was} to ${now}`);
  });
  if (JSON.stringify(before.entitlements) !== JSON.stringify(after.entitlements)) lines.push('Plan entitlements changed');
  return lines;
}

// ---------- roles
export interface RoleDraft {
  id?: string;
  name: string;
  description: string;
  level: 'inst' | 'org';
  permissions: string[];
  ownerOrgId: string;
}

/** Roles a person can use in an organization: the system roles and the custom roles the organization made. */
export function rolesOf(roles: RoleDef[], orgId: string, includeArchived = false): RoleDef[] {
  return roles.filter((role) => (includeArchived || !role.archived) && (!role.ownerOrgId || role.ownerOrgId === orgId));
}

export function peopleWithRole(snap: Snapshot, roleId: string): string[] {
  return snap.access.personas.filter((person) => person.memberships.some((membership) => membership.roleIds.includes(roleId))).map((person) => person.name);
}

/** The first permission the actor does not hold themselves, or null. Nobody can hand out more than they have. */
export function escalationProblem(snap: Snapshot, actorId: string, permissions: string[], orgId: string): string | null {
  const actor = snap.access.personas.find((person) => person.id === actorId);
  if (!actor) return 'The person making this change is unknown.';
  const places: Place[] = [{ orgId }, ...snap.orgs.institutions.filter((inst) => inst.orgId === orgId).map((inst) => ({ orgId, instId: inst.id, external: isExternal(inst) }))];
  // A role's own denies are respected, so a role that is "everything except organization pages" needs no organization permission.
  const keys = allowedKeys(permissions);
  const missing = keys.find((key) => !places.some((place) => evaluate(actor, snap.access.roles, key, place).allowed));
  return missing ? `You cannot give a permission you do not hold yourself (${missing}).` : null;
}

export function saveRole(snap: Snapshot, draft: RoleDraft, actor: Actor, now: string): Res<{ roleId: string }> {
  const org = orgOf(snap, draft.ownerOrgId);
  if (!org) return fail('This organization does not exist.');
  const name = draft.name.trim();
  if (name.length < 3) return fail('Give the role a name of at least 3 characters.');
  if (name.length > 60) return fail('The name is too long. Use 60 characters or fewer.');
  if (draft.level === 'org' && org.implicit) return fail('An organization-wide role only makes sense for a group, trust or university.');
  const allows = draft.permissions.filter((pattern) => !pattern.startsWith('!'));
  if (allows.length === 0) return fail('Allow at least one permission.');
  const existing = draft.id ? snap.access.roles.find((role) => role.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('This role does not exist.');
  if (existing?.system) return fail('System roles cannot be changed. Duplicate the role to make your own.');
  if (existing && existing.ownerOrgId !== draft.ownerOrgId) return fail('This role belongs to another organization.');
  const clash = rolesOf(snap.access.roles, draft.ownerOrgId, true).find((role) => role.id !== draft.id && role.name.trim().toLowerCase() === name.toLowerCase());
  if (clash) return fail(`A role called "${clash.name}" already exists.`);
  const problem = escalationProblem(snap, actor.id, draft.permissions, draft.ownerOrgId);
  if (problem) return fail(problem);
  if (existing && existing.level !== draft.level && peopleWithRole(snap, existing.id).length > 0) return fail('The level cannot change while people hold the role.');

  const id = existing?.id ?? nextId(`role-${slugify(name) || 'custom'}`, snap.access.roles.map((role) => role.id));
  const role: RoleDef = { ...(existing ?? { system: false }), id, name, description: draft.description.trim(), level: draft.level, permissions: draft.permissions, system: false, ownerOrgId: draft.ownerOrgId };
  const roles = existing ? snap.access.roles.map((item) => (item.id === id ? role : item)) : [...snap.access.roles, role];
  const next: Snapshot = { ...snap, access: { ...snap.access, roles } };
  return { ok: true, snap: record(next, { orgId: draft.ownerOrgId, kind: 'role', summary: `${existing ? 'Updated' : 'Created'} the role "${name}".` }, actor, now), roleId: id };
}

export function setRoleArchived(snap: Snapshot, roleId: string, archived: boolean, actor: Actor, now: string, reason?: string): Res {
  const role = snap.access.roles.find((item) => item.id === roleId);
  if (!role) return fail('This role does not exist.');
  if (role.system) return fail('System roles cannot be archived.');
  if (archived) {
    const people = peopleWithRole(snap, roleId);
    if (people.length > 0) return fail(`${people.length} ${people.length === 1 ? 'person holds' : 'people hold'} this role (${people.slice(0, 3).join(', ')}${people.length > 3 ? ', ...' : ''}). Move them to another role first.`);
    if ((reason ?? '').trim().length < 3) return fail('Write a reason.');
  }
  const roles = snap.access.roles.map((item) => (item.id === roleId ? { ...item, archived } : item));
  const next: Snapshot = { ...snap, access: { ...snap.access, roles } };
  return { ok: true, snap: record(next, { orgId: role.ownerOrgId ?? '', kind: 'role', summary: `${archived ? 'Archived' : 'Restored'} the role "${role.name}".`, reason: reason?.trim() || undefined }, actor, now) };
}

export function setRoleScope(snap: Snapshot, roleId: string, scope: RoleScope, actor: Actor, now: string): Res {
  const role = snap.access.roles.find((item) => item.id === roleId);
  if (!role) return fail('This role does not exist.');
  if (role.system) return fail('The scope of a system role cannot be changed. Duplicate the role to make your own.');
  if (JSON.stringify(role.scope ?? null) === JSON.stringify(scope)) return fail('Nothing was changed.');
  const roles = snap.access.roles.map((item) => (item.id === roleId ? { ...item, scope } : item));
  const next: Snapshot = { ...snap, access: { ...snap.access, roles } };
  return { ok: true, snap: record(next, { orgId: role.ownerOrgId ?? '', kind: 'role', summary: `Changed the data scope of the role "${role.name}".` }, actor, now) };
}

// ---------- audit
/** Notes that a person was refused. The same refusal is not written twice in one minute. */
export function recordDenied(snap: Snapshot, event: { orgId: string; instId?: string; byName: string; detail: string }, now: string): Snapshot {
  const minute = now.slice(0, 16);
  if (snap.world.audit.some((item) => item.byName === event.byName && item.detail === event.detail && item.instId === event.instId && item.at.slice(0, 16) === minute)) return snap;
  const item: AuditEvent = { id: nextId('aud', snap.world.audit.map((entry) => entry.id)), at: now, kind: 'access_denied', ...event };
  return { ...snap, world: { ...snap.world, audit: [item, ...snap.world.audit].slice(0, 500) } };
}

/** For tests and the explainer: does a pattern list allow a key. */
export const patternsAllow = (patterns: string[], key: string) => matchesAny(patterns.filter((pattern) => !pattern.startsWith('!')), key) && !matchesAny(patterns.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1)), key);
