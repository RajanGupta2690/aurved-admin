import { checklistFor } from '../../core/org/rules';
import { generateTerms, sessionIdFor } from '../../core/org/ops';
import type {
  AcademicSession,
  Agreement,
  BillingInfo,
  CurriculumConfig,
  HistoryEntry,
  LinkRequest,
  OrgUnit,
  PolicySetting,
  Programme,
  SessionSystem,
  World,
} from '../../core/org/model';
import type { Institution } from '../../core/org/types';
import { DEMO_INSTITUTIONS } from './tenants';

/** DEMO DATA. Made up. Dates are fixed so the demo reads the same every day. */

// ---------- Hierarchy
const UNITS: OrgUnit[] = [
  { id: 'unit-1', orgId: 'org-horizon', name: 'North region', kind: 'region', parentId: null, instIds: [] },
  { id: 'unit-2', orgId: 'org-horizon', name: 'Delhi and Chandigarh', kind: 'cluster', parentId: 'unit-1', instIds: ['inst-horizon-a', 'inst-horizon-d'] },
  { id: 'unit-3', orgId: 'org-horizon', name: 'Central region', kind: 'region', parentId: null, instIds: ['inst-horizon-b', 'inst-horizon-c'] },
  { id: 'unit-4', orgId: 'org-horizon', name: 'STEM pilot programme', kind: 'other', parentId: null, instIds: ['inst-horizon-a', 'inst-horizon-b'] },
  { id: 'unit-5', orgId: 'org-meridian', name: 'Faculty of Science and Technology', kind: 'faculty', parentId: null, instIds: ['inst-mer-sci', 'inst-mer-eng'] },
  { id: 'unit-6', orgId: 'org-meridian', name: 'Faculty of Arts and Law', kind: 'faculty', parentId: null, instIds: ['inst-mer-arts', 'inst-mer-law'] },
  { id: 'unit-7', orgId: 'org-meridian', name: 'Faculty of Health Sciences', kind: 'faculty', parentId: null, instIds: ['inst-mer-med'] },
  { id: 'unit-8', orgId: 'org-meridian', name: 'Affiliation council', kind: 'board', parentId: null, instIds: ['inst-mer-eng', 'inst-mer-med'] },
];

// ---------- Sessions
function systemFor(inst: Institution): SessionSystem {
  return inst.profile === 'institute' ? 'trimester' : 'semester';
}

function startsFor(inst: Institution): { start: string; end: string }[] {
  // Schools start in April. Colleges and universities start in July.
  const [m1, m2, m3] = inst.profile === 'school' ? ['04-01', '03-31', '04-01'] : ['07-15', '06-30', '07-15'];
  return [
    { start: `2024-${m1}`, end: `2025-${m2}` },
    { start: `2025-${m1}`, end: `2026-${m2}` },
    { start: `2026-${m3}`, end: `2027-${m2}` },
  ];
}

function sessionsFor(inst: Institution): AcademicSession[] {
  const system = systemFor(inst);
  const status: AcademicSession['status'][] = ['closed', 'current', 'planned'];
  return startsFor(inst).map((range, index) => ({
    id: sessionIdFor(range.start, range.end),
    instId: inst.id,
    label: `${range.start.slice(0, 4)}-${range.end.slice(0, 4)}`,
    start: range.start,
    end: range.end,
    status: status[index],
    system,
    terms: generateTerms(range.start, range.end, system),
  }));
}

// ---------- Curriculum
let programmeCounter = 0;
const programme = (name: string, level: Programme['level'], years: number, department: string): Programme => ({ id: `prog-${++programmeCounter}`, name, level, years, department, status: 'active' });

