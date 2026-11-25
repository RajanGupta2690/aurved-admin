import { DEFAULT_STAFF_POLICY } from '../../core/staff/model';
import type { Delegation, Department, Designation, Duty, EmploymentType, StaffCategory, StaffMember, StaffState, TeachingAssignment, TeachingBank } from '../../core/staff/model';
import type { Institution } from '../../core/org/types';
import { DEMO_PERSONAS } from './access';
import { DEMO_INSTITUTIONS } from './tenants';

/** DEMO DATA. Every person is made up. Names come from fixed lists so the demo reads the same every day. */

const FIRST = ['Aarti', 'Rohan', 'Kavita', 'Imran', 'Deepa', 'Sanjay', 'Fatima', 'Arjun', 'Lakshmi', 'Vivek', 'Nisha', 'Tarun', 'Pooja', 'Manoj', 'Rekha', 'Sameer', 'Anjali', 'Harish', 'Jyoti', 'Naveen', 'Shweta', 'Dinesh', 'Meena', 'Rakesh', 'Sunanda', 'Faisal', 'Geeta', 'Kiran', 'Usha', 'Pradeep'];
const LAST = ['Nair', 'Mehta', 'Gupta', 'Reddy', 'Khan', 'Joshi', 'Pillai', 'Chauhan', 'Bose', 'Menon', 'Saxena', 'Kulkarni', 'Banerjee', 'Shetty', 'Pandey', 'Bhat', 'Rao', 'Sinha', 'Thakur', 'Iyer'];

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

interface DesignationSeed {
  key: string;
  name: string;
  category: StaffCategory;
  level: number;
  summary: string;
  responsibilities: string[];
  minQualification: string;
}

const SCHOOL_DESIGNATIONS: DesignationSeed[] = [
  { key: 'head', name: 'Principal', category: 'teaching', level: 1, summary: 'Leads the school academically and administratively.', responsibilities: ['Academic leadership', 'Staff appraisal', 'Board and parent liaison'], minQualification: 'Master degree and B.Ed with 10 years of experience' },
  { key: 'deputy', name: 'Vice Principal', category: 'teaching', level: 2, summary: 'Supports the principal and runs day-to-day discipline.', responsibilities: ['Timetable', 'Discipline', 'Cover for the principal'], minQualification: 'Master degree and B.Ed' },
  { key: 'senior', name: 'Senior Teacher', category: 'teaching', level: 3, summary: 'Teaches senior classes and mentors teachers.', responsibilities: ['Teach classes 9 to 12', 'Mentor new teachers'], minQualification: 'Master degree and B.Ed' },
  { key: 'teacher', name: 'Teacher', category: 'teaching', level: 4, summary: 'Teaches assigned classes and subjects.', responsibilities: ['Plan and teach lessons', 'Mark attendance', 'Assess students'], minQualification: 'Graduate and B.Ed' },
  { key: 'admin', name: 'Administrator', category: 'non_teaching', level: 2, summary: 'Runs the school office and systems.', responsibilities: ['Office operations', 'Records', 'Vendor coordination'], minQualification: 'Graduate' },
  { key: 'accountant', name: 'Accountant', category: 'non_teaching', level: 3, summary: 'Keeps the accounts and collects fees.', responsibilities: ['Fee collection', 'Books of account', 'Statutory returns'], minQualification: 'B.Com or equivalent' },
  { key: 'librarian', name: 'Librarian', category: 'non_teaching', level: 4, summary: 'Runs the library.', responsibilities: ['Catalog', 'Issue and return', 'Reading programmes'], minQualification: 'Library science degree' },
  { key: 'clerk', name: 'Office Clerk', category: 'non_teaching', level: 5, summary: 'Office support.', responsibilities: ['Filing', 'Correspondence', 'Front desk'], minQualification: 'Higher secondary' },
  { key: 'driver', name: 'Driver', category: 'non_teaching', level: 6, summary: 'Drives school vehicles safely.', responsibilities: ['Daily routes', 'Vehicle checks'], minQualification: 'Valid heavy vehicle licence' },
];

