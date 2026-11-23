import type { FeatureConfig } from '../../core/features/resolve';
import type { Persona, RoleDef } from '../../core/access/engine';
import { MODULES } from '../../core/features/registry';

/** DEMO DATA. Starting roles, people and feature settings. */

/** Everyone may open Home, see their inbox and finish tasks. Deciding approvals and editing the calendar is given by role. */
const BASE = ['home.*', 'inbox.tasks.view', 'inbox.tasks.edit', 'calendar.*.view', 'help.*', 'profile.*'];

export const DEMO_ROLES: RoleDef[] = [
  { id: 'org_admin', name: 'Organization administrator', description: 'Full control of the organization and every institution in it.', level: 'org', permissions: ['*'], system: true },
  { id: 'inst_admin', name: 'Institution administrator', description: 'Full control of one institution.', level: 'inst', permissions: ['*', '!org.*'], system: true },
  {
    id: 'principal',
    name: 'Principal',
    description: 'Academic and operational overview of the school. No fee collection.',
    level: 'inst',
    permissions: [...BASE, 'inbox.tasks.approve', 'inbox.tasks.reject', 'calendar.events.create', 'calendar.events.archive', 'students.*', 'families.*', 'academics.*', 'attendance.*', 'timetable.*', 'examinations.*', 'communication.*', 'reports.*.view', 'finance.fees.view', 'staff.*.view'],
    system: true,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Marks attendance and sets homework for assigned classes.',
    level: 'inst',
    permissions: [
      ...BASE,
      'students.directory.view',
      'students.profile.view',
      'attendance.students.view',
      'attendance.students.create',
      'attendance.students.edit',
      'academics.structure.view',
      'academics.homework.*',
      'timetable.classes.view',
      'examinations.exams.view',
      'communication.notices.view',
    ],
    system: true,
  },
  {
    id: 'accountant',
    name: 'Accountant',
    description: 'Fee records and payments. No academic data beyond the student list.',
    level: 'inst',
    permissions: [...BASE, 'finance.*', 'students.directory.view', 'reports.*.view'],
    system: true,
  },
  { id: 'librarian', name: 'Librarian', description: 'Library catalog and issue.', level: 'inst', permissions: [...BASE, 'library.*', 'students.directory.view'], system: true },
  { id: 'transport_manager', name: 'Transport manager', description: 'Vehicles, routes and drivers.', level: 'inst', permissions: [...BASE, 'transport.*', 'students.directory.view'], system: true },
  { id: 'admission_officer', name: 'Admission officer', description: 'Enquiries and applications.', level: 'inst', permissions: [...BASE, 'admissions.*', 'students.directory.view', 'families.*.view'], system: true },
];