const PROGRAMMES: Record<string, Programme[]> = {
  'inst-greenfield': [programme('B.Sc Computer Science', 'Undergraduate', 3, 'Computer Science'), programme('B.Com', 'Undergraduate', 3, 'Commerce'), programme('BBA', 'Undergraduate', 3, 'Management'), programme('M.Sc Data Science', 'Postgraduate', 2, 'Computer Science')],
  'inst-meridian': [programme('M.Sc Applied Mathematics', 'Postgraduate', 2, 'Mathematics'), programme('Ph.D in Sciences', 'Doctoral', 4, 'Research school'), programme('MBA', 'Postgraduate', 2, 'Management')],
  'inst-mer-sci': [programme('B.Sc Physics', 'Undergraduate', 3, 'Physics'), programme('B.Sc Chemistry', 'Undergraduate', 3, 'Chemistry'), programme('B.Sc Mathematics', 'Undergraduate', 3, 'Mathematics')],
  'inst-mer-arts': [programme('BA English', 'Undergraduate', 3, 'English'), programme('BA History', 'Undergraduate', 3, 'History'), programme('MA Sociology', 'Postgraduate', 2, 'Sociology')],
  'inst-mer-eng': [programme('B.E. Computer Science', 'Undergraduate', 4, 'Computer Science'), programme('B.E. Mechanical', 'Undergraduate', 4, 'Mechanical'), programme('B.E. Electronics', 'Undergraduate', 4, 'Electronics')],
  'inst-mer-med': [programme('MBBS', 'Undergraduate', 5, 'Medicine'), programme('M.Sc Nursing', 'Postgraduate', 2, 'Nursing')],
  'inst-mer-law': [programme('BA LLB', 'Undergraduate', 5, 'Law'), programme('LLM', 'Postgraduate', 1, 'Law')],
  'inst-mer-ptr': [programme('Diploma in Visual Design', 'Diploma', 2, 'Design'), programme('Certificate in Typography', 'Certificate', 1, 'Design')],
  'inst-lakeside': [programme('Diploma in Engineering', 'Diploma', 3, 'Engineering'), programme('B.Tech Computer Science', 'Undergraduate', 4, 'Computer Science'), programme('M.Tech Embedded Systems', 'Postgraduate', 2, 'Electronics')],
};

function curriculumFor(inst: Institution): CurriculumConfig {
  if (inst.profile === 'school') {
    return {
      instId: inst.id,
      board: 'CBSE',
      gradingScheme: 'percentage',
      medium: 'English',
      stages: ['Pre-primary', 'Primary', 'Middle', 'Secondary', 'Senior secondary'],
      programmes: [],
    };
  }
  const board = inst.id === 'inst-greenfield' || inst.id === 'inst-mer-law' ? 'Autonomous scheme' : inst.profile === 'institute' ? 'AICTE' : inst.profile === 'university' ? 'UGC regulations' : 'University affiliated scheme';
  return { instId: inst.id, board, gradingScheme: 'gpa10', medium: 'English', stages: [], programmes: PROGRAMMES[inst.id] ?? [] };
}

// ---------- Data sharing
function agreement(instId: string, domain: string, level: Agreement['level'], extra: Partial<Agreement> = {}): Agreement {
  return { instId, domain, level, updatedAt: '2026-08-12T10:00:00.000Z', updatedByName: 'Institution office', ...extra };
}

const REQ = { requestedByName: 'Prof. R. Nair', requestedAt: '2026-11-14T10:30:00.000Z' };

const AGREEMENTS: Agreement[] = [
  // Kaveri Engineering College (affiliated)
  agreement('inst-mer-eng', 'enrolment', 'summary'),
  agreement('inst-mer-eng', 'results', 'none', { requested: 'summary', ...REQ }),
  agreement('inst-mer-eng', 'attendance', 'none', { requested: 'summary', ...REQ }),
  agreement('inst-mer-eng', 'finance', 'none'),
  agreement('inst-mer-eng', 'staff', 'none'),
  agreement('inst-mer-eng', 'compliance', 'full'),
  // Lotus Medical College (affiliated, under inspection)
  agreement('inst-mer-med', 'enrolment', 'none'),
  agreement('inst-mer-med', 'results', 'none'),
  agreement('inst-mer-med', 'attendance', 'none'),
  agreement('inst-mer-med', 'finance', 'none'),
  agreement('inst-mer-med', 'staff', 'summary'),
  agreement('inst-mer-med', 'compliance', 'full'),
  // Hampi School of Law (autonomous)
  agreement('inst-mer-law', 'enrolment', 'summary'),
  agreement('inst-mer-law', 'results', 'summary'),
  agreement('inst-mer-law', 'attendance', 'none'),
  agreement('inst-mer-law', 'finance', 'none'),
  agreement('inst-mer-law', 'staff', 'none'),
  agreement('inst-mer-law', 'compliance', 'full'),
  // Global Institute of Design (partner)
  agreement('inst-mer-ptr', 'enrolment', 'summary'),
  agreement('inst-mer-ptr', 'results', 'none'),
  agreement('inst-mer-ptr', 'attendance', 'none'),
  agreement('inst-mer-ptr', 'finance', 'none'),
  agreement('inst-mer-ptr', 'staff', 'none'),
  agreement('inst-mer-ptr', 'compliance', 'summary'),
];

// ---------- Linking
function link(id: string, partial: Omit<LinkRequest, 'id' | 'checklist'> & { done?: number; doneBy?: string }): LinkRequest {
  const { done = 0, doneBy = 'Registrar, Meridian University', ...rest } = partial;
  const checklist = checklistFor(rest.relationship).map((item, index) => ({ id: `chk-${index + 1}`, label: item.label, done: index < done, doneBy: index < done ? doneBy : undefined, doneAt: index < done ? '2026-11-12T11:00:00.000Z' : undefined }));
  return { id, ...rest, checklist };
}

