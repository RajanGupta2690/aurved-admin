/**
 * Staff and workforce. Three things are kept apart:
 *  - the person (name, contact)
 *  - the employment at one institution (designation, department, status)
 *  - the sign-in account (a persona with roles), which may not exist, and ends when employment ends
 */
export type StaffCategory = 'teaching' | 'non_teaching';
export type EmploymentType = 'permanent' | 'contract' | 'visiting' | 'part_time';
export type StaffStatus = 'probation' | 'active' | 'on_leave' | 'resigned' | 'terminated' | 'retired' | 'transferred';

export const CATEGORY_LABEL: Record<StaffCategory, string> = { teaching: 'Teaching', non_teaching: 'Non-teaching' };
export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = { permanent: 'Permanent', contract: 'Contract', visiting: 'Visiting', part_time: 'Part time' };
export const STATUS_LABEL: Record<StaffStatus, string> = {
  probation: 'On probation',
  active: 'Active',
  on_leave: 'On leave',
  resigned: 'Resigned',
  terminated: 'Terminated',
  retired: 'Retired',
  transferred: 'Transferred out',
};
export const EXITED: StaffStatus[] = ['resigned', 'terminated', 'retired', 'transferred'];
export const isExited = (status: StaffStatus) => EXITED.includes(status);

export interface Qualification {
  id: string;
  degree: string;
  institution: string;
  year: number;
}

export interface Experience {
  id: string;
  organization: string;
  role: string;
  from: string;
  to: string;
}

export interface StaffDocument {
  id: string;
  type: string;
  name: string;
  expires?: string;
  verified: boolean;
}

export const DOCUMENT_TYPES = ['Identity proof', 'Address proof', 'Degree certificate', 'Experience letter', 'Appointment letter', 'Police verification', 'Medical fitness', 'Teaching licence'];

export type Shift = 'day' | 'morning' | 'evening' | 'rotational';
export const SHIFT_LABEL: Record<Shift, string> = { day: 'Day', morning: 'Morning', evening: 'Evening', rotational: 'Rotational' };
/** Where a non-teaching person works. */
export const WORK_AREAS = ['Administration', 'Accounts', 'Reception', 'Library', 'Laboratory', 'Transport', 'Security', 'Housekeeping', 'Maintenance', 'Medical room', 'Hostel', 'Kitchen', 'IT support'];

/** What the person does besides the designation. Teaching staff list the subjects they can take. Others have a work area and shift. */
export interface StaffWork {
  subjects?: string[];
  area?: string;
  shift?: Shift;
}

export interface StaffMember {
  id: string;
  instId: string;
  person: { fullName: string; gender: '' | 'female' | 'male' | 'other'; dob: string; phone: string; email: string; address: string };
  employment: {
    employeeId: string;
    category: StaffCategory;
    designationId: string;
    departmentId: string;
    reportsToId: string | null;
    joinDate: string;
    type: EmploymentType;
    status: StaffStatus;
    campusId: string;
    exitDate?: string;
    exitReason?: string;
  };
  qualifications: Qualification[];
  experience: Experience[];
  documents: StaffDocument[];
  /** Persona id of the sign-in account. Null when the person has none. */
  accountId: string | null;
  work?: StaffWork;
}

export interface Designation {
  id: string;
  instId: string;
  name: string;
  category: StaffCategory;
  /** 1 is the top. Used to order the reporting structure. */
  level: number;
  summary: string;
  responsibilities: string[];
  minQualification: string;
  active: boolean;
}

export interface Department {
  id: string;
  instId: string;
  name: string;
  headId: string | null;
  active: boolean;
}

export interface TeachingAssignment {
  id: string;
  instId: string;
  staffId: string;
  sessionId: string;
  group: string;
  subject: string;
  periods: number;
  status: 'active' | 'ended';
}

export interface Duty {
  id: string;
  instId: string;
  staffId: string;
  title: string;
  from: string;
  to?: string;
  note?: string;
  status: 'active' | 'ended';
  /** Set when the duty is for one event. The duty ends when the event is held or cancelled. */
  eventId?: string;
  eventTitle?: string;
  /** What the person does at the event, for example Stage and sound. Also the title of the duty. */
  role?: string;
}

export interface Delegation {
  id: string;
  instId: string;
  fromId: string;
  toId: string;
  permissions: string[];
  from: string;
  to: string;
  reason: string;
  status: 'active' | 'ended' | 'revoked';
}

export interface StaffPolicy {
  maxPeriodsPerWeek: number;
  probationMonths: number;
  noticeDays: number;
  employeeIdPrefix: string;
  requiredDocuments: string[];
}

export const DEFAULT_STAFF_POLICY: StaffPolicy = {
  maxPeriodsPerWeek: 30,
  probationMonths: 6,
  noticeDays: 30,
  employeeIdPrefix: 'EMP',
  requiredDocuments: ['Identity proof', 'Appointment letter'],
};

export interface StaffEvent {
  id: string;
  at: string;
  instId: string;
  staffId?: string;
  byName: string;
  summary: string;
}

export interface TeachingBank {
  groups: string[];
  subjects: string[];
}

export interface StaffState {
  members: StaffMember[];
  designations: Designation[];
  departments: Department[];
  assignments: TeachingAssignment[];
  duties: Duty[];
  delegations: Delegation[];
  /** Policy per institution id, or per organization id as the default for the institutions it runs. */
  policies: Record<string, StaffPolicy>;
  /** Classes and subjects an institution can assign. Rebuilt from Academics when that module is rebuilt. */
  banks: Record<string, TeachingBank>;
  events: StaffEvent[];
}

export const DUTY_TITLES = ['Class teacher', 'Exam coordinator', 'Timetable in-charge', 'Admission in-charge', 'Transport in-charge', 'Sports in-charge', 'Discipline committee', 'Library in-charge', 'Examination invigilator'];

/** Jobs at an event. The person can also type another. */
export const EVENT_ROLES = ['Coordinator', 'Stage and sound', 'Registration desk', 'Discipline and crowd', 'First aid', 'Hospitality', 'Transport', 'Refreshments', 'Photography', 'Judge', 'Invigilator'];
