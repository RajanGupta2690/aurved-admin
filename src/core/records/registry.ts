import { COLLEGE_MODULES, SHARED_MODULES } from '../../data/collections/college';
import { OPS_MODULES } from '../../data/collections/operations';
import { SCHOOL_MODULES } from '../../data/collections/school';
import { SERVICE_MODULES } from '../../data/collections/services';
import { UNIVERSITY_MODULES } from '../../data/collections/university';
import { DEFAULT_ACTIONS } from '../features/registry-types';
import type { ModuleDef } from '../features/registry-types';
import type { CollectionDef, ModuleGroup, RecordRow, RecordsState } from './types';

/** Every module that is built from collections. The menu, the routes and the feature list all come from here. */
export const RECORD_MODULES: ModuleGroup[] = [...SCHOOL_MODULES, ...SHARED_MODULES, ...COLLEGE_MODULES, ...OPS_MODULES, ...UNIVERSITY_MODULES, ...SERVICE_MODULES];

export const allCollections = (): CollectionDef[] => RECORD_MODULES.flatMap((module) => module.collections);
export const collectionByKey = (key: string): CollectionDef | undefined => allCollections().find((def) => def.key === key);
export const moduleOfCollection = (key: string): ModuleGroup | undefined => RECORD_MODULES.find((module) => module.collections.some((def) => def.key === key));

/** The features these modules add. Each collection is a feature, so plan, policy and switches reach it. */
export function recordFeatureModules(): ModuleDef[] {
  return RECORD_MODULES.map((module) => ({
    key: module.key,
    label: module.label,
    description: module.description,
    profiles: module.profiles,
    features: [
      { key: `${module.key}.overview`, label: `${module.label}: overview`, description: 'Summary and shortcuts. Switching it off switches the whole module off.', actions: ['view'] },
      ...module.collections.map((def) => ({
        key: `${module.key}.${def.key}`,
        label: def.title,
        description: def.description,
        dependsOn: [`${module.key}.overview`, ...(def.dependsOn ?? [])],
        actions: Array.from(new Set([...DEFAULT_ACTIONS, ...(def.actions ?? [])])),
      })),
    ],
  }));
}

/** Demo records of every collection. Ids and times are fixed so the demo reads the same every time. */
export function seedRecords(): RecordsState {
  const state: RecordsState = {};
  allCollections().forEach((def) => {
    const rows: RecordRow[] = (def.seeds ?? []).map((item, index) => {
      const at = `2026-11-${String(10 + (index % 9)).padStart(2, '0')}T09:00:00.000Z`;
      const derived = def.derive?.(item.data, { scopeId: item.scopeId, others: [], staff: [], institutions: [], today: '2026-11-20', related: {}, isNew: true, status: item.status ?? def.initialStatus }) ?? {};
      return {
        id: `rec-${def.key}-${index + 1}`,
        collection: def.key,
        scopeId: item.scopeId,
        data: { ...item.data, ...derived },
        status: item.status ?? def.initialStatus,
        createdAt: at,
        createdBy: 'Demo data',
        updatedAt: at,
        history: [{ at, by: 'Demo data', summary: `Created the ${def.singular.toLowerCase()}.` }],
      };
    });
    state[def.key] = rows;
  });
  return state;
}