const LINKS: LinkRequest[] = [
  link('link-1', {
    parentOrgId: 'org-meridian',
    childInstId: 'inst-greenfield',
    relationship: 'affiliated',
    direction: 'invite',
    status: 'awaiting_consent',
    note: 'Greenfield College has asked about affiliation for its new B.Sc programmes.',
    events: [{ id: 'link-1-e1', at: '2026-11-18T09:30:00.000Z', byName: 'Prof. R. Nair', action: 'Invited Greenfield to join as affiliated', note: 'Greenfield College has asked about affiliation for its new B.Sc programmes.' }],
    createdAt: '2026-11-18T09:30:00.000Z',
    createdByName: 'Prof. R. Nair',
  }),
  link('link-2', {
    parentOrgId: 'org-horizon',
    childInstId: 'inst-sunrise',
    relationship: 'member',
    direction: 'apply',
    status: 'in_verification',
    done: 2,
    doneBy: 'Anita Rao',
    note: 'Sunrise wants to join the trust and share its admission and fee policies.',
    events: [
      { id: 'link-2-e1', at: '2026-11-10T10:00:00.000Z', byName: 'Rajesh Kumar', action: 'Applied to join Horizon Education Trust as member', note: 'Sunrise wants to join the trust and share its admission and fee policies.' },
      { id: 'link-2-e2', at: '2026-11-12T11:00:00.000Z', byName: 'Anita Rao', action: 'Verified: Registration or recognition certificate' },
      { id: 'link-2-e3', at: '2026-11-12T11:05:00.000Z', byName: 'Anita Rao', action: 'Verified: Governing body resolution to link' },
    ],
    createdAt: '2026-11-10T10:00:00.000Z',
    createdByName: 'Rajesh Kumar',
  }),
  link('link-3', {
    parentOrgId: 'org-meridian',
    childInstId: 'inst-greenfield',
    relationship: 'constituent',
    direction: 'apply',
    status: 'rejected',
    done: 1,
    note: 'Request to become a constituent college.',
    events: [
      { id: 'link-3-e1', at: '2026-08-02T10:00:00.000Z', byName: 'Neha Kapoor', action: 'Applied to join Meridian University as constituent' },
      { id: 'link-3-e2', at: '2026-08-20T10:00:00.000Z', byName: 'Prof. R. Nair', action: 'Rejected the request', note: 'Constituent status needs state approval. Consider affiliation first.' },
    ],
    createdAt: '2026-08-02T10:00:00.000Z',
    createdByName: 'Neha Kapoor',
  }),
];

// ---------- Policies
const POLICIES: Record<string, Record<string, PolicySetting>> = {
  'org-horizon': {
    'naming.prefix': { enforced: true, value: 'Horizon' },
    'grading.common': { enforced: true, value: 'percentage' },
    'session.start_month': { enforced: true, value: '4' },
    'sharing.default': { enforced: false, value: 'none' },
  },
  'org-meridian': {
    'naming.prefix': { enforced: false, value: '' },
    'grading.common': { enforced: false, value: 'gpa10' },
    'session.start_month': { enforced: false, value: '7' },
    'sharing.default': { enforced: true, value: 'none' },
  },
};

// ---------- Billing
function invoices(prefix: string, amount: number, last: 'paid' | 'due' | 'overdue' = 'paid'): BillingInfo['invoices'] {
  return [
    { id: `${prefix}-1004`, date: '2026-10-01', amount, status: last },
    { id: `${prefix}-1003`, date: '2026-07-01', amount, status: 'paid' },
    { id: `${prefix}-1002`, date: '2026-04-01', amount, status: 'paid' },
    { id: `${prefix}-1001`, date: '2026-01-01', amount, status: 'paid' },
  ];
}

