import { createStore } from './persistedStore';
import type { Institution, Organization } from '../org/types';
import type { FeatureConfig } from '../features/resolve';
import type { Persona, RoleDef } from '../access/engine';
import type { RecordsState } from '../records/types';
import type { StaffState } from '../staff/model';
import { seedStaff } from '../../data/demo/staffData';
import { seedRecords } from '../records/registry';
import { DEFAULT_INSTITUTION_ID, DEMO_INSTITUTIONS, DEMO_ORGANIZATIONS } from '../../data/demo/tenants';
import { DEFAULT_PERSONA_ID, DEMO_FEATURE_CONFIGS, DEMO_PERSONAS, DEMO_ROLES } from '../../data/demo/access';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const isArray = (value: unknown): value is unknown[] => Array.isArray(value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Organizations and institutions. Edited by Organization management (M3). */
export const orgStore = createStore<{ organizations: Organization[]; institutions: Institution[] }>(
  'org',
  () => ({ organizations: clone(DEMO_ORGANIZATIONS), institutions: clone(DEMO_INSTITUTIONS) }),
  (value): value is { organizations: Organization[]; institutions: Institution[] } =>
    isObject(value) && isArray(value.organizations) && isArray(value.institutions),
);

/** Plans, parent policies and local switches, per institution id. Edited by Feature governance (M4). */
export const featureConfigStore = createStore<Record<string, FeatureConfig>>(
  'features',
  () => clone(DEMO_FEATURE_CONFIGS),
  (value): value is Record<string, FeatureConfig> => isObject(value),
);

/** Roles and people. Edited by Access governance (M4) and Staff (M5). */
export const accessStore = createStore<{ roles: RoleDef[]; personas: Persona[] }>(
  'access',
  () => ({ roles: clone(DEMO_ROLES), personas: clone(DEMO_PERSONAS) }),
  (value): value is { roles: RoleDef[]; personas: Persona[] } => isObject(value) && isArray(value.roles) && isArray(value.personas),
);

/** Staff, designations, departments, assignments, duties and delegations. Edited by Staff (M5). */
export const staffStore = createStore<StaffState>(
  'staff',
  seedStaff,
  (value): value is StaffState => isObject(value) && isArray(value.members) && isArray(value.designations) && isArray(value.departments) && isArray(value.assignments) && isArray(value.duties) && isArray(value.delegations) && isObject(value.policies) && isObject(value.banks) && isArray(value.events),
);

/** Records of every collection (behaviour, exams, invoices, ...), keyed by collection. */
export const recordsStore = createStore<RecordsState>('records', seedRecords, (value): value is RecordsState => isObject(value));

export interface Prefs {
  personaId: string;
  lastInstId: string;
  lastOrgId: string | null;
  campusByInst: Record<string, string>;
  sessionId: string;
  textSize: 'normal' | 'large';
  reduceMotion: boolean;
  locale: string;
  timeZone: string;
  currency: string;
  contrast: 'normal' | 'high';
}

/** What the person chose in this browser. Kept even when demo data is reset. */
export const prefsStore = createStore<Prefs>(
  'prefs',
  () => ({
    personaId: DEFAULT_PERSONA_ID,
    lastInstId: DEFAULT_INSTITUTION_ID,
    lastOrgId: null,
    campusByInst: {},
    sessionId: 'ay-2025-26',
    textSize: 'normal',
    reduceMotion: false,
    locale: 'en-IN',
    timeZone: 'Asia/Kolkata',
    currency: 'INR',
    contrast: 'normal',
  }),
  (value): value is Prefs => isObject(value) && typeof value.personaId === 'string' && typeof value.lastInstId === 'string',
);
