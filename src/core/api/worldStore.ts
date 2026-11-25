import { createStore } from './persistedStore';
import { accessStore, featureConfigStore, orgStore, recordsStore, staffStore } from './stores';
import type { Actor, Snapshot, World } from '../org/model';
import type { Res } from '../org/ops';
import { seedWorld } from '../../data/demo/orgData';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Everything around organizations: hierarchy, links, data sharing, sessions, curriculum, policies, billing, history. */
export const worldStore = createStore<World>(
  'world',
  seedWorld,
  (value): value is World =>
    isObject(value) &&
    Array.isArray(value.units) &&
    Array.isArray(value.links) &&
    Array.isArray(value.agreements) &&
    Array.isArray(value.sessions) &&
    Array.isArray(value.curricula) &&
    Array.isArray(value.history) &&
    Array.isArray(value.configHistory) &&
    Array.isArray(value.audit) &&
    isObject(value.policies) &&
    isObject(value.billing),
);

export function snapshot(): Snapshot {
  return { orgs: orgStore.get(), world: worldStore.get(), access: accessStore.get(), features: featureConfigStore.get(), staff: staffStore.get(), records: recordsStore.get() };
}

export function commit(snap: Snapshot) {
  orgStore.set(snap.orgs);
  worldStore.set(snap.world);
  accessStore.set(snap.access);
  featureConfigStore.set(snap.features);
  staffStore.set(snap.staff);
  recordsStore.set(snap.records);
}

export const nowIso = () => new Date().toISOString();

/** Runs one change against the current data and saves it when the rules allow it. */
export function change<E extends object>(operation: (snap: Snapshot, now: string) => Res<E>): Res<E> {
  const result = operation(snapshot(), nowIso());
  if (result.ok) commit(result.snap);
  return result;
}

/**
 * What else a new institution needs besides its record: a feature setup (full plan to start with)
 * and, when someone creates their own institution, a role for that person.
 */
export function afterInstitutionCreated(instId: string, administratorId?: string) {
  featureConfigStore.set((previous) => ({ ...previous, [instId]: { entitlements: ['*'], policy: {}, local: {} } }));
  if (!administratorId) return;
  accessStore.set((previous) => ({
    ...previous,
    personas: previous.personas.map((person) =>
      person.id === administratorId ? { ...person, memberships: [...person.memberships, { scope: { type: 'inst' as const, id: instId }, roleIds: ['inst_admin'] }] } : person,
    ),
  }));
}

export type { Actor };
