import type { Institution, Organization, ProfileKind, RelationshipType } from './types';

/**
 * Data that sits around organizations and institutions: hierarchy units, linking requests,
 * data-sharing agreements, academic sessions, curriculum, policies, billing and change history.
 * Kept in one demo store (worldStore) so that one action can change several of them together.
 */

// ---------- Hierarchy
export type UnitKind = 'region' | 'zone' | 'cluster' | 'faculty' | 'department' | 'board' | 'other';
export const UNIT_KIND_LABEL: Record<UnitKind, string> = {
  region: 'Region',
  zone: 'Zone',
  cluster: 'Cluster',
  faculty: 'Faculty',
  department: 'Department',
  board: 'Board or council',
  other: 'Other group',
};

/** A grouping of institutions. An institution may sit in several units, so the structure is not a plain tree of institutions. */
export interface OrgUnit {
  id: string;
  orgId: string;
  name: string;
  kind: UnitKind;
  parentId: string | null;
  instIds: string[];
  archived?: boolean;
}

// ---------- Linking
export type LinkStatus = 'awaiting_consent' | 'in_verification' | 'awaiting_approval' | 'approved' | 'rejected' | 'withdrawn';
export const LINK_STATUS_LABEL: Record<LinkStatus, string> = {
  awaiting_consent: 'Waiting for the institution to accept',
  in_verification: 'Documents being verified',
  awaiting_approval: 'Waiting for final approval',
  approved: 'Linked',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};
export const OPEN_LINK_STATUSES: LinkStatus[] = ['awaiting_consent', 'in_verification', 'awaiting_approval'];

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  doneBy?: string;
  doneAt?: string;
}

export interface LinkEvent {
  id: string;
  at: string;
  byName: string;
  action: string;
  note?: string;
}

export interface LinkRequest {
  id: string;
  parentOrgId: string;
  childInstId: string;
  relationship: RelationshipType;
  /** Who started it. An invitation needs the institution to accept first. An application does not. */
  direction: 'invite' | 'apply';
  status: LinkStatus;
  note?: string;
  checklist: ChecklistItem[];
  events: LinkEvent[];
  createdAt: string;
  createdByName: string;
  /** Organization the institution belonged to before linking, kept for the record. */
  previousOrgId?: string;
}

// ---------- Data sharing
export interface ShareDomain {
  key: string;
  label: string;
  description: string;
}

export const SHARE_DOMAINS: ShareDomain[] = [
  { key: 'enrolment', label: 'Enrolment counts', description: 'Number of students by programme or class.' },
  { key: 'results', label: 'Examination results', description: 'Pass rates and result summaries.' },
  { key: 'attendance', label: 'Attendance summary', description: 'Attendance percentages, not names.' },
  { key: 'finance', label: 'Fee and finance summary', description: 'Collected and outstanding totals.' },
  { key: 'staff', label: 'Staff list', description: 'Faculty and staff strength and qualifications.' },
  { key: 'compliance', label: 'Compliance documents', description: 'Licences, inspection reports and audits.' },
];

export type ShareLevel = 'none' | 'summary' | 'full';
export const SHARE_LEVEL_LABEL: Record<ShareLevel, string> = { none: 'Nothing shared', summary: 'Summary only', full: 'Full access' };
export const SHARE_LEVEL_RANK: Record<ShareLevel, number> = { none: 0, summary: 1, full: 2 };

export interface Agreement {
  instId: string;
  domain: string;
  level: ShareLevel;
  /** The parent asked for more. The institution decides. */
  requested?: ShareLevel;
  requestedByName?: string;
  requestedAt?: string;
  updatedAt: string;
  updatedByName: string;
}

// ---------- Sessions
export type SessionSystem = 'annual' | 'semester' | 'trimester' | 'quarter';
export const SESSION_SYSTEM_LABEL: Record<SessionSystem, string> = { annual: 'Annual', semester: 'Semesters', trimester: 'Trimesters', quarter: 'Quarters' };
export const SESSION_SYSTEM_PARTS: Record<SessionSystem, number> = { annual: 1, semester: 2, trimester: 3, quarter: 4 };
export const SESSION_TERM_WORD: Record<SessionSystem, string> = { annual: 'Year', semester: 'Semester', trimester: 'Trimester', quarter: 'Quarter' };