export const DEMO_PERSONAS: Persona[] = [
  { id: 'p-sunrise-admin', name: 'Rajesh Kumar', title: 'School administrator', email: 'rajesh.kumar@sunrise.demo', memberships: [{ scope: { type: 'inst', id: 'inst-sunrise' }, roleIds: ['inst_admin'] }] },
  { id: 'p-sunrise-principal', name: 'Dr. Meera Iyer', title: 'Principal', email: 'meera.iyer@sunrise.demo', memberships: [{ scope: { type: 'inst', id: 'inst-sunrise' }, roleIds: ['principal'] }] },
  { id: 'p-sunrise-teacher', name: 'Priya Sharma', title: 'Teacher', email: 'priya.sharma@sunrise.demo', memberships: [{ scope: { type: 'inst', id: 'inst-sunrise' }, roleIds: ['teacher'] }] },
  { id: 'p-sunrise-accountant', name: 'Sunita Verma', title: 'Accountant', email: 'sunita.verma@sunrise.demo', memberships: [{ scope: { type: 'inst', id: 'inst-sunrise' }, roleIds: ['accountant'] }] },
  { id: 'p-sunrise-librarian', name: 'Amit Patel', title: 'Librarian', email: 'amit.patel@sunrise.demo', memberships: [{ scope: { type: 'inst', id: 'inst-sunrise' }, roleIds: ['librarian'] }] },
  { id: 'p-horizon-admin', name: 'Anita Rao', title: 'Trust administrator', email: 'anita.rao@horizon.demo', memberships: [{ scope: { type: 'org', id: 'org-horizon' }, roleIds: ['org_admin'] }] },
  { id: 'p-horizon-branch-b', name: 'Karan Singh', title: 'Branch administrator, Jaipur', email: 'karan.singh@horizon.demo', memberships: [{ scope: { type: 'inst', id: 'inst-horizon-b' }, roleIds: ['inst_admin'] }] },
  {
    id: 'p-horizon-multi',
    name: 'Vikram Desai',
    title: 'Teacher in Delhi, branch administrator in Lucknow',
    email: 'vikram.desai@horizon.demo',
    memberships: [
      { scope: { type: 'inst', id: 'inst-horizon-a' }, roleIds: ['teacher'] },
      { scope: { type: 'inst', id: 'inst-horizon-c' }, roleIds: ['inst_admin'] },
    ],
  },
  { id: 'p-meridian-admin', name: 'Prof. R. Nair', title: 'University administrator', email: 'r.nair@meridian.demo', memberships: [{ scope: { type: 'org', id: 'org-meridian' }, roleIds: ['org_admin'] }] },
  { id: 'p-meridian-eng', name: 'Dr. S. Kulkarni', title: 'Principal, Kaveri Engineering College', email: 's.kulkarni@kaveri.demo', memberships: [{ scope: { type: 'inst', id: 'inst-mer-eng' }, roleIds: ['inst_admin'] }] },
  { id: 'p-greenfield-admin', name: 'Neha Kapoor', title: 'College administrator', email: 'neha.kapoor@greenfield.demo', memberships: [{ scope: { type: 'inst', id: 'inst-greenfield' }, roleIds: ['inst_admin'] }] },
  { id: 'p-lakeside-admin', name: 'Omar Farouk', title: 'Institute administrator', email: 'omar.farouk@lakeside.demo', memberships: [{ scope: { type: 'inst', id: 'inst-lakeside' }, roleIds: ['inst_admin'] }] },
];

export const DEFAULT_PERSONA_ID = 'p-sunrise-admin';

/** Every module key except the given ones, as entitlement patterns. */
function allExcept(excluded: string[]): string[] {
  return MODULES.filter((module) => !excluded.includes(module.key)).map((module) => `${module.key}.*`);
}

const FULL: FeatureConfig = { entitlements: ['*'], policy: {}, local: {} };

/** DEMO DATA. Plans, trust policies and local switches. Keys are institution ids. */
export const DEMO_FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  'inst-sunrise': { ...FULL },
  'inst-greenfield': { ...FULL },
  // Trust example: four branches, four different feature sets.
  'inst-horizon-a': { entitlements: ['*'], policy: { 'communication.notices': 'mandatory' }, local: {} },
  'inst-horizon-b': { entitlements: allExcept(['transport']), policy: { 'communication.notices': 'mandatory' }, local: {} },
  'inst-horizon-c': { entitlements: ['*'], policy: { 'communication.notices': 'mandatory', inventory: 'locked_off' }, local: { library: false } },
  'inst-horizon-d': { entitlements: ['*'], policy: { 'communication.notices': 'mandatory', reports: 'locked_off' }, local: {} },
  'inst-meridian': { ...FULL },
  'inst-mer-sci': { ...FULL },
  'inst-mer-arts': { ...FULL },
  'inst-mer-eng': { ...FULL },
  'inst-mer-med': { ...FULL },
  'inst-mer-law': { ...FULL },
  'inst-mer-ptr': { ...FULL },
  'inst-lakeside': { ...FULL },
};
