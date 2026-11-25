import type { Parent, Student } from '../../types';

/**
 * Pure rules for linking students to parent records.
 * No React, no storage. The store in familyStore.ts calls these functions.
 *
 * Model: a Parent record is one family (father, mother, optional guardian).
 * A student links to exactly one Parent record. A Parent record can have many
 * students (siblings). The link is kept on both sides and always updated together.
 */

export type ParentFields = Omit<Parent, 'id' | 'studentIds'>;

export interface FamilyState {
  parents: Parent[];
  /** studentId -> parentId. An empty string means no parent is linked. */
  links: Record<string, string>;
}

/** Every field is a string so it can be bound directly to inputs. */
export interface ParentFormValues {
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherOccupation: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  address: string;
  feePayer: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  contactPreference: string;
  restrictedNote: string;
}

export type FormErrors = Partial<Record<keyof ParentFormValues | 'form', string>>;

export interface DuplicateMatch {
  parent: Parent;
  /** The phone numbers or emails that matched. */
  matched: string[];
}

// ---------------------------------------------------------------- form values

export function emptyParentForm(address = ''): ParentFormValues {
  return {
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    motherOccupation: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    address,
    feePayer: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    contactPreference: '',
    restrictedNote: '',
  };
}

export function parentToForm(parent: Parent): ParentFormValues {
  return {
    fatherName: parent.fatherName ?? '',
    fatherPhone: parent.fatherPhone ?? '',
    fatherEmail: parent.fatherEmail ?? '',
    fatherOccupation: parent.fatherOccupation ?? '',
    motherName: parent.motherName ?? '',
    motherPhone: parent.motherPhone ?? '',
    motherEmail: parent.motherEmail ?? '',
    motherOccupation: parent.motherOccupation ?? '',
    guardianName: parent.guardianName ?? '',
    guardianPhone: parent.guardianPhone ?? '',
    guardianRelation: parent.guardianRelation ?? '',
    address: parent.address ?? '',
    feePayer: parent.feePayer ?? '',
    emergencyName: parent.emergencyName ?? '',
    emergencyPhone: parent.emergencyPhone ?? '',
    emergencyRelation: parent.emergencyRelation ?? '',
    contactPreference: parent.contactPreference ?? '',
    restrictedNote: parent.restrictedNote ?? '',
  };
}

export function formToParentFields(values: ParentFormValues): ParentFields {
  const trimmed = (text: string) => text.trim();
  const optional = (text: string) => text.trim() || undefined;
  return {
    fatherName: trimmed(values.fatherName),
    fatherPhone: trimmed(values.fatherPhone),
    fatherEmail: optional(values.fatherEmail),
    fatherOccupation: optional(values.fatherOccupation),
    motherName: trimmed(values.motherName),
    motherPhone: optional(values.motherPhone),
    motherEmail: optional(values.motherEmail),
    motherOccupation: optional(values.motherOccupation),
    guardianName: optional(values.guardianName),
    guardianPhone: optional(values.guardianPhone),
    guardianRelation: optional(values.guardianRelation),
    address: trimmed(values.address),
    feePayer: (['father', 'mother', 'guardian'] as const).find((who) => who === values.feePayer),
    emergencyName: optional(values.emergencyName),
    emergencyPhone: optional(values.emergencyPhone),
    emergencyRelation: optional(values.emergencyRelation),
    contactPreference: (['call', 'sms', 'whatsapp', 'email'] as const).find((how) => how === values.contactPreference),
    restrictedNote: optional(values.restrictedNote),
  };
}

// ----------------------------------------------------------------- validation

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 7 to 15 digits with an optional leading +. Spaces, dashes and brackets are ignored. */
export function isValidPhone(value: string): boolean {
  const compact = value.replace(/[\s().-]/g, '');
  return /^\+?\d{7,15}$/.test(compact);
}

function anyFilled(...texts: string[]): boolean {
  return texts.some((text) => text.trim() !== '');
}

