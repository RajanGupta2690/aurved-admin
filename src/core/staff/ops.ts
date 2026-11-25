import { evaluate } from '../access/engine';
import type { Membership, Persona } from '../access/engine';
import { allowedKeys } from '../access/matrix';
import { escalationProblem, rolesOf } from '../org/accessOps';
import type { Actor, Snapshot } from '../org/model';
import { record } from '../org/ops';
import type { Res } from '../org/ops';
import { isExternal, nextId, normalizeName, slugify } from '../org/rules';
import type { Institution } from '../org/types';
import { DEFAULT_STAFF_POLICY, isExited } from './model';
import type { RecordRow } from '../records/types';
import type { Delegation, Department, Designation, Duty, EmploymentType, Experience, Qualification, StaffCategory, StaffDocument, StaffMember, StaffPolicy, StaffStatus, StaffWork, TeachingAssignment } from './model';

/** Changes to staff records. Pure functions, same style as org/ops.ts. */
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const instOf = (snap: Snapshot, id: string) => snap.orgs.institutions.find((inst) => inst.id === id);
export const memberOf = (snap: Snapshot, id: string) => snap.staff.members.find((member) => member.id === id);
const personaOf = (snap: Snapshot, id: string | null) => (id ? snap.access.personas.find((person) => person.id === id) : undefined);
const isoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
const todayOf = (now: string) => now.slice(0, 10);
const addMonths = (date: string, months: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
};

export function policyOf(snap: Snapshot, instId: string): StaffPolicy {
  const inst = instOf(snap, instId);
  const org = inst ? snap.orgs.organizations.find((item) => item.id === inst.orgId) : undefined;
  const orgPolicy = inst && org && !org.implicit && !isExternal(inst) ? snap.staff.policies[org.id] : undefined;
  return snap.staff.policies[instId] ?? orgPolicy ?? DEFAULT_STAFF_POLICY;
}

function log(snap: Snapshot, entry: { instId: string; staffId?: string; summary: string }, actor: Actor, now: string, history = false): Snapshot {
  const id = nextId('stf-ev', snap.staff.events.map((event) => event.id));
  const next: Snapshot = { ...snap, staff: { ...snap.staff, events: [{ id, at: now, byName: actor.name, ...entry }, ...snap.staff.events].slice(0, 2000) } };
  const inst = instOf(snap, entry.instId);
  return history && inst ? record(next, { orgId: inst.orgId, instId: inst.id, kind: 'staff', summary: entry.summary }, actor, now) : next;
}

function withMembers(snap: Snapshot, members: StaffMember[]): Snapshot {
  return { ...snap, staff: { ...snap.staff, members } };
}

function replaceMember(snap: Snapshot, member: StaffMember): Snapshot {
  return withMembers(snap, snap.staff.members.map((item) => (item.id === member.id ? member : item)));
}

/** True when pointing staffId at reportsToId would make a loop. */
export function wouldCycle(members: StaffMember[], staffId: string, reportsToId: string | null): boolean {
  let cursor = reportsToId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === staffId || seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = members.find((member) => member.id === cursor)?.employment.reportsToId ?? null;
  }
  return false;
}