const COLLEGE_DESIGNATIONS: DesignationSeed[] = [
  { key: 'head', name: 'Principal', category: 'teaching', level: 1, summary: 'Head of the institution.', responsibilities: ['Academic leadership', 'Regulatory compliance', 'Governing body liaison'], minQualification: 'Doctorate with 15 years of experience' },
  { key: 'deputy', name: 'Head of Department', category: 'teaching', level: 2, summary: 'Leads one academic department.', responsibilities: ['Curriculum delivery', 'Faculty workload', 'Departmental research'], minQualification: 'Doctorate' },
  { key: 'senior', name: 'Professor', category: 'teaching', level: 3, summary: 'Senior faculty.', responsibilities: ['Teaching', 'Research guidance', 'Examination duties'], minQualification: 'Doctorate' },
  { key: 'teacher', name: 'Assistant Professor', category: 'teaching', level: 4, summary: 'Faculty.', responsibilities: ['Teaching', 'Internal assessment', 'Student mentoring'], minQualification: 'Master degree with NET or SET' },
  { key: 'admin', name: 'Registrar', category: 'non_teaching', level: 2, summary: 'Keeps academic and administrative records.', responsibilities: ['Admissions records', 'Examination records', 'Certificates'], minQualification: 'Master degree' },
  { key: 'accountant', name: 'Accountant', category: 'non_teaching', level: 3, summary: 'Accounts and fee collection.', responsibilities: ['Fees', 'Payroll input', 'Audit support'], minQualification: 'B.Com or equivalent' },
  { key: 'librarian', name: 'Librarian', category: 'non_teaching', level: 4, summary: 'Runs the library.', responsibilities: ['Catalog', 'Journals', 'Reading rooms'], minQualification: 'Library science degree' },
  { key: 'clerk', name: 'Lab Technician', category: 'non_teaching', level: 5, summary: 'Prepares and maintains laboratories.', responsibilities: ['Lab setup', 'Equipment care'], minQualification: 'Diploma or degree in science' },
  { key: 'driver', name: 'Office Assistant', category: 'non_teaching', level: 6, summary: 'Office support.', responsibilities: ['Filing', 'Correspondence'], minQualification: 'Higher secondary' },
];

const SCHOOL_DEPARTMENTS = ['Academics', 'Primary section', 'Administration', 'Accounts', 'Library'];
const COLLEGE_DEPARTMENTS = ['Academic department', 'Examination cell', 'Administration', 'Accounts', 'Library'];

const SCHOOL_BANK: TeachingBank = {
  groups: ['Class 1-A', 'Class 1-B', 'Class 2-A', 'Class 2-B', 'Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A'],
  subjects: ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Art', 'Physical Education'],
};
const COLLEGE_BANK: TeachingBank = {
  groups: ['Year 1, Section A', 'Year 1, Section B', 'Year 2, Section A', 'Year 3, Section A', 'Postgraduate Year 1'],
  subjects: ['Core subject 1', 'Core subject 2', 'Core subject 3', 'Elective 1', 'Elective 2', 'Laboratory', 'Research methods'],
};

/** People the demo logins refer to. They keep their accounts, so signing in as them shows their own staff record. */
interface Named {
  instId: string;
  personaId: string;
  designation: string;
}
const NAMED: Named[] = [
  { instId: 'inst-sunrise', personaId: 'p-sunrise-admin', designation: 'admin' },
  { instId: 'inst-sunrise', personaId: 'p-sunrise-principal', designation: 'head' },
  { instId: 'inst-sunrise', personaId: 'p-sunrise-teacher', designation: 'teacher' },
  { instId: 'inst-sunrise', personaId: 'p-sunrise-accountant', designation: 'accountant' },
  { instId: 'inst-sunrise', personaId: 'p-sunrise-librarian', designation: 'librarian' },
  { instId: 'inst-horizon-b', personaId: 'p-horizon-branch-b', designation: 'admin' },
  { instId: 'inst-horizon-a', personaId: 'p-horizon-multi', designation: 'teacher' },
  { instId: 'inst-horizon-c', personaId: 'p-horizon-multi', designation: 'admin' },
  { instId: 'inst-mer-eng', personaId: 'p-meridian-eng', designation: 'head' },
  { instId: 'inst-greenfield', personaId: 'p-greenfield-admin', designation: 'admin' },
  { instId: 'inst-lakeside', personaId: 'p-lakeside-admin', designation: 'admin' },
];