const BILLING: Record<string, BillingInfo> = {
  'org-sunrise': { plan: 'Standard', cycle: 'annual', renewsOn: '2027-04-01', institutionsIncluded: 1, studentSeats: 1500, studentsUsed: 1240, currency: 'INR', invoices: [{ id: 'SUN-2026', date: '2026-04-01', amount: 240000, status: 'paid' }, { id: 'SUN-2025', date: '2025-04-01', amount: 216000, status: 'paid' }], upgradeRequests: [] },
  'org-greenfield': { plan: 'Starter', cycle: 'annual', renewsOn: '2027-01-15', institutionsIncluded: 1, studentSeats: 1200, studentsUsed: 1130, currency: 'INR', invoices: [{ id: 'GRN-2026', date: '2026-01-15', amount: 150000, status: 'paid' }], upgradeRequests: [] },
  'org-horizon': { plan: 'Enterprise', cycle: 'monthly', renewsOn: '2026-12-01', institutionsIncluded: 6, studentSeats: 6000, studentsUsed: 4620, currency: 'INR', invoices: invoices('HZN', 410000, 'due'), upgradeRequests: [] },
  'org-meridian': { plan: 'Enterprise', cycle: 'annual', renewsOn: '2027-06-30', institutionsIncluded: 8, studentSeats: 20000, studentsUsed: 13480, currency: 'INR', invoices: [{ id: 'MER-2026', date: '2026-06-30', amount: 4200000, status: 'paid' }, { id: 'MER-2025', date: '2025-06-30', amount: 3900000, status: 'paid' }], upgradeRequests: [] },
  'org-lakeside': { plan: 'Standard', cycle: 'monthly', renewsOn: '2026-12-10', institutionsIncluded: 1, studentSeats: 3000, studentsUsed: 2790, currency: 'INR', invoices: invoices('LKS', 95000, 'overdue'), upgradeRequests: [] },
};

// ---------- History
function entry(n: number, at: string, orgId: string, kind: HistoryEntry['kind'], byName: string, summary: string, instId?: string, reason?: string): HistoryEntry {
  return { id: `hist-${n}`, at, orgId, instId, kind, byName, summary, reason };
}

const HISTORY: HistoryEntry[] = [
  entry(9, '2026-11-18T09:30:00.000Z', 'org-meridian', 'link', 'Prof. R. Nair', 'Invited Greenfield to join as affiliated.', 'inst-greenfield'),
  entry(8, '2026-11-14T10:30:00.000Z', 'org-meridian', 'agreement', 'Prof. R. Nair', 'Asked Kaveri Engineering for more access: examination results, attendance summary.', 'inst-mer-eng'),
  entry(7, '2026-11-12T11:05:00.000Z', 'org-horizon', 'link', 'Anita Rao', 'Verified two documents for the request of Sunrise.', 'inst-sunrise'),
  entry(6, '2026-11-10T10:00:00.000Z', 'org-horizon', 'link', 'Rajesh Kumar', 'Applied to join Horizon Education Trust as member.', 'inst-sunrise'),
  entry(5, '2026-10-05T14:00:00.000Z', 'org-horizon', 'policy', 'Anita Rao', 'Enforced "Common grading scheme" (percentage).'),
  entry(4, '2026-09-21T12:00:00.000Z', 'org-meridian', 'relationship', 'Prof. R. Nair', 'Hampi School of Law changed from affiliated to autonomous.', 'inst-mer-law', 'Autonomy order received from the regulator.'),
  entry(3, '2026-08-20T10:00:00.000Z', 'org-meridian', 'link', 'Prof. R. Nair', 'Rejected the link of Greenfield.', 'inst-greenfield', 'Constituent status needs state approval. Consider affiliation first.'),
  entry(2, '2026-07-02T09:00:00.000Z', 'org-meridian', 'institution', 'Prof. R. Nair', 'Lotus Medical College added as affiliated. Waiting for inspection.', 'inst-mer-med'),
  entry(1, '2026-04-01T09:00:00.000Z', 'org-horizon', 'hierarchy', 'Anita Rao', 'Added the unit "North region".'),
];

export function seedWorld(): World {
  const members = DEMO_INSTITUTIONS;
  return {
    units: UNITS.map((unit) => ({ ...unit, instIds: [...unit.instIds] })),
    links: LINKS,
    agreements: AGREEMENTS,
    sessions: members.flatMap(sessionsFor),
    curricula: members.map(curriculumFor),
    policies: POLICIES,
    billing: BILLING,
    history: HISTORY,
  };
}

/** Demo head counts. Used where a dashboard shows numbers for institutions that have no student module of their own yet. */
export const DEMO_STATS: Record<string, { students: number; staff: number }> = {
  'inst-sunrise': { students: 1240, staff: 78 },
  'inst-greenfield': { students: 1130, staff: 64 },
  'inst-horizon-a': { students: 1320, staff: 82 },
  'inst-horizon-b': { students: 1010, staff: 61 },
  'inst-horizon-c': { students: 1180, staff: 70 },
  'inst-horizon-d': { students: 1110, staff: 66 },
  'inst-meridian': { students: 2400, staff: 310 },
  'inst-mer-sci': { students: 2100, staff: 140 },
  'inst-mer-arts': { students: 1850, staff: 120 },
  'inst-mer-eng': { students: 3200, staff: 210 },
  'inst-mer-med': { students: 640, staff: 150 },
  'inst-mer-law': { students: 920, staff: 58 },
  'inst-mer-ptr': { students: 370, staff: 32 },
  'inst-lakeside': { students: 2790, staff: 190 },
};