export interface Term {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface AcademicSession {
  id: string;
  instId: string;
  label: string;
  start: string;
  end: string;
  status: 'planned' | 'current' | 'closed';
  system: SessionSystem;
  terms: Term[];
}

// ---------- Curriculum
export const GRADING_SCHEMES = [
  { value: 'percentage', label: 'Percentage and grade' },
  { value: 'gpa10', label: 'Grade points, 10 point scale' },
  { value: 'gpa4', label: 'Grade points, 4 point scale' },
  { value: 'letter', label: 'Letter grades only' },
  { value: 'ib', label: 'IB 1 to 7 scale' },
] as const;
export type GradingScheme = (typeof GRADING_SCHEMES)[number]['value'];

export const BOARDS: Record<ProfileKind, string[]> = {
  school: ['CBSE', 'ICSE / ISC', 'State board', 'IB (PYP, MYP, DP)', 'Cambridge (IGCSE, A level)', 'National curriculum', 'Other'],
  college: ['University affiliated scheme', 'Autonomous scheme', 'UGC regulations', 'AICTE', 'Other'],
  university: ['UGC regulations', 'Statutory university scheme', 'Other'],
  institute: ['AICTE', 'Technical board', 'Vocational board', 'Other'],
};

export const SCHOOL_STAGES = ['Pre-primary', 'Primary', 'Middle', 'Secondary', 'Senior secondary'];
export const PROGRAMME_LEVELS = ['Certificate', 'Diploma', 'Undergraduate', 'Postgraduate', 'Doctoral'] as const;
export type ProgrammeLevel = (typeof PROGRAMME_LEVELS)[number];

export interface Programme {
  id: string;
  name: string;
  level: ProgrammeLevel;
  years: number;
  department: string;
  status: 'active' | 'archived';
}

export interface CurriculumConfig {
  instId: string;
  board: string;
  gradingScheme: GradingScheme;
  medium: string;
  stages: string[];
  programmes: Programme[];
}

// ---------- Policies
export interface PolicyDef {
  key: string;
  label: string;
  description: string;
  /** Where the rule is enforced in the portal. */
  enforcedIn: string;
  input: 'none' | 'text' | 'grading' | 'month' | 'sharing';
}

export const POLICY_CATALOG: PolicyDef[] = [
  { key: 'naming.prefix', label: 'Institution name prefix', description: 'A new or renamed institution must start with this text.', enforcedIn: 'Add institution, Institution profile', input: 'text' },
  { key: 'grading.common', label: 'Common grading scheme', description: 'Member institutions use this grading scheme and cannot change it.', enforcedIn: 'Curriculum', input: 'grading' },
  { key: 'session.start_month', label: 'Common session start month', description: 'Academic sessions of member institutions must start in this month.', enforcedIn: 'Academic sessions', input: 'month' },
  { key: 'sharing.default', label: 'Default data sharing for new affiliated and partner institutions', description: 'The level every data area starts with when an institution is linked.', enforcedIn: 'Linking requests', input: 'sharing' },
];

export interface PolicySetting {
  enforced: boolean;
  value: string;
}

// ---------- Billing (read only in the portal)
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'due' | 'overdue';
}

export interface UpgradeRequest {
  id: string;
  at: string;
  byName: string;
  toPlan: string;
  reason: string;
}

export interface BillingInfo {
  plan: string;
  cycle: 'monthly' | 'annual';
  renewsOn: string;
  institutionsIncluded: number;
  studentSeats: number;
  studentsUsed: number;
  currency: string;
  invoices: Invoice[];
  upgradeRequests: UpgradeRequest[];
}

export const PLAN_NAMES = ['Starter', 'Standard', 'Enterprise'] as const;

// ---------- History
export type HistoryKind = 'organization' | 'institution' | 'campus' | 'hierarchy' | 'relationship' | 'link' | 'agreement' | 'policy' | 'session' | 'curriculum' | 'billing';
export const HISTORY_KIND_LABEL: Record<HistoryKind, string> = {
  organization: 'Organization',
  institution: 'Institution',
  campus: 'Campus',
  hierarchy: 'Hierarchy',
  relationship: 'Relationship',
  link: 'Linking',
  agreement: 'Data sharing',
  policy: 'Policy',
  session: 'Academic session',
  curriculum: 'Curriculum',
  billing: 'Billing',
};

export interface HistoryEntry {
  id: string;
  at: string;
  orgId: string;
  instId?: string;
  kind: HistoryKind;
  byName: string;
  summary: string;
  reason?: string;
}

export interface World {
  units: OrgUnit[];
  links: LinkRequest[];
  agreements: Agreement[];
  sessions: AcademicSession[];
  curricula: CurriculumConfig[];
  /** Policy settings per organization id. */
  policies: Record<string, Record<string, PolicySetting>>;
  billing: Record<string, BillingInfo>;
  history: HistoryEntry[];
}

export interface OrgState {
  organizations: Organization[];
  institutions: Institution[];
}

export interface Snapshot {
  orgs: OrgState;
  world: World;
}

/** Who did it, for history lines and event logs. */
export interface Actor {
  id: string;
  name: string;
}