const SIZE: Record<string, number> = { 'inst-sunrise': 16, 'inst-meridian': 12 };

function build(inst: Institution) {
  const school = inst.profile === 'school';
  const random = rng(inst.id);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
  const dSeeds = school ? SCHOOL_DESIGNATIONS : COLLEGE_DESIGNATIONS;
  const designations: Designation[] = dSeeds.map((seed) => ({ id: `desg-${inst.id}-${seed.key}`, instId: inst.id, name: seed.name, category: seed.category, level: seed.level, summary: seed.summary, responsibilities: seed.responsibilities, minQualification: seed.minQualification, active: true }));
  const deptNames = school ? SCHOOL_DEPARTMENTS : COLLEGE_DEPARTMENTS;
  const departments: Department[] = deptNames.map((name, index) => ({ id: `dept-${inst.id}-${index + 1}`, instId: inst.id, name, headId: null, active: true }));
  const desg = (key: string) => designations.find((item) => item.id === `desg-${inst.id}-${key}`)!;
  const dept = (index: number) => departments[index];
  const campus = inst.campuses[0]?.id ?? '';

  // Roster: key of designation, department index, named persona.
  const roster: Array<{ key: string; department: number; personaId?: string }> = [];
  const named = NAMED.filter((item) => item.instId === inst.id);
  const namedHead = named.find((item) => item.designation === 'head');
  roster.push({ key: 'head', department: 0, personaId: namedHead?.personaId });
  named.filter((item) => item.designation !== 'head').forEach((item) => roster.push({ key: item.designation, department: item.designation === 'accountant' ? 3 : item.designation === 'librarian' ? 4 : item.designation === 'admin' ? 2 : 0, personaId: item.personaId }));
  const total = SIZE[inst.id] ?? 9;
  const filler = ['deputy', 'senior', 'teacher', 'teacher', 'teacher', 'teacher', 'teacher', 'teacher', 'clerk', 'driver', 'teacher', 'teacher', 'accountant', 'librarian', 'admin'];
  let cursor = 0;
  while (roster.length < total) {
    const key = filler[cursor++ % filler.length];
    if (['accountant', 'librarian', 'admin'].includes(key) && roster.some((item) => item.key === key)) continue;
    roster.push({ key, department: key === 'accountant' ? 3 : key === 'librarian' ? 4 : key === 'admin' || key === 'clerk' || key === 'driver' ? 2 : key === 'teacher' && school && cursor % 3 === 0 ? 1 : 0 });
  }

  const members: StaffMember[] = roster.map((entry, index) => {
    const persona = entry.personaId ? DEMO_PERSONAS.find((item) => item.id === entry.personaId) : undefined;
    const fullName = persona ? persona.name.replace(/^(Dr\.|Prof\.)\s*/, '') : `${pick(FIRST)} ${pick(LAST)}`;
    const designation = desg(entry.key);
    const joinYear = 2012 + Math.floor(random() * 13);
    const joinDate = `${joinYear}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 27)).padStart(2, '0')}`;
    const type: EmploymentType = entry.key === 'driver' ? 'contract' : index % 11 === 7 ? 'part_time' : index % 13 === 9 ? 'visiting' : 'permanent';
    const email = persona?.email ?? `${fullName.toLowerCase().replace(/[^a-z]+/g, '.')}.${index}@${inst.shortName.toLowerCase().replace(/[^a-z]+/g, '')}.demo`;
    const docs = ['Identity proof', 'Appointment letter', 'Address proof'].filter((_, i) => index % 6 !== 5 || i === 0).map((type2, i) => ({ id: `doc-${i + 1}`, type: type2, name: `${type2}.pdf`, verified: !(index % 7 === 3 && i === 1) }));
    return {
      id: `staff-${inst.id}-${index + 1}`,
      instId: inst.id,
      person: { fullName, gender: (index % 2 === 0 ? 'female' : 'male') as 'female' | 'male', dob: `${1970 + Math.floor(random() * 28)}-0${1 + Math.floor(random() * 9)}-1${Math.floor(random() * 9)}`, phone: `+91 9${Math.floor(random() * 900000000 + 100000000)}`, email, address: `${inst.city}` },
      employment: { employeeId: `EMP${String(index + 1).padStart(3, '0')}`, category: designation.category, designationId: designation.id, departmentId: dept(entry.department).id, reportsToId: null, joinDate, type, status: 'active', campusId: campus },
      qualifications: designation.category === 'teaching' ? [{ id: 'q-1', degree: school ? 'B.Ed' : 'Ph.D', institution: 'State University', year: joinYear - 3 }] : [],
      experience: index % 4 === 0 ? [{ id: 'e-1', organization: 'Previous employer', role: designation.name, from: `${joinYear - 4}-06-01`, to: `${joinYear}-03-31` }] : [],
      documents: docs,
      accountId: persona?.id ?? null,
    };
  });
  // Reporting lines: everyone reports to the head, teachers to a senior or deputy where there is one.
  const head = members[0];
  const seniors = members.filter((member) => ['deputy', 'senior'].some((key) => member.employment.designationId.endsWith(`-${key}`)));
  members.forEach((member, index) => {
    if (index === 0) return;
    const isTeacher = member.employment.designationId.endsWith('-teacher') && seniors.length > 0;
    const boss = isTeacher ? seniors[index % seniors.length] : head;
    member.employment.reportsToId = boss.id === member.id ? head.id : boss.id;
  });
  departments[0].headId = head.id;
  const adminDept = members.find((member) => member.employment.designationId.endsWith('-admin'));
  if (adminDept) departments[2].headId = adminDept.id;
  // A few statuses for variety.
  if (members.length > 6) members[5].employment.status = 'on_leave';
  if (members.length > 8 && inst.id === 'inst-sunrise') {
    members[8].employment.status = 'resigned';
    members[8].employment.exitDate = '2026-06-30';
    members[8].employment.exitReason = 'Moved to another city.';
    members[8].accountId = null;
  }
  return { designations, departments, members };
}