// ---------- adding and editing
export interface NewStaffInput {
  instId: string;
  fullName: string;
  gender?: StaffMember['person']['gender'];
  dob?: string;
  phone: string;
  email: string;
  address?: string;
  employeeId?: string;
  category: StaffCategory;
  designationId: string;
  departmentId: string;
  reportsToId?: string | null;
  joinDate: string;
  type: EmploymentType;
  campusId?: string;
  /** Subjects for teaching staff. Work area and shift for the others. */
  work?: StaffWork;
  /** The highest qualification, added to the record as the first entry. */
  qualification?: { degree: string; institution?: string; year?: number };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?\d{7,15}$/;

export function staffProblems(snap: Snapshot, input: NewStaffInput, ignoreId?: string): string | null {
  const inst = instOf(snap, input.instId);
  if (!inst) return 'This institution does not exist.';
  if (input.fullName.trim().length < 3) return 'Enter the full name.';
  if (!EMAIL.test(input.email.trim())) return 'Enter a valid email address.';
  if (!PHONE.test(input.phone.replace(/[\s().-]/g, ''))) return 'Enter a phone number of 7 to 15 digits.';
  if (input.dob && (!isoDate(input.dob) || input.dob > input.joinDate)) return 'The date of birth must be a real date before the joining date.';
  if (!isoDate(input.joinDate)) return 'Choose the joining date.';
  const designation = snap.staff.designations.find((item) => item.id === input.designationId && item.instId === input.instId);
  if (!designation || !designation.active) return 'Choose an active designation of this institution.';
  if (designation.category !== input.category) return `"${designation.name}" is a ${designation.category.replace('_', '-')} designation.`;
  const department = snap.staff.departments.find((item) => item.id === input.departmentId && item.instId === input.instId);
  if (!department || !department.active) return 'Choose an active department of this institution.';
  if (input.reportsToId) {
    const boss = memberOf(snap, input.reportsToId);
    if (!boss || boss.instId !== input.instId || isExited(boss.employment.status)) return 'The reporting person must be current staff of this institution.';
    if (ignoreId && wouldCycle(snap.staff.members, ignoreId, input.reportsToId)) return 'This would make people report to each other in a circle.';
  }
  if (input.qualification && input.qualification.degree.trim().length > 0) {
    if (input.qualification.degree.trim().length < 2) return 'Enter the qualification, for example B.Ed.';
    const year = input.qualification.year;
    if (year !== undefined && !(Number.isInteger(year) && year >= 1950 && year <= Number(input.joinDate.slice(0, 4)))) return 'The qualification year must be between 1950 and the joining year.';
  }
  if (input.work?.shift && !['day', 'morning', 'evening', 'rotational'].includes(input.work.shift)) return 'Choose a shift from the list.';
  if (input.campusId && !inst.campuses.some((campus) => campus.id === input.campusId && (campus.status ?? 'active') === 'active')) return 'Choose an active campus.';
  const others = snap.staff.members.filter((member) => member.instId === input.instId && member.id !== ignoreId && !isExited(member.employment.status));
  const sameEmail = others.find((member) => member.person.email.toLowerCase() === input.email.trim().toLowerCase());
  if (sameEmail) return `${sameEmail.person.fullName} already works here with this email.`;
  const sameName = others.find((member) => normalizeName(member.person.fullName) === normalizeName(input.fullName) && member.person.phone.replace(/\D/g, '') === input.phone.replace(/\D/g, ''));
  if (sameName) return `${sameName.person.fullName} with this phone number already works here.`;
  if (input.employeeId && snap.staff.members.some((member) => member.instId === input.instId && member.id !== ignoreId && member.employment.employeeId.toLowerCase() === input.employeeId!.trim().toLowerCase())) return `The employee number ${input.employeeId} is already used.`;
  return null;
}

export function nextEmployeeId(snap: Snapshot, instId: string): string {
  const prefix = policyOf(snap, instId).employeeIdPrefix;
  const used = snap.staff.members.filter((member) => member.instId === instId).map((member) => Number(member.employment.employeeId.replace(/\D/g, '')) || 0);
  return `${prefix}${String(Math.max(0, ...used) + 1).padStart(3, '0')}`;
}

/** Keeps only what applies: subjects for teaching staff, area and shift for the others. */
function workFor(category: StaffCategory, work?: StaffWork): StaffWork | undefined {
  if (!work) return undefined;
  if (category === 'teaching') return work.subjects && work.subjects.length > 0 ? { subjects: Array.from(new Set(work.subjects)) } : undefined;
  return work.area || work.shift ? { area: work.area || undefined, shift: work.shift || undefined } : undefined;
}

export function addStaff(snap: Snapshot, input: NewStaffInput, actor: Actor, now: string): Res<{ staffId: string }> {
  const problem = staffProblems(snap, input);
  if (problem) return fail(problem);
  const inst = instOf(snap, input.instId)!;
  const policy = policyOf(snap, input.instId);
  const id = nextId('staff', snap.staff.members.map((member) => member.id));
  const campus = input.campusId ?? inst.campuses.find((item) => (item.status ?? 'active') === 'active')?.id ?? '';
  const member: StaffMember = {
    id,
    instId: input.instId,
    person: { fullName: input.fullName.trim(), gender: input.gender ?? '', dob: input.dob ?? '', phone: input.phone.trim(), email: input.email.trim().toLowerCase(), address: input.address?.trim() ?? '' },
    employment: {
      employeeId: input.employeeId?.trim() || nextEmployeeId(snap, input.instId),
      category: input.category,
      designationId: input.designationId,
      departmentId: input.departmentId,
      reportsToId: input.reportsToId ?? null,
      joinDate: input.joinDate,
      type: input.type,
      status: input.type === 'permanent' && policy.probationMonths > 0 && addMonths(input.joinDate, policy.probationMonths) > todayOf(now) ? 'probation' : 'active',
      campusId: campus,
    },
    qualifications: input.qualification && input.qualification.degree.trim() ? [{ id: `q-${id}-1`, degree: input.qualification.degree.trim(), institution: input.qualification.institution?.trim() ?? '', year: input.qualification.year ?? 0 }] : [],
    experience: [],
    documents: [],
    accountId: null,
    work: workFor(input.category, input.work),
  };
  const next = log(withMembers(snap, [...snap.staff.members, member]), { instId: input.instId, staffId: id, summary: `Added ${member.person.fullName} (${member.employment.employeeId}).` }, actor, now, true);
  return { ok: true, snap: next, staffId: id };
}

export interface StaffPatch {
  person?: Partial<StaffMember['person']>;
  employment?: Partial<Pick<StaffMember['employment'], 'employeeId' | 'category' | 'designationId' | 'departmentId' | 'reportsToId' | 'joinDate' | 'type' | 'campusId'>>;
  work?: StaffWork;
}

export function updateStaff(snap: Snapshot, staffId: string, patch: StaffPatch, actor: Actor, now: string): Res {
  const member = memberOf(snap, staffId);
  if (!member) return fail('This person does not exist.');
  if (isExited(member.employment.status)) return fail('This person has left. Their record is kept as it was.');
  const merged: StaffMember = { ...member, person: { ...member.person, ...patch.person }, employment: { ...member.employment, ...patch.employment } };
  if (patch.work) merged.work = workFor(merged.employment.category, patch.work);
  const problem = staffProblems(
    snap,
    {
      instId: member.instId,
      fullName: merged.person.fullName,
      gender: merged.person.gender,
      dob: merged.person.dob,
      phone: merged.person.phone,
      email: merged.person.email,
      address: merged.person.address,
      employeeId: merged.employment.employeeId,
      category: merged.employment.category,
      designationId: merged.employment.designationId,
      departmentId: merged.employment.departmentId,
      reportsToId: merged.employment.reportsToId,
      joinDate: merged.employment.joinDate,
      type: merged.employment.type,
      campusId: merged.employment.campusId,
    },
    staffId,
  );
  if (problem) return fail(problem);
  if (JSON.stringify(merged) === JSON.stringify(member)) return fail('Nothing was changed.');
  merged.person.email = merged.person.email.toLowerCase();
  const demoted = member.employment.category !== merged.employment.category && snap.staff.assignments.some((item) => item.staffId === staffId && item.status === 'active');
  if (demoted) return fail('End the teaching assignments before moving this person to a non-teaching post.');
  return { ok: true, snap: log(replaceMember(snap, merged), { instId: member.instId, staffId, summary: `Updated the record of ${merged.person.fullName}.` }, actor, now) };
}

export function setStaffStatus(snap: Snapshot, staffId: string, status: Extract<StaffStatus, 'active' | 'on_leave' | 'probation'>, actor: Actor, now: string, reason: string): Res {
  const member = memberOf(snap, staffId);
  if (!member) return fail('This person does not exist.');
  if (isExited(member.employment.status)) return fail('This person has left.');
  if (member.employment.status === status) return fail('The person already has this status.');
  if (reason.trim().length < 3) return fail('Write a reason.');
  return { ok: true, snap: log(replaceMember(snap, { ...member, employment: { ...member.employment, status } }), { instId: member.instId, staffId, summary: `${member.person.fullName} is now ${status.replace('_', ' ')}. ${reason.trim()}` }, actor, now) };
}

export function saveStaffLists(snap: Snapshot, staffId: string, lists: { qualifications?: Qualification[]; experience?: Experience[]; documents?: StaffDocument[] }, actor: Actor, now: string): Res {
  const member = memberOf(snap, staffId);
  if (!member) return fail('This person does not exist.');
  const year = new Date(now).getUTCFullYear();
  for (const q of lists.qualifications ?? []) {
    if (!q.degree.trim() || !q.institution.trim()) return fail('Every qualification needs a degree and an institution.');
    if (!(q.year >= 1950 && q.year <= year)) return fail(`The year of "${q.degree}" must be between 1950 and ${year}.`);
  }
  for (const e of lists.experience ?? []) {
    if (!e.organization.trim() || !e.role.trim()) return fail('Every experience needs an organization and a role.');
    if (!isoDate(e.from) || !isoDate(e.to) || e.to < e.from) return fail(`"${e.role}" ends before it starts.`);
  }
  for (const d of lists.documents ?? []) {
    if (!d.name.trim()) return fail('Every document needs a name.');
    if (d.expires && !isoDate(d.expires)) return fail(`The expiry date of "${d.name}" is not a date.`);
  }
  const next: StaffMember = { ...member, qualifications: lists.qualifications ?? member.qualifications, experience: lists.experience ?? member.experience, documents: lists.documents ?? member.documents };
  return { ok: true, snap: log(replaceMember(snap, next), { instId: member.instId, staffId, summary: `Updated qualifications, experience or documents of ${member.person.fullName}.` }, actor, now) };
}

/** Required documents that are missing or not yet verified. */
export function documentGaps(snap: Snapshot, member: StaffMember): string[] {
  return policyOf(snap, member.instId).requiredDocuments.filter((type) => !member.documents.some((doc) => doc.type === type && doc.verified));
}

// ---------- structure
export function saveDesignation(snap: Snapshot, draft: Omit<Designation, 'id' | 'active'> & { id?: string }, actor: Actor, now: string): Res<{ designationId: string }> {
  if (!instOf(snap, draft.instId)) return fail('This institution does not exist.');
  const name = draft.name.trim();
  if (name.length < 2) return fail('Enter the designation name.');
  if (!(draft.level >= 1 && draft.level <= 9)) return fail('Level must be between 1 (top) and 9.');
  const existing = draft.id ? snap.staff.designations.find((item) => item.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('This designation does not exist.');
  const clash = snap.staff.designations.find((item) => item.instId === draft.instId && item.id !== draft.id && item.active && item.name.trim().toLowerCase() === name.toLowerCase());
  if (clash) return fail(`"${clash.name}" already exists.`);
  if (existing && existing.category !== draft.category && snap.staff.members.some((member) => member.employment.designationId === existing.id && !isExited(member.employment.status))) return fail('The category cannot change while people hold this designation.');
  const responsibilities = draft.responsibilities.map((line) => line.trim()).filter(Boolean);
  const value: Designation = { ...(existing ?? { active: true }), id: existing?.id ?? nextId('desg', snap.staff.designations.map((item) => item.id)), instId: draft.instId, name, category: draft.category, level: draft.level, summary: draft.summary.trim(), responsibilities, minQualification: draft.minQualification.trim() };
  const designations = existing ? snap.staff.designations.map((item) => (item.id === value.id ? value : item)) : [...snap.staff.designations, value];
  const next = log({ ...snap, staff: { ...snap.staff, designations } }, { instId: draft.instId, summary: `${existing ? 'Updated' : 'Added'} the designation "${name}".` }, actor, now);
  return { ok: true, snap: next, designationId: value.id };
}

export function setDesignationActive(snap: Snapshot, id: string, active: boolean, actor: Actor, now: string, reason?: string): Res {
  const designation = snap.staff.designations.find((item) => item.id === id);
  if (!designation) return fail('This designation does not exist.');
  if (!active) {
    const holders = snap.staff.members.filter((member) => member.employment.designationId === id && !isExited(member.employment.status));
    if (holders.length > 0) return fail(`${holders.length} ${holders.length === 1 ? 'person holds' : 'people hold'} this designation. Move them first.`);
    if ((reason ?? '').trim().length < 3) return fail('Write a reason.');
  }
  const designations = snap.staff.designations.map((item) => (item.id === id ? { ...item, active } : item));
  return { ok: true, snap: log({ ...snap, staff: { ...snap.staff, designations } }, { instId: designation.instId, summary: `${active ? 'Restored' : 'Archived'} the designation "${designation.name}".` }, actor, now) };
}

export function saveDepartment(snap: Snapshot, draft: { id?: string; instId: string; name: string; headId: string | null }, actor: Actor, now: string): Res {
  if (!instOf(snap, draft.instId)) return fail('This institution does not exist.');
  const name = draft.name.trim();
  if (name.length < 2) return fail('Enter the department name.');
  const existing = draft.id ? snap.staff.departments.find((item) => item.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('This department does not exist.');
  const clash = snap.staff.departments.find((item) => item.instId === draft.instId && item.id !== draft.id && item.active && item.name.trim().toLowerCase() === name.toLowerCase());
  if (clash) return fail(`"${clash.name}" already exists.`);
  if (draft.headId) {
    const head = memberOf(snap, draft.headId);
    if (!head || head.instId !== draft.instId || isExited(head.employment.status)) return fail('The head must be current staff of this institution.');
  }
  const value: Department = { id: existing?.id ?? nextId('dept', snap.staff.departments.map((item) => item.id)), instId: draft.instId, name, headId: draft.headId, active: existing?.active ?? true };
  const departments = existing ? snap.staff.departments.map((item) => (item.id === value.id ? value : item)) : [...snap.staff.departments, value];
  return { ok: true, snap: log({ ...snap, staff: { ...snap.staff, departments } }, { instId: draft.instId, summary: `${existing ? 'Updated' : 'Added'} the department "${name}".` }, actor, now) };
}

export function setDepartmentActive(snap: Snapshot, id: string, active: boolean, actor: Actor, now: string, reason?: string): Res {
  const department = snap.staff.departments.find((item) => item.id === id);
  if (!department) return fail('This department does not exist.');
  if (!active) {
    const holders = snap.staff.members.filter((member) => member.employment.departmentId === id && !isExited(member.employment.status));
    if (holders.length > 0) return fail(`${holders.length} ${holders.length === 1 ? 'person works' : 'people work'} in this department. Move them first.`);
    if ((reason ?? '').trim().length < 3) return fail('Write a reason.');
  }
  const departments = snap.staff.departments.map((item) => (item.id === id ? { ...item, active } : item));
  return { ok: true, snap: log({ ...snap, staff: { ...snap.staff, departments } }, { instId: department.instId, summary: `${active ? 'Restored' : 'Archived'} the department "${department.name}".` }, actor, now) };
}

// ---------- assignments and duties
export function workloadOf(snap: Snapshot, staffId: string, sessionId: string): number {
  return snap.staff.assignments.filter((item) => item.staffId === staffId && item.sessionId === sessionId && item.status === 'active').reduce((sum, item) => sum + item.periods, 0);
}

export function assignTeaching(snap: Snapshot, input: { instId: string; staffId: string; sessionId: string; group: string; subject: string; periods: number }, actor: Actor, now: string): Res {
  const member = memberOf(snap, input.staffId);
  if (!member || member.instId !== input.instId) return fail('Choose a teacher of this institution.');
  if (member.employment.category !== 'teaching') return fail(`${member.person.fullName} is non-teaching staff.`);
  if (isExited(member.employment.status)) return fail(`${member.person.fullName} has left.`);
  if (!input.group.trim() || !input.subject.trim()) return fail('Choose the class and the subject.');
  if (!(Number.isInteger(input.periods) && input.periods >= 1 && input.periods <= 12)) return fail('Periods per week must be between 1 and 12.');
  const taken = snap.staff.assignments.find((item) => item.instId === input.instId && item.sessionId === input.sessionId && item.status === 'active' && item.group === input.group && item.subject === input.subject);
  if (taken) return fail(`${input.subject} in ${input.group} is already taken by ${memberOf(snap, taken.staffId)?.person.fullName ?? 'another teacher'}.`);
  const max = policyOf(snap, input.instId).maxPeriodsPerWeek;
  const total = workloadOf(snap, input.staffId, input.sessionId) + input.periods;
  if (total > max) return fail(`That would be ${total} periods a week. The limit is ${max}.`);
  const id = nextId('asg', snap.staff.assignments.map((item) => item.id));
  const assignment: TeachingAssignment = { id, instId: input.instId, staffId: input.staffId, sessionId: input.sessionId, group: input.group, subject: input.subject, periods: input.periods, status: 'active' };
  return { ok: true, snap: log({ ...snap, staff: { ...snap.staff, assignments: [...snap.staff.assignments, assignment] } }, { instId: input.instId, staffId: input.staffId, summary: `${member.person.fullName} takes ${input.subject} in ${input.group} (${input.periods} periods).` }, actor, now) };
}

export function endAssignment(snap: Snapshot, id: string, actor: Actor, now: string): Res {
  const assignment = snap.staff.assignments.find((item) => item.id === id);
  if (!assignment || assignment.status !== 'active') return fail('This assignment is not active.');
  const assignments = snap.staff.assignments.map((item) => (item.id === id ? { ...item, status: 'ended' as const } : item));
  return { ok: true, snap: log({ ...snap, staff: { ...snap.staff, assignments } }, { instId: assignment.instId, staffId: assignment.staffId, summary: `Ended ${assignment.subject} in ${assignment.group} for ${memberOf(snap, assignment.staffId)?.person.fullName}.` }, actor, now) };
}

/** Events of an institution that can still need people: not held, not cancelled, not archived. */
export function openEventsOf(snap: Snapshot, instId: string): RecordRow[] {
  return (snap.records.events ?? []).filter((row) => row.scopeId === instId && !row.archived && row.status !== 'held' && row.status !== 'cancelled');
}

export interface NewDutyInput {
  instId: string;
  staffId: string;
  /** The name of the duty. For an event duty this is the job at the event and can be left empty when role is given. */
  title: string;
  from: string;
  to?: string;
  note?: string;
  /** An event of the Events module. The duty then ends when the event is held or cancelled. */
  eventId?: string;
  role?: string;
}

export function addDuty(snap: Snapshot, input: NewDutyInput, actor: Actor, now: string): Res {
  const member = memberOf(snap, input.staffId);
  if (!member || member.instId !== input.instId) return fail('Choose a person of this institution.');
  if (isExited(member.employment.status)) return fail(`${member.person.fullName} has left.`);
  const event = input.eventId ? openEventsOf(snap, input.instId).find((row) => row.id === input.eventId) : undefined;
  if (input.eventId && !event) return fail('Choose an event of this institution that is not held or cancelled.');
  const title = (event ? input.role ?? input.title : input.title).trim();
  if (title.length < 3) return fail(event ? 'Say what the person does at the event.' : 'Name the duty.');
  if (!isoDate(input.from)) return fail('Choose the start date.');
  if (input.to && (!isoDate(input.to) || input.to < input.from)) return fail('The end date cannot be before the start.');
  const sameEvent = (duty: Duty) => (duty.eventId ?? '') === (event?.id ?? '');
  if (snap.staff.duties.some((duty) => duty.staffId === input.staffId && duty.status === 'active' && sameEvent(duty) && duty.title.toLowerCase() === title.toLowerCase() && (duty.note ?? '') === (input.note?.trim() ?? ''))) return fail(event ? 'This person already has this job at this event.' : 'This person already has this duty.');
  const duty: Duty = {
    id: nextId('duty', snap.staff.duties.map((item) => item.id)),
    instId: input.instId,
    staffId: input.staffId,
    title,
    from: input.from,
    to: input.to || undefined,
    note: input.note?.trim() || undefined,
    status: 'active',
    ...(event ? { eventId: event.id, eventTitle: String(event.data.title ?? 'Event'), role: title } : {}),
  };
  const what = event ? `the duty "${title}" for ${duty.eventTitle}` : `the duty "${title}"`;
  return { ok: true, snap: log({ ...snap, staff: { ...snap.staff, duties: [...snap.staff.duties, duty] } }, { instId: input.instId, staffId: input.staffId, summary: `${member.person.fullName} was given ${what}.` }, actor, now) };
}

export function endDuty(snap: Snapshot, id: string, actor: Actor, now: string): Res {
  const duty = snap.staff.duties.find((item) => item.id === id);
  if (!duty || duty.status !== 'active') return fail('This duty is not active.');
  const duties = snap.staff.duties.map((item) => (item.id === id ? { ...item, status: 'ended' as const, to: item.to && item.to < todayOf(now) ? item.to : todayOf(now) } : item));
  return { ok: true, snap: log({ ...snap, staff: { ...snap.staff, duties } }, { instId: duty.instId, staffId: duty.staffId, summary: `Ended the duty "${duty.title}" of ${memberOf(snap, duty.staffId)?.person.fullName}.` }, actor, now) };
}

// ---------- sign-in accounts and access
function instMembership(person: Persona, instId: string): Membership | undefined {
  return person.memberships.find((membership) => membership.scope.type === 'inst' && membership.scope.id === instId && !membership.delegationId);
}

function replacePersona(snap: Snapshot, person: Persona): Snapshot {
  return { ...snap, access: { ...snap.access, personas: snap.access.personas.map((item) => (item.id === person.id ? person : item)) } };
}

/** How many current staff still hold the institution administrator role at an institution. */
function adminCount(snap: Snapshot, instId: string, exceptStaffId?: string): number {
  return snap.staff.members.filter((member) => member.instId === instId && member.id !== exceptStaffId && !isExited(member.employment.status)).filter((member) => {
    const person = personaOf(snap, member.accountId);
    return person ? instMembership(person, instId)?.roleIds.includes('inst_admin') : false;
  }).length;
}

export function createAccount(snap: Snapshot, staffId: string, roleIds: string[], actor: Actor, now: string): Res {
  const member = memberOf(snap, staffId);
  if (!member) return fail('This person does not exist.');
  if (isExited(member.employment.status)) return fail('This person has left. They cannot get an account.');
  if (member.accountId) return fail('This person already has an account.');
  const inst = instOf(snap, member.instId);
  if (!inst) return fail('This institution does not exist.');
  const problem = roleProblem(snap, inst, roleIds, actor);
  if (problem) return fail(problem);
  // The same person at another institution keeps one account.
  const existing = snap.access.personas.find((person) => person.email.toLowerCase() === member.person.email.toLowerCase());
  let next = snap;
  let accountId: string;
  if (existing) {
    accountId = existing.id;
    next = replacePersona(next, { ...existing, memberships: [...existing.memberships, { scope: { type: 'inst', id: inst.id }, roleIds }] });
  } else {
    const base = `p-${slugify(member.person.fullName)}`;
    accountId = base;
    let n = 2;
    while (snap.access.personas.some((person) => person.id === accountId)) accountId = `${base}-${n++}`;
    const designation = snap.staff.designations.find((item) => item.id === member.employment.designationId);
    const persona: Persona = { id: accountId, name: member.person.fullName, title: `${designation?.name ?? 'Staff'}, ${inst.shortName}`, email: member.person.email, memberships: [{ scope: { type: 'inst', id: inst.id }, roleIds }] };
    next = { ...next, access: { ...next.access, personas: [...next.access.personas, persona] } };
  }
  next = replaceMember(next, { ...member, accountId });
  return { ok: true, snap: log(next, { instId: member.instId, staffId, summary: `Created a sign-in account for ${member.person.fullName}.` }, actor, now, true) };
}

function roleProblem(snap: Snapshot, inst: Institution, roleIds: string[], actor: Actor): string | null {
  const usable = rolesOf(snap.access.roles, inst.orgId).filter((role) => role.level === 'inst');
  for (const id of roleIds) if (!usable.some((role) => role.id === id)) return 'A role cannot be given here. It is archived, organization wide, or from another organization.';
  const permissions = roleIds.flatMap((id) => snap.access.roles.find((role) => role.id === id)?.permissions ?? []);
  return escalationProblem(snap, actor.id, permissions, inst.orgId);
}

export function setStaffRoles(snap: Snapshot, staffId: string, roleIds: string[], actor: Actor, now: string): Res {
  const member = memberOf(snap, staffId);
  const inst = member ? instOf(snap, member.instId) : undefined;
  if (!member || !inst) return fail('This person does not exist.');
  if (isExited(member.employment.status)) return fail('This person has left.');
  const person = personaOf(snap, member.accountId);
  if (!person) return fail('Create an account first.');
  const current = instMembership(person, inst.id);
  const before = current?.roleIds ?? [];
  if (JSON.stringify([...before].sort()) === JSON.stringify([...roleIds].sort())) return fail('Nothing was changed.');
  // Only roles that are new need to be checked against what the actor holds.
  const added = roleIds.filter((id) => !before.includes(id));
  const problem = roleProblem(snap, inst, added, actor);
  if (problem) return fail(problem);
  if (before.includes('inst_admin') && !roleIds.includes('inst_admin') && adminCount(snap, inst.id, staffId) === 0) return fail('This is the last institution administrator. Make someone else an administrator first.');
  const memberships = current ? person.memberships.map((item) => (item === current ? { ...item, roleIds } : item)) : [...person.memberships, { scope: { type: 'inst' as const, id: inst.id }, roleIds }];
  const names = roleIds.map((id) => snap.access.roles.find((role) => role.id === id)?.name ?? id).join(', ') || 'no role';
  return { ok: true, snap: log(replacePersona(snap, { ...person, memberships }), { instId: inst.id, staffId, summary: `${member.person.fullName} now holds: ${names}.` }, actor, now, true) };
}

export function setStaffGrants(snap: Snapshot, staffId: string, grants: string[], denies: string[], actor: Actor, now: string): Res {
  const member = memberOf(snap, staffId);
  const inst = member ? instOf(snap, member.instId) : undefined;
  if (!member || !inst) return fail('This person does not exist.');
  const person = personaOf(snap, member.accountId);
  if (!person) return fail('Create an account first.');
  const current = instMembership(person, inst.id);
  if (!current) return fail('The person has no role here yet. Give a role first.');
  if (grants.some((pattern) => pattern.startsWith('!')) || denies.some((pattern) => pattern.startsWith('!'))) return fail('Do not start a pattern with !. Denies go in their own list.');
  const newGrants = grants.filter((pattern) => !(current.grants ?? []).includes(pattern));
  const problem = escalationProblem(snap, actor.id, newGrants, inst.orgId);
  if (problem) return fail(problem);
  const same = JSON.stringify([...(current.grants ?? [])].sort()) === JSON.stringify([...grants].sort()) && JSON.stringify([...(current.denies ?? [])].sort()) === JSON.stringify([...denies].sort());
  if (same) return fail('Nothing was changed.');
  const memberships = person.memberships.map((item) => (item === current ? { ...item, grants: grants.length ? grants : undefined, denies: denies.length ? denies : undefined } : item));
  return { ok: true, snap: log(replacePersona(snap, { ...person, memberships }), { instId: inst.id, staffId, summary: `Changed the individual permissions of ${member.person.fullName} (${grants.length} extra, ${denies.length} denied).` }, actor, now, true) };
}

export function bulkSetRole(snap: Snapshot, staffIds: string[], roleId: string, mode: 'add' | 'remove', actor: Actor, now: string): Res<{ count: number }> {
  if (staffIds.length === 0) return fail('Choose at least one person.');
  let next = snap;
  let count = 0;
  for (const staffId of staffIds) {
    const member = memberOf(next, staffId);
    const person = member ? personaOf(next, member.accountId) : undefined;
    if (!member || !person) return fail(`${member?.person.fullName ?? 'A person'} has no account. Create accounts first.`);
    const current = instMembership(person, member.instId)?.roleIds ?? [];
    const roleIds = mode === 'add' ? Array.from(new Set([...current, roleId])) : current.filter((id) => id !== roleId);
    if (JSON.stringify([...roleIds].sort()) === JSON.stringify([...current].sort())) continue;
    const result = setStaffRoles(next, staffId, roleIds, actor, now);
    if (!result.ok) return fail(`${member.person.fullName}: ${result.error}`);
    next = result.snap;
    count += 1;
  }
  if (count === 0) return fail('Nobody needed a change.');
  return { ok: true, snap: next, count };
}

// ---------- delegation
export function delegationLive(delegation: Delegation, today: string): boolean {
  return delegation.status === 'active' && delegation.from <= today && today <= delegation.to;
}

export function createDelegation(snap: Snapshot, input: { instId: string; fromId: string; toId: string; permissions: string[]; from: string; to: string; reason: string }, actor: Actor, now: string): Res {
  const from = memberOf(snap, input.fromId);
  const to = memberOf(snap, input.toId);
  const inst = instOf(snap, input.instId);
  if (!from || !to || !inst || from.instId !== inst.id || to.instId !== inst.id) return fail('Both people must work at this institution.');
  if (from.id === to.id) return fail('A person cannot delegate to themselves.');
  if (isExited(from.employment.status) || isExited(to.employment.status)) return fail('Both people must be current staff.');
  const giver = personaOf(snap, from.accountId);
  const taker = personaOf(snap, to.accountId);
  if (!giver || !taker) return fail('Both people need an account.');
  if (input.permissions.length === 0) return fail('Choose what to hand over.');
  if (!isoDate(input.from) || !isoDate(input.to)) return fail('Choose the first and last day.');
  if (input.to < input.from) return fail('The last day cannot be before the first.');
  if (input.to < todayOf(now)) return fail('The last day is already past.');
  const days = (new Date(`${input.to}T00:00:00Z`).getTime() - new Date(`${input.from}T00:00:00Z`).getTime()) / 86_400_000 + 1;
  if (days > 90) return fail('A delegation can last at most 90 days.');
  if (input.reason.trim().length < 3) return fail('Write a reason.');
  // The giver can only hand over what they hold. Their own place is the institution.
  const place = { orgId: inst.orgId, instId: inst.id, external: isExternal(inst) };
  const missing = allowedKeys(input.permissions).find((key) => !evaluate(giver, snap.access.roles, key, place, todayOf(now)).allowed);
  if (missing) return fail(`${from.person.fullName} does not hold ${missing}, so cannot hand it over.`);
  const id = nextId('dlg', snap.staff.delegations.map((item) => item.id));
  const delegation: Delegation = { id, instId: inst.id, fromId: from.id, toId: to.id, permissions: input.permissions, from: input.from, to: input.to, reason: input.reason.trim(), status: 'active' };
  const membership: Membership = { scope: { type: 'inst', id: inst.id }, roleIds: [], grants: input.permissions, validFrom: input.from, until: input.to, delegatedBy: from.person.fullName, delegationId: id };
  const next = replacePersona(snap, { ...taker, memberships: [...taker.memberships, membership] });
  return { ok: true, snap: log({ ...next, staff: { ...next.staff, delegations: [...next.staff.delegations, delegation] } }, { instId: inst.id, staffId: from.id, summary: `${from.person.fullName} delegated to ${to.person.fullName} until ${input.to}.` }, actor, now, true) };
}

export function endDelegation(snap: Snapshot, id: string, actor: Actor, now: string, reason: string): Res {
  const delegation = snap.staff.delegations.find((item) => item.id === id);
  if (!delegation || delegation.status !== 'active') return fail('This delegation is not active.');
  if (reason.trim().length < 3) return fail('Write a reason.');
  return { ok: true, snap: closeDelegation(snap, delegation, 'revoked', actor, now, reason) };
}

function closeDelegation(snap: Snapshot, delegation: Delegation, status: 'ended' | 'revoked', actor: Actor, now: string, reason: string): Snapshot {
  const taker = memberOf(snap, delegation.toId);
  const person = personaOf(snap, taker?.accountId ?? null);
  let next = snap;
  if (person) next = replacePersona(next, { ...person, memberships: person.memberships.filter((item) => item.delegationId !== delegation.id) });
  next = { ...next, staff: { ...next.staff, delegations: next.staff.delegations.map((item) => (item.id === delegation.id ? { ...item, status } : item)) } };
  return log(next, { instId: delegation.instId, staffId: delegation.fromId, summary: `The delegation ${delegation.id} was ${status === 'revoked' ? 'revoked' : 'ended'}. ${reason}` }, actor, now, true);
}

// ---------- exits and transfers
function releaseStaff(snap: Snapshot, member: StaffMember, actor: Actor, now: string, reason: string): { snap: Snapshot; notes: string[] } {
  let next = snap;
  const notes: string[] = [];
  const person = personaOf(next, member.accountId);
  if (person) {
    const memberships = person.memberships.filter((item) => !(item.scope.type === 'inst' && item.scope.id === member.instId));
    next = replacePersona(next, { ...person, memberships });
    notes.push('sign-in access removed');
  }
  next.staff.delegations.filter((item) => item.status === 'active' && (item.fromId === member.id || item.toId === member.id)).forEach((item) => {
    next = closeDelegation(next, item, 'ended', actor, now, `${member.person.fullName} left.`);
    notes.push(`delegation ${item.id} ended`);
  });
  const assignments = next.staff.assignments.map((item) => (item.staffId === member.id && item.status === 'active' ? { ...item, status: 'ended' as const } : item));
  const duties = next.staff.duties.map((item) => (item.staffId === member.id && item.status === 'active' ? { ...item, status: 'ended' as const, to: todayOf(now) } : item));
  const endedA = assignments.filter((item, index) => item.status !== next.staff.assignments[index].status).length;
  const endedD = duties.filter((item, index) => item.status !== next.staff.duties[index].status).length;
  if (endedA) notes.push(`${endedA} teaching assignments ended`);
  if (endedD) notes.push(`${endedD} duties ended`);
  // People who reported to this person now report to their manager. A department head post becomes vacant.
  const members = next.staff.members.map((item) => (item.employment.reportsToId === member.id ? { ...item, employment: { ...item.employment, reportsToId: member.employment.reportsToId } } : item));
  const departments = next.staff.departments.map((item) => (item.headId === member.id ? { ...item, headId: null } : item));
  if (members.some((item, index) => item !== next.staff.members[index])) notes.push('direct reports moved to the manager');
  if (departments.some((item, index) => item !== next.staff.departments[index])) notes.push('department head post is vacant');
  next = { ...next, staff: { ...next.staff, members, assignments, duties, departments } };
  void reason;
  return { snap: next, notes };
}

export function exitStaff(snap: Snapshot, staffId: string, input: { kind: Extract<StaffStatus, 'resigned' | 'terminated' | 'retired'>; date: string; reason: string }, actor: Actor, now: string): Res<{ notes: string[] }> {
  const member = memberOf(snap, staffId);
  if (!member) return fail('This person does not exist.');
  if (isExited(member.employment.status)) return fail('This person has already left.');
  if (!isoDate(input.date) || input.date < member.employment.joinDate) return fail('The last working day cannot be before the joining date.');
  if (input.reason.trim().length < 3) return fail('Write a reason.');
  const person = personaOf(snap, member.accountId);
  if (person && instMembership(person, member.instId)?.roleIds.includes('inst_admin') && adminCount(snap, member.instId, staffId) === 0) return fail('This is the last institution administrator. Make someone else an administrator first.');
  if (member.id === actor.id) return fail('You cannot end your own employment here.');
  const released = releaseStaff(snap, member, actor, now, input.reason);
  const left: StaffMember = { ...member, employment: { ...member.employment, status: input.kind, exitDate: input.date, exitReason: input.reason.trim() } };
  const next = replaceMember(released.snap, left);
  return { ok: true, snap: log(next, { instId: member.instId, staffId, summary: `${member.person.fullName} ${input.kind} on ${input.date}. ${released.notes.join(', ')}.` }, actor, now, true), notes: released.notes };
}

export function transferStaff(snap: Snapshot, staffId: string, toInstId: string, date: string, reason: string, actor: Actor, now: string): Res<{ newStaffId: string }> {
  const member = memberOf(snap, staffId);
  const from = member ? instOf(snap, member.instId) : undefined;
  const to = instOf(snap, toInstId);
  if (!member || !from) return fail('This person does not exist.');
  if (!to || to.id === from.id) return fail('Choose another institution.');
  if (isExited(member.employment.status)) return fail('This person has already left.');
  if (to.orgId !== from.orgId) return fail('Staff can only move inside the same organization.');
  if (isExternal(to) || isExternal(from)) return fail('Institutions that run independently do not take transfers.');
  if (!isoDate(date) || date < member.employment.joinDate) return fail('The transfer date cannot be before the joining date.');
  if (reason.trim().length < 3) return fail('Write a reason.');
  const oldDesignation = snap.staff.designations.find((item) => item.id === member.employment.designationId);
  const designation = snap.staff.designations.find((item) => item.instId === to.id && item.active && item.name.toLowerCase() === oldDesignation?.name.toLowerCase()) ?? snap.staff.designations.find((item) => item.instId === to.id && item.active && item.category === member.employment.category);
  const department = snap.staff.departments.find((item) => item.instId === to.id && item.active);
  if (!designation || !department) return fail(`${to.shortName} has no matching designation or department yet.`);
  if (snap.staff.members.some((item) => item.instId === to.id && !isExited(item.employment.status) && item.person.email.toLowerCase() === member.person.email.toLowerCase())) return fail(`${member.person.fullName} already works at ${to.shortName}.`);
  const released = releaseStaff(snap, member, actor, now, reason);
  const newId = nextId('staff', released.snap.staff.members.map((item) => item.id));
  const campus = to.campuses.find((item) => (item.status ?? 'active') === 'active')?.id ?? '';
  const moved: StaffMember = {
    ...member,
    id: newId,
    instId: to.id,
    employment: { ...member.employment, employeeId: nextEmployeeId(released.snap, to.id), designationId: designation.id, departmentId: department.id, reportsToId: null, joinDate: date, status: 'active', campusId: campus, exitDate: undefined, exitReason: undefined },
    documents: member.documents.map((doc) => ({ ...doc })),
  };
  const left: StaffMember = { ...member, employment: { ...member.employment, status: 'transferred', exitDate: date, exitReason: `Transferred to ${to.shortName}. ${reason.trim()}` } };
  let next = withMembers(released.snap, [...released.snap.staff.members.map((item) => (item.id === member.id ? left : item)), moved]);
  next = log(next, { instId: from.id, staffId, summary: `${member.person.fullName} was transferred to ${to.shortName}. ${released.notes.join(', ')}.` }, actor, now, true);
  next = log(next, { instId: to.id, staffId: newId, summary: `${member.person.fullName} joined from ${from.shortName}.` }, actor, now, true);
  return { ok: true, snap: next, newStaffId: newId };
}

// ---------- import
export interface ImportResult {
  created: number;
  errors: Array<{ line: number; message: string }>;
}

export const IMPORT_COLUMNS = ['name', 'email', 'phone', 'category', 'designation', 'department', 'join_date', 'type', 'gender', 'dob'];

/** Adds every valid row and reports the rest. A bad row never blocks a good one. */
export function importStaff(snap: Snapshot, instId: string, rows: Array<Record<string, string>>, actor: Actor, now: string): { snap: Snapshot; result: ImportResult } {
  let next = snap;
  const errors: ImportResult['errors'] = [];
  let created = 0;
  rows.forEach((row, index) => {
    const line = index + 2;
    const designation = next.staff.designations.find((item) => item.instId === instId && item.active && item.name.toLowerCase() === (row.designation ?? '').trim().toLowerCase());
    const department = next.staff.departments.find((item) => item.instId === instId && item.active && item.name.toLowerCase() === (row.department ?? '').trim().toLowerCase());
    if (!designation) return void errors.push({ line, message: `Unknown designation "${row.designation ?? ''}".` });
    if (!department) return void errors.push({ line, message: `Unknown department "${row.department ?? ''}".` });
    const type = (row.type ?? 'permanent').trim().toLowerCase().replace(/[\s-]+/g, '_') as EmploymentType;
    if (!['permanent', 'contract', 'visiting', 'part_time'].includes(type)) return void errors.push({ line, message: `Unknown employment type "${row.type}".` });
    const category = (row.category ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (category !== designation.category) return void errors.push({ line, message: `Category must be ${designation.category} for "${designation.name}".` });
    const gender = (row.gender ?? '').trim().toLowerCase();
    const result = addStaff(next, { instId, fullName: row.name ?? '', email: row.email ?? '', phone: row.phone ?? '', category: designation.category, designationId: designation.id, departmentId: department.id, joinDate: (row.join_date ?? '').trim(), type, gender: (['female', 'male', 'other'].includes(gender) ? gender : '') as StaffMember['person']['gender'], dob: (row.dob ?? '').trim() }, actor, now);
    if (!result.ok) return void errors.push({ line, message: result.error });
    next = result.snap;
    created += 1;
  });
  return { snap: next, result: { created, errors } };
}

// ---------- policy
export function saveStaffPolicy(snap: Snapshot, scopeId: string, policy: StaffPolicy, actor: Actor, now: string): Res {
  const inst = instOf(snap, scopeId);
  const org = snap.orgs.organizations.find((item) => item.id === scopeId);
  if (!inst && (!org || org.implicit)) return fail('Choose an institution or an organization.');
  if (!(Number.isInteger(policy.maxPeriodsPerWeek) && policy.maxPeriodsPerWeek >= 5 && policy.maxPeriodsPerWeek <= 60)) return fail('Maximum periods per week must be between 5 and 60.');
  if (!(Number.isInteger(policy.probationMonths) && policy.probationMonths >= 0 && policy.probationMonths <= 24)) return fail('Probation must be between 0 and 24 months.');
  if (!(Number.isInteger(policy.noticeDays) && policy.noticeDays >= 0 && policy.noticeDays <= 180)) return fail('Notice period must be between 0 and 180 days.');
  if (!/^[A-Za-z]{1,6}-?$/.test(policy.employeeIdPrefix)) return fail('The employee number prefix is 1 to 6 letters, with an optional dash.');
  if (JSON.stringify(snap.staff.policies[scopeId]) === JSON.stringify(policy)) return fail('Nothing was changed.');
  const next: Snapshot = { ...snap, staff: { ...snap.staff, policies: { ...snap.staff.policies, [scopeId]: policy } } };
  const orgId = inst?.orgId ?? org!.id;
  return { ok: true, snap: record(next, { orgId, instId: inst?.id, kind: 'staff', summary: `Changed the staff policy of ${inst?.shortName ?? org!.name}.` }, actor, now) };
}