function checkPerson(
  errors: FormErrors,
  keys: { name: keyof ParentFormValues; phone: keyof ParentFormValues; email?: keyof ParentFormValues },
  who: string,
  values: ParentFormValues,
) {
  const name = values[keys.name].trim();
  const phone = values[keys.phone].trim();
  if (name.length < 2) errors[keys.name] = `${who}'s name is required (at least 2 characters).`;
  if (!phone) errors[keys.phone] = `${who}'s mobile number is required.`;
  else if (!isValidPhone(phone)) errors[keys.phone] = 'Enter 7 to 15 digits. A leading + is allowed.';
  if (keys.email) {
    const email = values[keys.email].trim();
    if (email && !EMAIL_PATTERN.test(email)) errors[keys.email] = 'Enter a valid email address.';
  }
}

/**
 * Rules:
 * - At least one of father, mother or guardian must be given.
 * - A person who is started needs a name and a mobile number. Parents sign in to the
 *   future app with a mobile number and OTP, so the number is not optional.
 * - A guardian also needs a relation.
 * - Address is required.
 */
export function validateParentForm(values: ParentFormValues): FormErrors {
  const errors: FormErrors = {};

  const hasFather = anyFilled(values.fatherName, values.fatherPhone, values.fatherEmail, values.fatherOccupation);
  const hasMother = anyFilled(values.motherName, values.motherPhone, values.motherEmail, values.motherOccupation);
  const hasGuardian = anyFilled(values.guardianName, values.guardianPhone, values.guardianRelation);

  if (!hasFather && !hasMother && !hasGuardian) {
    errors.form = 'Add at least one parent or guardian.';
  }
  if (hasFather) {
    checkPerson(errors, { name: 'fatherName', phone: 'fatherPhone', email: 'fatherEmail' }, 'Father', values);
  }
  if (hasMother) {
    checkPerson(errors, { name: 'motherName', phone: 'motherPhone', email: 'motherEmail' }, 'Mother', values);
  }
  if (hasGuardian) {
    checkPerson(errors, { name: 'guardianName', phone: 'guardianPhone' }, 'Guardian', values);
    if (!values.guardianRelation.trim()) errors.guardianRelation = 'Say how the guardian is related to the student.';
  }
  if (!values.address.trim()) errors.address = 'Address is required.';

  if (values.feePayer === 'father' && !hasFather) errors.feePayer = 'The father is not on this record.';
  if (values.feePayer === 'mother' && !hasMother) errors.feePayer = 'The mother is not on this record.';
  if (values.feePayer === 'guardian' && !hasGuardian) errors.feePayer = 'There is no guardian on this record.';
  if (anyFilled(values.emergencyName, values.emergencyPhone, values.emergencyRelation)) {
    if (values.emergencyName.trim().length < 2) errors.emergencyName = 'Enter the name of the emergency contact.';
    if (!values.emergencyPhone.trim()) errors.emergencyPhone = 'Enter the emergency contact number.';
    else if (!isValidPhone(values.emergencyPhone.trim())) errors.emergencyPhone = 'Enter 7 to 15 digits. A leading + is allowed.';
  }

  return errors;
}

// ------------------------------------------------------------ names and search

export function parentDisplayName(parent: Parent): string {
  return parent.fatherName || parent.motherName || parent.guardianName || 'Unnamed parent';
}

export interface ParentPerson {
  feePayer?: boolean;
  key: 'father' | 'mother' | 'guardian';
  role: string;
  name: string;
  phone?: string;
  email?: string;
  occupation?: string;
}

/** The people on a family record, in display order. Only people who have a name are listed. */
export function parentPeople(parent: Parent): ParentPerson[] {
  const people: ParentPerson[] = [];
  if (parent.fatherName) {
    people.push({
      key: 'father',
      role: 'Father',
      name: parent.fatherName,
      phone: parent.fatherPhone || undefined,
      email: parent.fatherEmail,
      occupation: parent.fatherOccupation,
      feePayer: parent.feePayer === 'father',
    });
  }
  if (parent.motherName) {
    people.push({
      key: 'mother',
      role: 'Mother',
      name: parent.motherName,
      phone: parent.motherPhone,
      email: parent.motherEmail,
      occupation: parent.motherOccupation,
      feePayer: parent.feePayer === 'mother',
    });
  }
  if (parent.guardianName) {
    people.push({
      key: 'guardian',
      role: parent.guardianRelation ? `Guardian (${parent.guardianRelation})` : 'Guardian',
      name: parent.guardianName,
      phone: parent.guardianPhone,
      feePayer: parent.feePayer === 'guardian',
    });
  }
  return people;
}