function seedAssignments(members: StaffMember[], bank: TeachingBank): TeachingAssignment[] {
  const teachers = members.filter((member) => member.employment.category === 'teaching' && member.employment.status === 'active');
  const out: TeachingAssignment[] = [];
  let g = 0;
  teachers.forEach((member, index) => {
    const subject = bank.subjects[index % bank.subjects.length];
    for (let k = 0; k < 2; k++) {
      const group = bank.groups[(g++) % bank.groups.length];
      if (out.some((item) => item.group === group && item.subject === subject)) continue;
      out.push({ id: `asg-${out.length + 1}`, instId: member.instId, staffId: member.id, sessionId: 'ay-2025-26', group, subject, periods: 5 + ((index + k) % 4), status: 'active' });
    }
  });
  return out;
}

export function seedStaff(): StaffState {
  const parts = DEMO_INSTITUTIONS.map(build);
  const members = parts.flatMap((part) => part.members);
  const banks: Record<string, TeachingBank> = {};
  DEMO_INSTITUTIONS.forEach((inst) => (banks[inst.id] = inst.profile === 'school' ? SCHOOL_BANK : COLLEGE_BANK));
  const assignments = parts.flatMap((part, index) => seedAssignments(part.members, banks[DEMO_INSTITUTIONS[index].id])).map((item, index) => ({ ...item, id: `asg-${index + 1}` }));
  const duties: Duty[] = [];
  const principal = members.find((member) => member.accountId === 'p-sunrise-principal');
  const teacher = members.find((member) => member.accountId === 'p-sunrise-teacher');
  if (principal) duties.push({ id: 'duty-1', instId: 'inst-sunrise', staffId: principal.id, title: 'Exam coordinator', from: '2025-06-01', status: 'active' });
  if (teacher) duties.push({ id: 'duty-2', instId: 'inst-sunrise', staffId: teacher.id, title: 'Class teacher', from: '2025-06-01', note: 'Class 1-A', status: 'active' });
  // What each person does besides the designation: subjects they can take, or work area and shift.
  const AREA: Record<string, string> = { accountant: 'Accounts', librarian: 'Library', admin: 'Administration', clerk: 'Reception', driver: 'Transport' };
  members.forEach((member) => {
    if (member.employment.category === 'teaching') {
      const taken = Array.from(new Set(assignments.filter((item) => item.staffId === member.id).map((item) => item.subject)));
      const bank = banks[member.instId];
      const subjects = taken.length > 0 ? taken : bank ? [bank.subjects[0], bank.subjects[1]].filter(Boolean) : [];
      if (subjects.length > 0) member.work = { subjects };
    } else {
      const key = member.employment.designationId.split('-').pop() ?? '';
      member.work = { area: AREA[key] ?? 'Administration', shift: key === 'driver' ? 'rotational' : 'day' };
    }
  });
  // Jobs at the events that exist in the Events seed (rec-events-1 is the Sunrise sports day, rec-events-2 the Greenfield tech fest).
  const sunriseStaff = members.filter((member) => member.instId === 'inst-sunrise' && member.employment.status === 'active');
  const sunriseTeachers = sunriseStaff.filter((member) => member.employment.category === 'teaching' && member.id !== teacher?.id);
  const sunriseOthers = sunriseStaff.filter((member) => member.employment.category === 'non_teaching');
  const eventJob = (id: string, member: StaffMember | undefined, eventId: string, eventTitle: string, role: string, date: string, instId: string) => {
    if (member) duties.push({ id, instId, staffId: member.id, title: role, role, eventId, eventTitle, from: date, to: date, status: 'active' });
  };
  eventJob('duty-3', teacher, 'rec-events-1', 'Annual sports day', 'Coordinator', '2027-01-15', 'inst-sunrise');
  eventJob('duty-4', sunriseTeachers[0], 'rec-events-1', 'Annual sports day', 'First aid', '2027-01-15', 'inst-sunrise');
  eventJob('duty-5', sunriseOthers[0], 'rec-events-1', 'Annual sports day', 'Registration desk', '2027-01-15', 'inst-sunrise');
  eventJob('duty-6', members.find((member) => member.instId === 'inst-greenfield' && member.employment.category === 'teaching' && member.employment.status === 'active'), 'rec-events-2', 'Tech fest', 'Judge', '2027-02-20', 'inst-greenfield');
  const delegations: Delegation[] = [];
  return {
    members,
    designations: parts.flatMap((part) => part.designations),
    departments: parts.flatMap((part) => part.departments),
    assignments,
    duties,
    delegations,
    policies: {
      'org-horizon': { ...DEFAULT_STAFF_POLICY, maxPeriodsPerWeek: 28, employeeIdPrefix: 'HZN-', requiredDocuments: ['Identity proof', 'Appointment letter', 'Address proof'] },
      'org-meridian': { ...DEFAULT_STAFF_POLICY, maxPeriodsPerWeek: 18, probationMonths: 12, noticeDays: 60, employeeIdPrefix: 'MU-' },
    },
    banks,
    events: [],
  };
}
