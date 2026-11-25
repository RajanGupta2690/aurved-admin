/** Starting points for a new role. They are copied, never shared, so changing a role never changes a template. */
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  level: 'inst' | 'org';
  permissions: string[];
}

const BASE = ['home.*', 'inbox.tasks.view', 'inbox.tasks.edit', 'calendar.*.view', 'help.*', 'profile.*'];

export const ROLE_TEMPLATES: RoleTemplate[] = [
  { id: 'tpl-front-desk', name: 'Front desk', description: 'Enquiries, applications and the student directory. Cannot see fees or academics.', level: 'inst', permissions: [...BASE, 'admissions.*', 'students.directory.view', 'families.*.view'] },
  { id: 'tpl-class-teacher', name: 'Class teacher', description: 'Attendance, homework and exams for assigned classes. Reads the timetable.', level: 'inst', permissions: [...BASE, 'students.directory.view', 'students.profile.view', 'attendance.students.*', 'academics.homework.*', 'academics.structure.view', 'timetable.classes.view', 'examinations.exams.view'] },
  { id: 'tpl-accounts', name: 'Accounts clerk', description: 'Fee records and payments. Sees the student list only.', level: 'inst', permissions: [...BASE, 'finance.*', 'students.directory.view', 'reports.*.view'] },
  { id: 'tpl-library', name: 'Library desk', description: 'Catalog, issue and return.', level: 'inst', permissions: [...BASE, 'library.*', 'students.directory.view'] },
  { id: 'tpl-transport', name: 'Transport desk', description: 'Vehicles, routes and drivers.', level: 'inst', permissions: [...BASE, 'transport.*', 'students.directory.view'] },
  { id: 'tpl-exam-cell', name: 'Exam cell', description: 'Plans exams and publishes results.', level: 'inst', permissions: [...BASE, 'examinations.*', 'academics.structure.view', 'timetable.classes.view', 'attendance.students.view'] },
  { id: 'tpl-auditor', name: 'Read-only auditor', description: 'Can view every screen of the institution and change nothing. Organization pages stay closed.', level: 'inst', permissions: ['*.*.view', '!org.*', 'inbox.tasks.edit'] },
  { id: 'tpl-config-admin', name: 'Setup administrator', description: 'Institution setup, features and roles. No student or finance data.', level: 'inst', permissions: [...BASE, 'institution.*', 'access.*', '!access.audit.export'] },
  { id: 'tpl-group-academic', name: 'Group academic head', description: 'Organization wide view of institutions, sessions and curriculum. No policy changes.', level: 'org', permissions: [...BASE, 'org.institutions.view', 'org.hierarchy.view', 'institution.sessions.view', 'institution.curriculum.view', 'institution.campuses.view', 'institution.history.view'] },
  { id: 'tpl-group-finance', name: 'Group finance head', description: 'Organization wide billing and fee summaries.', level: 'org', permissions: [...BASE, 'institution.billing.view', 'org.institutions.view', 'finance.fees.view', 'reports.*.view'] },
];