export function parentFullLabel(parent: Parent): string {
  const names = [parent.fatherName, parent.motherName, parent.guardianName].filter(Boolean);
  return names.length > 0 ? names.join(' & ') : 'Unnamed parent';
}

export function normalizePhone(value?: string): string {
  return (value ?? '').replace(/\D/g, '');
}

function samePhone(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // Same subscriber number written with and without a country code.
  return a.length >= 10 && b.length >= 10 && a.slice(-10) === b.slice(-10);
}

export function searchParents(state: FamilyState, query: string): Parent[] {
  const text = query.trim().toLowerCase();
  const digits = text.replace(/\D/g, '');
  const sorted = [...state.parents].sort((a, b) => parentDisplayName(a).localeCompare(parentDisplayName(b)));
  if (!text) return sorted;
  return sorted.filter((parent) => {
    const haystack = [parent.fatherName, parent.motherName, parent.guardianName, parent.fatherEmail, parent.motherEmail]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (haystack.includes(text)) return true;
    if (digits.length >= 3) {
      return [parent.fatherPhone, parent.motherPhone, parent.guardianPhone].some((phone) =>
        normalizePhone(phone).includes(digits),
      );
    }
    return false;
  });
}

/** Parent records that already use one of the phone numbers or emails in the form. */
export function findDuplicateParents(
  state: FamilyState,
  values: ParentFormValues,
  excludeParentId?: string,
): DuplicateMatch[] {
  const phones = [values.fatherPhone, values.motherPhone, values.guardianPhone].map(normalizePhone).filter(Boolean);
  const emails = [values.fatherEmail, values.motherEmail].map((email) => email.trim().toLowerCase()).filter(Boolean);
  const found: DuplicateMatch[] = [];

  for (const parent of state.parents) {
    if (parent.id === excludeParentId) continue;
    const matched: string[] = [];
    for (const raw of [parent.fatherPhone, parent.motherPhone, parent.guardianPhone]) {
      const digits = normalizePhone(raw);
      if (raw && digits && phones.some((phone) => samePhone(phone, digits))) matched.push(raw);
    }
    for (const raw of [parent.fatherEmail, parent.motherEmail]) {
      const email = (raw ?? '').trim().toLowerCase();
      if (raw && email && emails.includes(email)) matched.push(raw);
    }
    if (matched.length > 0) found.push({ parent, matched: Array.from(new Set(matched)) });
  }
  return found;
}

// ---------------------------------------------------------------------- links

export function getParentForStudent(state: FamilyState, studentId: string): Parent | undefined {
  const parentId = state.links[studentId];
  return parentId ? state.parents.find((parent) => parent.id === parentId) : undefined;
}

