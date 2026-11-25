import { recordFeatureModules } from '../records/registry';
import type { ModuleDef } from './registry-types';
import type { ProfileKind } from '../org/types';
import { actionsOf, DEFAULT_ACTIONS } from './registry-types';
import type { FeatureDef } from './registry-types';

export type { FeatureDef, ModuleDef };
export { actionsOf, DEFAULT_ACTIONS };

/**
 * Registry of modules and features that exist in the portal.
 * Modules built from collections (see core/records) are added at the end.
 * Feature key: module.feature   Permission key: module.feature.action
 */
const ALL = 'all' as const;
const SCHOOL: ProfileKind[] = ['school'];

const STATIC_MODULES: ModuleDef[] = [
  {
    key: 'home',
    label: 'Home',
    description: 'Landing page and summary of what needs attention.',
    profiles: ALL,
    features: [{ key: 'home.overview', label: 'Overview', description: 'Summary cards and shortcuts.', required: true, actions: ['view'] }],
  },
  {
    key: 'inbox',
    label: 'Tasks and approvals',
    description: 'Items waiting for you and requests you can approve.',
    profiles: ALL,
    features: [
      { key: 'inbox.tasks', label: 'Task and approval inbox', description: 'Pending tasks, approvals and notifications.', required: true, actions: ['view', 'edit', 'approve', 'reject'] },
    ],
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'Dates for the institution.',
    profiles: ALL,
    features: [{ key: 'calendar.events', label: 'Calendar', description: 'Month view of events and deadlines.', actions: ['view', 'create', 'edit', 'archive'] }],
  },
  {
    key: 'help',
    label: 'Help',
    description: 'Guides and support.',
    profiles: ALL,
    features: [{ key: 'help.center', label: 'Help centre', description: 'Guides, shortcuts and demo data controls.', required: true, actions: ['view'] }],
  },
  {
    key: 'profile',
    label: 'Account',
    description: 'Your own account and preferences.',
    profiles: ALL,
    features: [{ key: 'profile.account', label: 'Profile and preferences', description: 'Language, display and notification choices.', required: true, actions: ['view'] }],
  },
  {
    key: 'org',
    label: 'Organization',
    description: 'Run a group, trust or university: profile, institutions, structure, relationships and policies.',
    profiles: ALL,
    features: [
      { key: 'org.profile', label: 'Organization profile', description: 'Legal details and contacts of the organization.', required: true, actions: ['view', 'edit'] },
      { key: 'org.institutions', label: 'Institutions', description: 'Directory of institutions, adding and approving them.', required: true, actions: ['view', 'create', 'edit', 'approve', 'export'] },
      { key: 'org.hierarchy', label: 'Hierarchy', description: 'Regions, zones, faculties and the institutions in them.', required: true, actions: ['view', 'create', 'edit', 'archive'] },
      { key: 'org.relationships', label: 'Relationships', description: 'How each institution relates to the organization.', required: true, actions: ['view', 'create', 'edit', 'archive', 'approve'] },
      { key: 'org.policies', label: 'Governance policies', description: 'Rules the organization enforces on its institutions.', required: true, actions: ['view', 'configure'] },
      { key: 'org.featurepolicy', label: 'Feature policy', description: 'Which features each institution must have, may choose, or cannot use.', required: true, actions: ['view', 'configure'] },
    ],
  },
  {
    key: 'institution',
    label: 'Institution setup',
    description: 'Profile, campuses, sessions, curriculum, linking, data sharing, billing and history.',
    profiles: ALL,
    features: [
      { key: 'institution.profile', label: 'Institution profile', description: 'Details, structure and status of one institution.', required: true, actions: ['view', 'edit'] },
      { key: 'institution.campuses', label: 'Campuses', description: 'Campuses and branches.', required: true, actions: ['view', 'create', 'edit', 'archive', 'export'] },
      { key: 'institution.sessions', label: 'Academic sessions', description: 'Sessions, terms and semesters.', required: true, actions: ['view', 'create', 'edit'] },
      { key: 'institution.curriculum', label: 'Curriculum', description: 'Board, grading scheme, stages and programmes.', required: true, actions: ['view', 'edit'] },
      { key: 'institution.links', label: 'Linking requests', description: 'Joining or inviting an organization.', required: true, actions: ['view', 'create', 'approve'] },
      { key: 'institution.sharing', label: 'Data sharing', description: 'What an independent institution shares with its parent.', required: true, actions: ['view', 'create', 'edit'] },
      { key: 'institution.billing', label: 'Subscription and billing', description: 'Plan, usage and invoices. Read only.', required: true, actions: ['view', 'create'] },
      { key: 'institution.history', label: 'Change history', description: 'Who changed what, and why.', required: true, actions: ['view', 'export'] },
    ],
  },
  {
    key: 'access',
    label: 'Features and access',
    description: 'Plan, feature switches, roles, permissions, data scope, and the audit trail.',
    profiles: ALL,
    features: [
      { key: 'access.entitlements', label: 'Plan entitlements', description: 'What the subscription includes. Read only.', required: true, actions: ['view'] },
      { key: 'access.features', label: 'Feature configuration', description: 'Switch optional features on or off for the institution.', required: true, actions: ['view', 'edit'] },
      { key: 'access.dependencies', label: 'Feature dependencies', description: 'Which features need which.', required: true, actions: ['view'] },
      { key: 'access.roles', label: 'Roles and permissions', description: 'Roles, the permission builder and templates.', required: true, actions: ['view', 'create', 'edit', 'archive'] },
      { key: 'access.scope', label: 'Data scope rules', description: 'How much data each role can reach.', required: true, actions: ['view', 'edit'] },
      { key: 'access.explainer', label: 'Access explainer', description: 'Why a person can or cannot do something.', required: true, actions: ['view'] },
      { key: 'access.audit', label: 'Audit log', description: 'Security relevant events.', required: true, actions: ['view', 'export'] },
      { key: 'access.confighistory', label: 'Configuration history', description: 'Earlier feature settings and how to go back.', required: true, actions: ['view', 'edit'] },
    ],
  },
  // ----- Existing school screens. Rebuilt in later milestones, then widened to other profiles.
  {
    key: 'students',
    label: 'Students',
    description: 'Student records.',
    profiles: SCHOOL,
    features: [
      { key: 'students.directory', label: 'Student directory', description: 'Search and open student records.' },
      { key: 'students.profile', label: 'Student profile', description: 'Details, parents, fees and attendance of one student.', dependsOn: ['students.directory'] },
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
    description: 'Teaching and non-teaching staff: records, structure, assignments, duties, access, exits.',
    profiles: ALL,
    features: [
      { key: 'staff.directory', label: 'Staff directory', description: 'People who work at the institution, and adding them.', actions: ['view', 'create', 'edit', 'archive', 'export', 'import'] },
      { key: 'staff.profile', label: 'Staff profile', description: 'Employment, qualifications and documents of one person.', dependsOn: ['staff.directory'], actions: ['view', 'edit'] },
      { key: 'staff.structure', label: 'Designations and departments', description: 'Designations, job profiles, departments and who reports to whom.', dependsOn: ['staff.directory'], actions: ['view', 'create', 'edit', 'archive'] },
      { key: 'staff.assignments', label: 'Teaching assignments', description: 'Which teacher takes which class and subject, and the workload.', dependsOn: ['staff.directory'], actions: ['view', 'create', 'edit', 'archive'] },
      { key: 'staff.duties', label: 'Additional duties', description: 'Class teacher, exam coordinator and other duties.', dependsOn: ['staff.directory'], actions: ['view', 'create', 'edit', 'archive'] },
      { key: 'staff.delegation', label: 'Delegation', description: 'Hand over permissions to a colleague for a period.', dependsOn: ['staff.directory'], actions: ['view', 'create', 'archive'] },
      { key: 'staff.access', label: 'Staff access', description: 'Sign-in accounts, roles, individual permissions and co-administrators.', dependsOn: ['staff.directory'], actions: ['view', 'edit', 'assign'] },
      { key: 'staff.exits', label: 'Transfers and exits', description: 'Moving staff to another institution, resignation, retirement.', dependsOn: ['staff.directory'], actions: ['view', 'create', 'edit'] },
      { key: 'staff.analytics', label: 'Staff analytics', description: 'Headcount, structure, workload and attrition.', dependsOn: ['staff.directory'], actions: ['view', 'export'] },
      { key: 'staff.policies', label: 'Staff policies', description: 'Probation, notice period, workload limits, employee numbers and required documents.', dependsOn: ['staff.directory'], actions: ['view', 'configure'] },
    ],
  },
  {
    key: 'families',
    label: 'Parents and guardians',
    description: 'Family records linked to students.',
    profiles: SCHOOL,
    features: [{ key: 'families.guardians', label: 'Parents and guardians', description: 'Parent records and their children.', dependsOn: ['students.directory'] }],
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'Counts and exports of every kind of record.',
    profiles: ALL,
    features: [{ key: 'reports.catalog', label: 'Report catalog', description: 'Generate and download reports.' }],
  },
];

export const MODULES: ModuleDef[] = [...STATIC_MODULES, ...recordFeatureModules()];

const featureIndex = new Map<string, { feature: FeatureDef; module: ModuleDef }>();
MODULES.forEach((module) => module.features.forEach((feature) => featureIndex.set(feature.key, { feature, module })));

export function getFeature(key: string): FeatureDef | undefined {
  return featureIndex.get(key)?.feature;
}

export function getModuleOf(featureKey: string): ModuleDef | undefined {
  return featureIndex.get(featureKey)?.module;
}

export function allFeatureKeys(): string[] {
  return Array.from(featureIndex.keys());
}

export function moduleAppliesTo(module: ModuleDef, profile: ProfileKind): boolean {
  return module.profiles === 'all' || module.profiles.includes(profile);
}
