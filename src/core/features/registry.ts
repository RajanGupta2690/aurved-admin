import type { ProfileKind } from '../org/types';

/**
 * Registry of modules and features that exist in the portal.
 * Navigation, route guards, the feature matrix and permissions all read this one list.
 * A feature is added here in the milestone that builds it, never before.
 * Feature key: module.feature   Permission key: module.feature.action
 */
export interface FeatureDef {
  key: string;
  label: string;
  description: string;
  /** Other features that must be available first. */
  dependsOn?: string[];
  /** Cannot be switched off by an institution (the platform needs it). */
  required?: boolean;
}

export interface ModuleDef {
  key: string;
  label: string;
  description: string;
  /** Profiles this module applies to. */
  profiles: ProfileKind[] | 'all';
  features: FeatureDef[];
}

const ALL = 'all' as const;
const SCHOOL: ProfileKind[] = ['school'];

export const MODULES: ModuleDef[] = [
  {
    key: 'home',
    label: 'Home',
    description: 'Landing page and summary of what needs attention.',
    profiles: ALL,
    features: [{ key: 'home.overview', label: 'Overview', description: 'Summary cards and shortcuts.', required: true }],
  },
  {
    key: 'inbox',
    label: 'Tasks and approvals',
    description: 'Items waiting for you and requests you can approve.',
    profiles: ALL,
    features: [
      { key: 'inbox.tasks', label: 'Task and approval inbox', description: 'Pending tasks, approvals and notifications.', required: true },
    ],
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'Dates for the institution.',
    profiles: ALL,
    features: [{ key: 'calendar.events', label: 'Calendar', description: 'Month view of events and deadlines.' }],
  },
  {
    key: 'help',
    label: 'Help',
    description: 'Guides and support.',
    profiles: ALL,
    features: [{ key: 'help.center', label: 'Help centre', description: 'Guides, shortcuts and demo data controls.', required: true }],
  },
  {
    key: 'profile',
    label: 'Account',
    description: 'Your own account and preferences.',
    profiles: ALL,
    features: [{ key: 'profile.account', label: 'Profile and preferences', description: 'Language, display and notification choices.', required: true }],
  },
  {
    key: 'org',
    label: 'Organization',
    description: 'Run a group, trust or university: profile, institutions, structure, relationships and policies.',
    profiles: ALL,
    features: [
      { key: 'org.profile', label: 'Organization profile', description: 'Legal details and contacts of the organization.', required: true },
      { key: 'org.institutions', label: 'Institutions', description: 'Directory of institutions, adding and approving them.', required: true },
      { key: 'org.hierarchy', label: 'Hierarchy', description: 'Regions, zones, faculties and the institutions in them.', required: true },
      { key: 'org.relationships', label: 'Relationships', description: 'How each institution relates to the organization.', required: true },
      { key: 'org.policies', label: 'Governance policies', description: 'Rules the organization enforces on its institutions.', required: true },
    ],
  },
  {
    key: 'institution',
    label: 'Institution setup',
    description: 'Profile, campuses, sessions, curriculum, linking, data sharing, billing and history.',
    profiles: ALL,
    features: [
      { key: 'institution.profile', label: 'Institution profile', description: 'Details, structure and status of one institution.', required: true },
      { key: 'institution.campuses', label: 'Campuses', description: 'Campuses and branches.', required: true },
      { key: 'institution.sessions', label: 'Academic sessions', description: 'Sessions, terms and semesters.', required: true },
      { key: 'institution.curriculum', label: 'Curriculum', description: 'Board, grading scheme, stages and programmes.', required: true },
      { key: 'institution.links', label: 'Linking requests', description: 'Joining or inviting an organization.', required: true },
      { key: 'institution.sharing', label: 'Data sharing', description: 'What an independent institution shares with its parent.', required: true },
      { key: 'institution.billing', label: 'Subscription and billing', description: 'Plan, usage and invoices. Read only.', required: true },
      { key: 'institution.history', label: 'Change history', description: 'Who changed what, and why.', required: true },
    ],
  },
  // ----- Existing school screens. Rebuilt in later milestones, then widened to other profiles.
  {
    key: 'admissions',
    label: 'Admissions',
    description: 'Enquiries and applications.',
    profiles: SCHOOL,
    features: [{ key: 'admissions.applications', label: 'Enquiries and applications', description: 'Track enquiries and applications.' }],
  },
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
    label: 'Teachers and staff',
    description: 'Staff directory.',
    profiles: SCHOOL,
    features: [{ key: 'staff.directory', label: 'Staff directory', description: 'People who work at the institution.' }],
  },
  {
    key: 'families',
    label: 'Parents and guardians',
    description: 'Family records linked to students.',
    profiles: SCHOOL,
    features: [{ key: 'families.guardians', label: 'Parents and guardians', description: 'Parent records and their children.', dependsOn: ['students.directory'] }],
  },
  {
    key: 'academics',
    label: 'Academics',
    description: 'Sessions, classes, subjects and homework.',
    profiles: SCHOOL,
    features: [
      { key: 'academics.structure', label: 'Sessions, classes and subjects', description: 'Academic structure of the school.' },
      { key: 'academics.homework', label: 'Homework', description: 'Assign and track homework.', dependsOn: ['academics.structure'] },
    ],
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Student attendance.',
    profiles: SCHOOL,
    features: [{ key: 'attendance.students', label: 'Student attendance', description: 'Mark and review daily attendance.', dependsOn: ['students.directory'] }],
  },
  {
    key: 'timetable',
    label: 'Timetable',
    description: 'Class timetables.',
    profiles: SCHOOL,
    features: [{ key: 'timetable.classes', label: 'Class timetable', description: 'Weekly periods for each class.', dependsOn: ['academics.structure'] }],
  },
  {
    key: 'examinations',
    label: 'Examinations',
    description: 'Exam schedule and results.',
    profiles: SCHOOL,
    features: [{ key: 'examinations.exams', label: 'Exams', description: 'Plan exams and view results.', dependsOn: ['academics.structure'] }],
  },
  {
    key: 'finance',
    label: 'Fees and accounts',
    description: 'Fee collection.',
    profiles: SCHOOL,
    features: [{ key: 'finance.fees', label: 'Fee collection', description: 'Fee records and payments.', dependsOn: ['students.directory'] }],
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Notices and announcements.',
    profiles: SCHOOL,
    features: [{ key: 'communication.notices', label: 'Notices', description: 'Publish notices and announcements.' }],
  },
  {
    key: 'transport',
    label: 'Transport',
    description: 'Vehicles, routes and drivers.',
    profiles: SCHOOL,
    features: [{ key: 'transport.fleet', label: 'Vehicles and routes', description: 'Vehicles, routes, stops and drivers.' }],
  },
  {
    key: 'library',
    label: 'Library',
    description: 'Books and issue records.',
    profiles: SCHOOL,
    features: [{ key: 'library.catalog', label: 'Catalog and issue', description: 'Books, issue and return.' }],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Stock items.',
    profiles: SCHOOL,
    features: [{ key: 'inventory.stock', label: 'Stock', description: 'Items and stock levels.' }],
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'Reports and exports.',
    profiles: SCHOOL,
    features: [{ key: 'reports.catalog', label: 'Report catalog', description: 'Generate and download reports.' }],
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Institution settings.',
    profiles: SCHOOL,
    features: [{ key: 'settings.general', label: 'General settings', description: 'Basic institution settings.' }],
  },
];

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