function nextParentId(parents: Parent[]): string {
  let highest = 0;
  for (const parent of parents) {
    const match = /^parent-(\d+)$/.exec(parent.id);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `parent-${highest + 1}`;
}

/** Links a student to a parent record. A student has one parent record, so any old link is replaced. */
export function linkStudent(state: FamilyState, studentId: string, parentId: string): FamilyState {
  if (!state.parents.some((parent) => parent.id === parentId)) return state;
  if (state.links[studentId] === parentId) return state;

  const parents = state.parents.map((parent) => {
    const remaining = parent.studentIds.filter((id) => id !== studentId);
    if (parent.id === parentId) return { ...parent, studentIds: [...remaining, studentId] };
    return remaining.length === parent.studentIds.length ? parent : { ...parent, studentIds: remaining };
  });
  return { parents, links: { ...state.links, [studentId]: parentId } };
}

/** Removes the link. The parent record is kept, together with any other children it has. */
export function unlinkStudent(state: FamilyState, studentId: string): FamilyState {
  if (!state.links[studentId]) return state;
  const parents = state.parents.map((parent) =>
    parent.studentIds.includes(studentId)
      ? { ...parent, studentIds: parent.studentIds.filter((id) => id !== studentId) }
      : parent,
  );
  return { parents, links: { ...state.links, [studentId]: '' } };
}

export function createParentForStudent(
  state: FamilyState,
  studentId: string,
  fields: ParentFields,
): { state: FamilyState; parent: Parent } {
  const id = nextParentId(state.parents);
  const added: FamilyState = { parents: [...state.parents, { ...fields, id, studentIds: [] }], links: state.links };
  const next = linkStudent(added, studentId, id);
  return { state: next, parent: next.parents.find((parent) => parent.id === id) as Parent };
}

/** Deletes a parent record, but only when no student is linked to it. Otherwise nothing changes. */
export function removeParent(state: FamilyState, parentId: string): FamilyState {
  const parent = state.parents.find((candidate) => candidate.id === parentId);
  if (!parent || parent.studentIds.length > 0) return state;
  return { parents: state.parents.filter((candidate) => candidate.id !== parentId), links: state.links };
}

export function updateParent(state: FamilyState, parentId: string, fields: ParentFields): FamilyState {
  if (!state.parents.some((parent) => parent.id === parentId)) return state;
  return {
    parents: state.parents.map((parent) => (parent.id === parentId ? { ...parent, ...fields } : parent)),
    links: state.links,
  };
}

// ----------------------------------------------------------------------- seed

/** Builds state from seed data. The student side is the source of truth, so both sides always agree. */
export function seedFamilyState(parents: Parent[], students: Pick<Student, 'id' | 'parentId'>[]): FamilyState {
  const known = new Set(parents.map((parent) => parent.id));
  const links: Record<string, string> = {};
  for (const student of students) links[student.id] = known.has(student.parentId) ? student.parentId : '';
  return {
    parents: parents.map((parent) => ({
      ...parent,
      studentIds: students.filter((student) => links[student.id] === parent.id).map((student) => student.id),
    })),
    links,
  };
}

/** Checks data read back from storage before it is trusted. */
export function isFamilyState(value: unknown): value is FamilyState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { parents?: unknown; links?: unknown };
  if (!Array.isArray(candidate.parents)) return false;
  if (!candidate.links || typeof candidate.links !== 'object' || Array.isArray(candidate.links)) return false;
  const parentsOk = candidate.parents.every(
    (parent) =>
      parent &&
      typeof parent.id === 'string' &&
      typeof parent.address === 'string' &&
      Array.isArray(parent.studentIds),
  );
  const linksOk = Object.values(candidate.links as Record<string, unknown>).every((id) => typeof id === 'string');
  return parentsOk && linksOk;
}

// ------------------------------------------------------------ student lookup

const compactCode = (text: string) => text.replace(/\s+/g, '').toLowerCase();

/** Finds a student by the school student ID (the admission number). Spaces and case are ignored. */
export function findStudentByCode(students: Student[], code: string): Student | undefined {
  const wanted = compactCode(code);
  return wanted ? students.find((student) => compactCode(student.admissionNumber) === wanted) : undefined;
}

/** Students whose school ID or name contains the text. The exact ID comes first. */
export function searchStudents(students: Student[], query: string, limit = 6): Student[] {
  const text = query.trim().toLowerCase();
  if (text.length < 2) return [];
  const exact = findStudentByCode(students, query);
  const rest = students.filter((student) => student.id !== exact?.id && `${student.fullName} ${student.admissionNumber}`.toLowerCase().includes(text));
  return [...(exact ? [exact] : []), ...rest].slice(0, limit);
}

/** The next school student ID in the same pattern as the existing ones, for example SUN/2026/005. */
export function nextStudentCode(students: Pick<Student, 'admissionNumber'>[], year: number): string {
  const pattern = /^([A-Za-z]+)\/(\d{4})\/(\d+)$/;
  let prefix = 'SUN';
  let highest = 0;
  for (const student of students) {
    const match = pattern.exec(student.admissionNumber);
    if (!match) continue;
    prefix = match[1];
    if (Number(match[2]) === year) highest = Math.max(highest, Number(match[3]));
  }
  return `${prefix}/${year}/${String(highest + 1).padStart(3, '0')}`;
}
