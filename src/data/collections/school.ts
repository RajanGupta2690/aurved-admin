import type { CollectionDef, ModuleGroup } from '../../core/records/types';
import { f, flow, GRADES, seed, st, SUN, sunStaff, HZA } from './helpers';

const grade = f.sel('grade', 'Class', GRADES, { required: true, list: true });

// ---------- admissions (replaces the old admissions screen)
const applications: CollectionDef = {
  key: 'applications',
  screenId: 'SC-01',
  module: 'admissions',
  title: 'Enquiries and applications',
  singular: 'Application',
  description: 'From the first enquiry to admission. Each step is recorded.',
  titleField: 'student',
  fields: [
    f.text('student', 'Student name', { required: true, list: true }),
    f.sel('grade', 'Applying for', GRADES, { required: true, list: true }),
    f.text('guardian', 'Parent or guardian', { required: true, list: true }),
    f.phone('phone', 'Phone', { required: true }),
    f.email('email', 'Email'),
    f.date('dob', 'Date of birth'),
    f.sel('source', 'How they found us', ['Walk in', 'Website', 'Referral', 'Advertisement', 'Social media'], { default: 'walk_in' }),
    f.date('interview', 'Interview date'),
    f.long('notes', 'Notes'),
  ],
  statuses: [st('enquiry', 'Enquiry', 'neutral'), st('applied', 'Applied', 'info'), st('interview', 'Interview', 'warning'), st('offered', 'Offered', 'brand'), st('admitted', 'Admitted', 'success', { final: true, needs: 'approve' }), st('rejected', 'Rejected', 'danger', { final: true, reason: true, needs: 'approve' }), st('withdrawn', 'Withdrawn', 'neutral', { final: true, reason: true })],
  initialStatus: 'enquiry',
  transitions: flow(['enquiry', 'applied', 'interview', 'offered', 'admitted'], { enquiry: ['withdrawn'], applied: ['rejected', 'withdrawn'], interview: ['rejected', 'withdrawn'], offered: ['rejected', 'withdrawn'] }),
  dueField: 'interview',
  actions: ['approve'],
  rules: (data, ctx) => {
    if (data.dob && String(data.dob) > ctx.today) return 'The date of birth cannot be in the future.';
    if (data.__status === 'interview' && !data.interview) return 'Set the interview date first.';
    return null;
  },
  seeds: [
    seed(SUN, { student: 'Kabir Sethi', grade: 'class_1', guardian: 'Anil Sethi', phone: '+91 98200 11001', source: 'website' }, 'enquiry'),
    seed(SUN, { student: 'Myra Khanna', grade: 'class_5', guardian: 'Rohit Khanna', phone: '+91 98200 11002', source: 'referral', interview: '2026-12-02' }, 'interview'),
    seed(SUN, { student: 'Dev Arora', grade: 'class_3', guardian: 'Sunil Arora', phone: '+91 98200 11003', source: 'walk_in' }, 'offered'),
    seed(SUN, { student: 'Zoya Ali', grade: 'class_7', guardian: 'Sana Ali', phone: '+91 98200 11004', source: 'advertisement' }, 'applied'),
    seed(HZA, { student: 'Ira Bhatia', grade: 'class_2', guardian: 'Mohit Bhatia', phone: '+91 98200 11005', source: 'website' }, 'applied'),
  ],
};

// ---------- student wellbeing
const progress: CollectionDef = {
  key: 'progress',
  screenId: 'SP-S-01',
  module: 'wellbeing',
  title: 'Student progress and learning gaps',
  singular: 'Observation',
  description: 'Where a student is behind or ahead, what is being done, and when it is reviewed.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), grade, f.text('subject', 'Subject', { required: true, list: true }), f.sel('level', 'Gap', ['Ahead', 'On track', 'Slightly behind', 'Far behind'], { required: true, list: true }), f.long('action', 'What is being done', { required: true }), f.staff('owner', 'Responsible teacher', { required: true, list: true }), f.date('review', 'Review on', { required: true, list: true })],
  statuses: [st('open', 'Open', 'warning'), st('improving', 'Improving', 'info'), st('closed', 'Closed', 'success', { final: true })],
  initialStatus: 'open',
  transitions: flow(['open', 'improving', 'closed']),
  dueField: 'review',
  rules: (data, ctx) => (ctx.isNew && String(data.review) < ctx.today ? 'The review date cannot be in the past.' : null),
  seeds: [seed(SUN, { student: 'Aarav Sharma', grade: 'class_5', subject: 'Mathematics', level: 'slightly_behind', action: 'Extra practice twice a week with the class teacher.', owner: sunStaff(3), review: '2026-12-15' }, 'open'), seed(SUN, { student: 'Diya Patel', grade: 'class_3', subject: 'English', level: 'far_behind', action: 'Reading support group.', owner: sunStaff(3), review: '2026-11-10' }, 'improving')],
};

const behaviour: CollectionDef = {
  key: 'behaviour',
  screenId: 'SC-02',
  module: 'wellbeing',
  title: 'Behaviour and discipline',
  singular: 'Incident',
  description: 'Incidents and what followed. Serious ones need the principal.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), grade, f.date('date', 'Date', { required: true, list: true }), f.sel('severity', 'Severity', ['Minor', 'Moderate', 'Serious'], { required: true, list: true }), f.long('description', 'What happened', { required: true }), f.long('action', 'Action taken'), f.staff('reportedBy', 'Reported by', { required: true }), f.bool('parentsInformed', 'Parents informed')],
  statuses: [st('reported', 'Reported', 'warning'), st('reviewed', 'Reviewed', 'info'), st('closed', 'Closed', 'success', { final: true, needs: 'approve' })],
  initialStatus: 'reported',
  transitions: flow(['reported', 'reviewed', 'closed']),
  actions: ['approve'],
  rules: (data, ctx) => {
    if (String(data.date) > ctx.today) return 'The date cannot be in the future.';
    if (data.severity === 'serious' && data.__status === 'closed' && !data.parentsInformed) return 'Parents must be informed before a serious incident is closed.';
    return null;
  },
  seeds: [seed(SUN, { student: 'Rahul Verma', grade: 'class_8', date: '2026-11-12', severity: 'minor', description: 'Late to class three days in a row.', reportedBy: sunStaff(3), parentsInformed: true }, 'reviewed'), seed(SUN, { student: 'Neel Joshi', grade: 'class_9', date: '2026-11-18', severity: 'serious', description: 'Fight in the playground.', reportedBy: sunStaff(1), parentsInformed: false }, 'reported')],
};

const counselling: CollectionDef = {
  key: 'counselling',
  screenId: 'SP-S-04',
  module: 'wellbeing',
  title: 'Counselling',
  singular: 'Session',
  description: 'Counselling sessions. Notes are private to the counselling team.',
  sensitive: 'Counselling notes are private. Only roles with access to this feature can read them.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), grade, f.date('date', 'Session date', { required: true, list: true }), f.sel('topic', 'Topic', ['Academic stress', 'Friendship', 'Family', 'Career guidance', 'Behaviour', 'Other'], { required: true, list: true }), f.staff('counsellor', 'Counsellor', { required: true, list: true }), f.long('notes', 'Private notes'), f.bool('followUp', 'Needs a follow-up'), f.date('followUpDate', 'Follow-up on', { showWhen: { key: 'followUp', equals: 'true' } })],
  statuses: [st('scheduled', 'Scheduled', 'info'), st('held', 'Held', 'success'), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'scheduled',
  transitions: flow(['scheduled', 'held'], { scheduled: ['cancelled'] }),
  dueField: 'followUpDate',
  seeds: [seed(SUN, { student: 'Ananya Rao', grade: 'class_10', date: '2026-11-25', topic: 'career_guidance', counsellor: sunStaff(3) }, 'scheduled'), seed(SUN, { student: 'Rahul Verma', grade: 'class_8', date: '2026-11-14', topic: 'behaviour', counsellor: sunStaff(3), followUp: true, followUpDate: '2026-12-05', notes: 'Settling in after a change of seat.' }, 'held')],
};

const safeguarding: CollectionDef = {
  key: 'safeguarding',
  screenId: 'SP-S-09',
  module: 'wellbeing',
  title: 'Safeguarding cases',
  singular: 'Case',
  description: 'Concerns about the safety of a child. Strictly limited access. Every view and change is recorded.',
  sensitive: 'Safeguarding cases are confidential. Give this feature only to the designated safeguarding lead and the principal.',
  titleField: 'reference',
  fields: [f.text('reference', 'Case reference', { required: true, unique: true, list: true }), f.text('student', 'Student', { required: true, list: true }), f.date('raised', 'Raised on', { required: true, list: true }), f.sel('category', 'Concern', ['Physical', 'Emotional', 'Neglect', 'Online safety', 'Bullying', 'Other'], { required: true, list: true }), f.sel('risk', 'Risk', ['Low', 'Medium', 'High'], { required: true, list: true }), f.long('summary', 'Summary', { required: true }), f.staff('lead', 'Safeguarding lead', { required: true }), f.date('nextReview', 'Next review', { required: true }), f.bool('referred', 'Referred to an outside agency')],
  statuses: [st('open', 'Open', 'danger'), st('investigating', 'Under review', 'warning'), st('resolved', 'Resolved', 'success', { needs: 'approve', reason: true }), st('closed', 'Closed', 'neutral', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'open',
  transitions: flow(['open', 'investigating', 'resolved', 'closed']),
  dueField: 'nextReview',
  actions: ['approve'],
  rules: (data, ctx) => {
    if (String(data.raised) > ctx.today) return 'The date cannot be in the future.';
    if (data.risk === 'high' && !data.referred && data.__status === 'resolved') return 'A high-risk case must be referred to an outside agency before it is resolved.';
    return null;
  },
  seeds: [seed(SUN, { reference: 'SG-2026-001', student: 'Student A', raised: '2026-11-03', category: 'bullying', risk: 'medium', summary: 'Repeated teasing reported by a classmate.', lead: sunStaff(1), nextReview: '2026-12-01', referred: false }, 'investigating')],
};

const health: CollectionDef = {
  key: 'health',
  screenId: 'SP-S-14',
  module: 'wellbeing',
  title: 'Student health',
  singular: 'Health record',
  description: 'Clinic visits, allergies and medicines. Visible to the nurse and the principal.',
  sensitive: 'Health information is sensitive personal data.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), grade, f.date('date', 'Date', { required: true, list: true }), f.sel('kind', 'Kind', ['Clinic visit', 'Allergy', 'Long-term condition', 'Vaccination', 'Injury'], { required: true, list: true }), f.long('details', 'Details', { required: true }), f.text('medicine', 'Medicine given'), f.bool('parentsCalled', 'Parent called'), f.date('followUp', 'Follow up on')],
  dueField: 'followUp',
  rules: (data, ctx) => (String(data.date) > ctx.today ? 'The date cannot be in the future.' : null),
  seeds: [seed(SUN, { student: 'Aarav Sharma', grade: 'class_5', date: '2026-11-17', kind: 'clinic_visit', details: 'Headache after games.', medicine: 'Paracetamol 250 mg', parentsCalled: true })],
};

const inclusion: CollectionDef = {
  key: 'inclusion',
  screenId: 'SP-S-10',
  module: 'wellbeing',
  title: 'Inclusion and individual education plans',
  singular: 'Plan',
  description: 'Support plans for students with additional needs, reviewed on a date.',
  sensitive: 'Plans describe a student\'s learning needs. Share only with those who teach the student.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), grade, f.sel('need', 'Area of need', ['Dyslexia', 'ADHD', 'Autism spectrum', 'Hearing', 'Vision', 'Physical', 'Gifted', 'Other'], { required: true, list: true }), f.long('adjustments', 'Adjustments in class', { required: true }), f.long('goals', 'Goals for this term', { required: true }), f.staff('coordinator', 'Coordinator', { required: true, list: true }), f.date('start', 'Starts', { required: true }), f.date('review', 'Review on', { required: true, list: true })],
  statuses: [st('draft', 'Draft', 'neutral'), st('active', 'Active', 'success', { needs: 'approve' }), st('reviewed', 'Reviewed', 'info'), st('ended', 'Ended', 'neutral', { final: true, reason: true })],
  initialStatus: 'draft',
  transitions: flow(['draft', 'active', 'reviewed'], { active: ['ended'], reviewed: ['active', 'ended'] }),
  dueField: 'review',
  actions: ['approve'],
  rules: (data) => (String(data.review) <= String(data.start) ? 'The review date must be after the start date.' : null),
  seeds: [seed(SUN, { student: 'Diya Patel', grade: 'class_3', need: 'dyslexia', adjustments: 'Extra time. Printed notes in a large font.', goals: 'Read a short paragraph without help.', coordinator: sunStaff(3), start: '2026-09-01', review: '2026-12-20' }, 'active')],
};

// ---------- school operations
const substitutions: CollectionDef = {
  key: 'substitutions',
  screenId: 'SP-S-03',
  module: 'schoolops',
  title: 'Substitute teachers',
  singular: 'Substitution',
  description: 'Cover for an absent teacher: which periods, who covers, and whether it was done.',
  titleField: 'absent',
  fields: [f.staff('absent', 'Absent teacher', { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.text('periods', 'Periods', { required: true, hint: 'For example 3 and 4', list: true }), f.text('group', 'Class', { required: true, list: true }), f.staff('cover', 'Covered by', { required: true, list: true }), f.text('plan', 'Lesson plan or work set')],
  statuses: [st('requested', 'Requested', 'warning'), st('confirmed', 'Confirmed', 'info'), st('done', 'Done', 'success', { final: true }), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'requested',
  transitions: flow(['requested', 'confirmed', 'done'], { requested: ['cancelled'], confirmed: ['cancelled'] }),
  rules: (data, ctx) => {
    if (data.absent === data.cover) return 'The cover teacher must be someone else.';
    const clash = ctx.others.find((row) => row.data.cover === data.cover && row.data.date === data.date && row.data.periods === data.periods && row.status !== 'cancelled');
    return clash ? 'The cover teacher already covers those periods on that day.' : null;
  },
  seeds: [seed(SUN, { absent: sunStaff(3), date: '2026-11-24', periods: '3 and 4', group: 'Class 1-A', cover: sunStaff(6), plan: 'Reading comprehension worksheet.' }, 'confirmed')],
};

const meetings: CollectionDef = {
  key: 'meetings',
  screenId: 'SP-S-05',
  module: 'schoolops',
  title: 'Parent meetings',
  singular: 'Meeting',
  description: 'Schedule meetings with parents and record what was agreed.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.text('parent', 'Parent or guardian', { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.text('time', 'Time', { required: true, hint: 'For example 10:30' }), f.staff('teacher', 'Teacher', { required: true, list: true }), f.sel('purpose', 'Purpose', ['Progress', 'Behaviour', 'Attendance', 'Fees', 'Other'], { required: true }), f.long('outcome', 'What was agreed')],
  statuses: [st('scheduled', 'Scheduled', 'info'), st('held', 'Held', 'success'), st('missed', 'Parent did not come', 'warning'), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'scheduled',
  transitions: { scheduled: ['held', 'missed', 'cancelled'], missed: ['scheduled'], held: [] },
  dueField: 'date',
  rules: (data, ctx) => {
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(String(data.time))) return 'Write the time as 10:30.';
    const clash = ctx.others.find((row) => row.data.teacher === data.teacher && row.data.date === data.date && row.data.time === data.time && row.status !== 'cancelled');
    if (clash) return 'The teacher already has a meeting at that time.';
    if (data.__status === 'held' && !data.outcome) return 'Write what was agreed before marking it held.';
    return null;
  },
  seeds: [seed(SUN, { student: 'Aarav Sharma', parent: 'Rakesh Sharma', date: '2026-11-27', time: '10:30', teacher: sunStaff(3), purpose: 'progress' }, 'scheduled')],
};

const pickup: CollectionDef = {
  key: 'pickup',
  screenId: 'SP-S-06',
  module: 'schoolops',
  title: 'Pickup authorization',
  singular: 'Authorization',
  description: 'Who may collect a child. The gate checks this list. Revoke at once if a parent asks.',
  titleField: 'person',
  fields: [f.text('student', 'Student', { required: true, list: true }), grade, f.text('person', 'Authorized person', { required: true, list: true }), f.sel('relation', 'Relation', ['Mother', 'Father', 'Grandparent', 'Uncle or aunt', 'Driver', 'Other'], { required: true, list: true }), f.phone('phone', 'Phone', { required: true }), f.date('until', 'Valid until', { required: true, list: true }), f.text('idProof', 'ID checked at the gate')],
  statuses: [st('active', 'Authorized', 'success'), st('revoked', 'Revoked', 'danger', { final: true, reason: true })],
  initialStatus: 'active',
  transitions: { active: ['revoked'] },
  dueField: 'until',
  rules: (data, ctx) => (ctx.isNew && String(data.until) < ctx.today ? 'The date it is valid until cannot be in the past.' : null),
  seeds: [seed(SUN, { student: 'Aarav Sharma', grade: 'class_5', person: 'Rakesh Sharma', relation: 'father', phone: '+91 98765 11111', until: '2027-03-31' }, 'active'), seed(SUN, { student: 'Aarav Sharma', grade: 'class_5', person: 'Savita Sharma', relation: 'mother', phone: '+91 98765 22222', until: '2027-03-31' }, 'active')],
};

const rollcall: CollectionDef = {
  key: 'rollcall',
  screenId: 'SP-S-07',
  module: 'schoolops',
  title: 'Emergency roll call',
  singular: 'Drill or event',
  description: 'Roll call during a drill or real emergency: how many were counted, how many are missing.',
  titleField: 'title',
  fields: [f.text('title', 'Title', { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.sel('kind', 'Kind', ['Fire drill', 'Earthquake drill', 'Evacuation', 'Lockdown', 'Real emergency'], { required: true, list: true }), f.num('enrolled', 'Students present today', { required: true, min: 0 }), f.num('counted', 'Counted at the assembly point', { required: true, min: 0 }), f.num('minutes', 'Minutes to clear the building', { min: 0, list: true }), f.long('notes', 'Observations'), f.num('missing', 'Missing', { computed: true, list: true })],
  statuses: [st('planned', 'Planned', 'info'), st('done', 'Completed', 'success', { final: true }), st('open', 'Roll call open', 'danger')],
  initialStatus: 'planned',
  transitions: { planned: ['open', 'done'], open: ['done'] },
  rules: (data) => (Number(data.counted) > Number(data.enrolled) ? 'More students were counted than are present.' : null),
  derive: (data) => ({ missing: Number(data.enrolled) - Number(data.counted) }),
  seeds: [seed(SUN, { title: 'Termly fire drill', date: '2026-10-08', kind: 'fire_drill', enrolled: 1180, counted: 1180, minutes: 6 }, 'done')],
};

const boarding: CollectionDef = {
  key: 'boarding',
  screenId: 'SP-S-08',
  module: 'schoolops',
  title: 'Boarding night attendance',
  singular: 'Night register',
  description: 'Who is in the boarding house each night.',
  titleField: 'house',
  fields: [f.date('date', 'Night of', { required: true, list: true }), f.text('house', 'Boarding house', { required: true, list: true }), f.num('residents', 'Residents', { required: true, min: 0, list: true }), f.num('present', 'Present', { required: true, min: 0, list: true }), f.text('absent', 'Absent and why'), f.staff('warden', 'Warden on duty', { required: true, list: true })],
  statuses: [st('open', 'Open', 'warning'), st('signed', 'Signed by warden', 'success', { final: true })],
  initialStatus: 'open',
  transitions: { open: ['signed'] },
  uniqueTogether: [{ keys: ['date', 'house'], message: 'This house already has a register for that night.' }],
  rules: (data, ctx) => (Number(data.present) > Number(data.residents) ? 'More present than residents.' : String(data.date) > ctx.today ? 'The date cannot be in the future.' : null),
  seeds: [seed(SUN, { date: '2026-11-19', house: 'Tagore House', residents: 48, present: 47, absent: 'One at home with permission.', warden: sunStaff(2) }, 'signed')],
};

// ---------- academics (replaces the old academics and homework screens)
const structure: CollectionDef = {
  key: 'structure',
  screenId: 'SC-03',
  module: 'academics',
  title: 'Classes and sections',
  singular: 'Section',
  description: 'The classes and sections of the school, their capacity and class teacher.',
  titleField: 'name',
  fields: [f.text('name', 'Section', { required: true, unique: true, list: true, hint: 'For example Class 5-A' }), f.sel('grade', 'Class', GRADES, { required: true, list: true }), f.num('capacity', 'Capacity', { required: true, min: 1, max: 80, list: true }), f.num('enrolled', 'Enrolled now', { min: 0, list: true }), f.staff('classTeacher', 'Class teacher', { list: true }), f.text('room', 'Room')],
  rules: (data) => (data.enrolled !== undefined && Number(data.enrolled) > Number(data.capacity) ? 'More are enrolled than the capacity.' : null),
  seeds: [seed(SUN, { name: 'Class 1-A', grade: 'class_1', capacity: 30, enrolled: 28, classTeacher: sunStaff(3), room: '101' }), seed(SUN, { name: 'Class 1-B', grade: 'class_1', capacity: 30, enrolled: 29, room: '102' }), seed(SUN, { name: 'Class 5-A', grade: 'class_5', capacity: 35, enrolled: 34, room: '205' })],
};

const homework: CollectionDef = {
  key: 'homework',
  screenId: 'SC-04',
  module: 'academics',
  title: 'Homework',
  singular: 'Homework',
  description: 'Homework set by teachers, with due dates.',
  dependsOn: ['academics.structure'],
  titleField: 'title',
  fields: [f.text('title', 'Title', { required: true, list: true }), f.text('group', 'Class', { required: true, list: true }), f.text('subject', 'Subject', { required: true, list: true }), f.staff('teacher', 'Set by', { required: true, list: true }), f.date('assigned', 'Set on', { required: true }), f.date('due', 'Due on', { required: true, list: true }), f.long('instructions', 'Instructions')],
  statuses: [st('assigned', 'Assigned', 'info'), st('collected', 'Collected', 'warning'), st('marked', 'Marked', 'success', { final: true })],
  initialStatus: 'assigned',
  transitions: flow(['assigned', 'collected', 'marked']),
  dueField: 'due',
  rules: (data) => (String(data.due) < String(data.assigned) ? 'The due date cannot be before the day it is set.' : null),
  seeds: [seed(SUN, { title: 'Fractions worksheet', group: 'Class 5-A', subject: 'Mathematics', teacher: sunStaff(3), assigned: '2026-11-18', due: '2026-11-23' }, 'assigned'), seed(SUN, { title: 'Reading log', group: 'Class 1-A', subject: 'English', teacher: sunStaff(3), assigned: '2026-11-10', due: '2026-11-17' }, 'collected')],
};

const attendance: CollectionDef = {
  key: 'students',
  screenId: 'SC-05',
  module: 'attendance',
  title: 'Class attendance',
  singular: 'Register',
  description: 'One register per class and day: how many were present, absent or late.',
  dependsOn: ['students.directory'],
  titleField: 'group',
  fields: [f.text('group', 'Class', { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.num('enrolled', 'On roll', { required: true, min: 1, list: true }), f.num('present', 'Present', { required: true, min: 0, list: true }), f.num('late', 'Late', { min: 0 }), f.staff('markedBy', 'Marked by', { required: true }), f.num('percent', 'Attendance %', { computed: true, list: true }), f.text('absentees', 'Absent students')],
  statuses: [st('draft', 'Draft', 'warning'), st('submitted', 'Submitted', 'success', { final: true })],
  initialStatus: 'draft',
  transitions: { draft: ['submitted'] },
  uniqueTogether: [{ keys: ['group', 'date'], message: 'This class already has a register for that day.' }],
  rules: (data, ctx) => {
    if (Number(data.present) > Number(data.enrolled)) return 'More are present than on the roll.';
    if (Number(data.late ?? 0) > Number(data.present)) return 'More are late than present.';
    return String(data.date) > ctx.today ? 'The date cannot be in the future.' : null;
  },
  derive: (data) => ({ percent: Math.round((Number(data.present) / Number(data.enrolled)) * 1000) / 10 }),
  actions: ['create'],
  seeds: [seed(SUN, { group: 'Class 1-A', date: '2026-11-19', enrolled: 28, present: 26, late: 1, markedBy: sunStaff(3) }, 'submitted'), seed(SUN, { group: 'Class 5-A', date: '2026-11-19', enrolled: 34, present: 33, markedBy: sunStaff(3) }, 'submitted')],
};

const timetable: CollectionDef = {
  key: 'classes',
  screenId: 'SC-06',
  module: 'timetable',
  title: 'Class timetable',
  singular: 'Period',
  description: 'The weekly periods of each class. A teacher cannot be in two classes at once.',
  dependsOn: ['academics.structure'],
  titleField: 'subject',
  fields: [f.text('group', 'Class', { required: true, list: true }), f.sel('day', 'Day', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], { required: true, list: true }), f.num('period', 'Period', { required: true, min: 1, max: 10, list: true }), f.text('subject', 'Subject', { required: true, list: true }), f.staff('teacher', 'Teacher', { required: true, list: true }), f.text('room', 'Room')],
  uniqueTogether: [{ keys: ['group', 'day', 'period'], message: 'This class already has a lesson in that period.' }, { keys: ['teacher', 'day', 'period'], message: 'This teacher already teaches another class in that period.' }],
  seeds: [seed(SUN, { group: 'Class 5-A', day: 'monday', period: 1, subject: 'Mathematics', teacher: sunStaff(3), room: '205' }), seed(SUN, { group: 'Class 5-A', day: 'monday', period: 2, subject: 'English', teacher: sunStaff(3), room: '205' })],
};

const exams: CollectionDef = {
  key: 'exams',
  screenId: 'SC-07',
  module: 'examinations',
  title: 'Examinations',
  singular: 'Exam',
  description: 'Plan exams, hold them, and publish results. Results cannot be published before the exam is held.',
  dependsOn: ['academics.structure'],
  titleField: 'name',
  fields: [f.text('name', 'Exam', { required: true, list: true }), f.text('group', 'Class', { required: true, list: true }), f.text('subject', 'Subject', { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.num('maxMarks', 'Maximum marks', { required: true, min: 1, max: 1000 }), f.num('passMarks', 'Pass marks', { required: true, min: 0 }), f.staff('invigilator', 'Invigilator')],
  statuses: [st('planned', 'Planned', 'neutral'), st('scheduled', 'Scheduled', 'info'), st('held', 'Held', 'warning'), st('published', 'Results published', 'success', { final: true, needs: 'publish' })],
  initialStatus: 'planned',
  transitions: flow(['planned', 'scheduled', 'held', 'published']),
  dueField: 'date',
  actions: ['publish'],
  rules: (data, ctx) => {
    if (Number(data.passMarks) > Number(data.maxMarks)) return 'Pass marks cannot be more than the maximum.';
    if (data.__status === 'held' && String(data.date) > ctx.today) return 'The exam date has not come yet.';
    return null;
  },
  seeds: [seed(SUN, { name: 'Term 2 unit test', group: 'Class 5-A', subject: 'Mathematics', date: '2026-12-03', maxMarks: 50, passMarks: 18, invigilator: sunStaff(3) }, 'scheduled'), seed(SUN, { name: 'Term 1 final', group: 'Class 5-A', subject: 'English', date: '2026-09-20', maxMarks: 100, passMarks: 35 }, 'published')],
};

const notices: CollectionDef = {
  key: 'notices',
  screenId: 'SC-08',
  module: 'communication',
  title: 'Notices',
  singular: 'Notice',
  description: 'Announcements to parents, students or staff. Publishing needs a separate permission.',
  titleField: 'title',
  fields: [f.text('title', 'Title', { required: true, list: true }), f.sel('audience', 'For', ['Parents', 'Students', 'Staff', 'Everyone'], { required: true, list: true }), f.long('body', 'Message', { required: true }), f.date('publishOn', 'Publish on', { list: true }), f.date('expires', 'Show until')],
  statuses: [st('draft', 'Draft', 'neutral'), st('published', 'Published', 'success', { needs: 'publish' }), st('archived', 'Withdrawn', 'neutral', { final: true, reason: true })],
  initialStatus: 'draft',
  transitions: { draft: ['published'], published: ['archived'] },
  actions: ['publish'],
  rules: (data) => (data.expires && data.publishOn && String(data.expires) < String(data.publishOn) ? 'The notice cannot expire before it is published.' : null),
  seeds: [seed(SUN, { title: 'Parent teacher meeting on 27 November', audience: 'parents', body: 'Meetings run from 9:00 to 13:00. Please book a slot with the class teacher.', publishOn: '2026-11-20' }, 'published'), seed(SUN, { title: 'Winter uniform from 1 December', audience: 'everyone', body: 'Winter uniform is mandatory from 1 December.' }, 'draft')],
};

const catalog: CollectionDef = {
  key: 'catalog',
  screenId: 'SC-09',
  module: 'library',
  title: 'Library catalog',
  singular: 'Book',
  description: 'Titles and copies. A copy is available when none are on loan.',
  titleField: 'title',
  fields: [f.text('title', 'Title', { required: true, list: true }), f.text('author', 'Author', { required: true, list: true }), f.text('isbn', 'ISBN', { unique: true }), f.sel('category', 'Category', ['Fiction', 'Science', 'History', 'Reference', 'Language', 'Biography', 'Other'], { required: true, list: true }), f.num('copies', 'Copies', { required: true, min: 1, max: 500, list: true }), f.text('shelf', 'Shelf')],
  seeds: [seed(SUN, { title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', isbn: '9788173711466', category: 'biography', copies: 4, shelf: 'B2' }), seed(SUN, { title: 'The Jungle Book', author: 'Rudyard Kipling', isbn: '9780141325293', category: 'fiction', copies: 3, shelf: 'F1' }), seed(SUN, { title: 'Oxford Atlas', author: 'Oxford', category: 'reference', copies: 1, shelf: 'R1' })],
};

const issues: CollectionDef = {
  key: 'issues',
  screenId: 'SC-10',
  module: 'library',
  title: 'Issue and return',
  singular: 'Loan',
  description: 'Books on loan. A fine is worked out for late returns.',
  dependsOn: ['library.catalog'],
  titleField: 'book',
  fields: [f.text('book', 'Book', { required: true, list: true }), f.text('borrower', 'Borrower', { required: true, list: true }), f.date('issued', 'Issued on', { required: true, list: true }), f.date('due', 'Due on', { required: true, list: true }), f.num('fine', 'Fine', { computed: true, money: true, list: true })],
  statuses: [st('issued', 'On loan', 'info'), st('returned', 'Returned', 'success', { final: true })],
  initialStatus: 'issued',
  transitions: { issued: ['returned'] },
  dueField: 'due',
  rules: (data, ctx) => {
    if (String(data.due) < String(data.issued)) return 'The due date cannot be before the issue date.';
    const open = ctx.others.filter((row) => row.data.borrower === data.borrower && row.status === 'issued').length;
    return ctx.isNew && open >= 3 ? 'A borrower can have at most 3 books on loan.' : null;
  },
  derive: (data, ctx) => ({ fine: ctx.status !== 'returned' && String(data.due) < ctx.today ? Math.min(100, Math.round((Date.parse(ctx.today) - Date.parse(String(data.due))) / 86_400_000) * 2) : 0 }),
  seeds: [seed(SUN, { book: 'Wings of Fire', borrower: 'Ananya Rao, Class 10', issued: '2026-11-05', due: '2026-11-19' }, 'issued'), seed(SUN, { book: 'The Jungle Book', borrower: 'Aarav Sharma, Class 5', issued: '2026-11-10', due: '2026-11-24' }, 'issued')],
};

const fleet: CollectionDef = {
  key: 'fleet',
  screenId: 'SC-11',
  module: 'transport',
  title: 'Vehicles',
  singular: 'Vehicle',
  description: 'School buses and vans, with fitness and insurance dates.',
  titleField: 'registration',
  fields: [f.text('registration', 'Registration number', { required: true, unique: true, list: true }), f.sel('kind', 'Kind', ['Bus', 'Mini bus', 'Van'], { required: true, list: true }), f.num('seats', 'Seats', { required: true, min: 4, max: 80, list: true }), f.text('driver', 'Driver', { required: true, list: true }), f.phone('driverPhone', 'Driver phone'), f.date('fitness', 'Fitness certificate valid until', { required: true, list: true }), f.date('insurance', 'Insurance valid until', { required: true })],
  statuses: [st('active', 'In service', 'success'), st('maintenance', 'In maintenance', 'warning'), st('retired', 'Retired', 'neutral', { final: true, reason: true })],
  initialStatus: 'active',
  transitions: { active: ['maintenance', 'retired'], maintenance: ['active', 'retired'] },
  dueField: 'fitness',
  rules: (data, ctx) => (ctx.isNew && (String(data.fitness) < ctx.today || String(data.insurance) < ctx.today) ? 'A vehicle cannot be added with an expired certificate or insurance.' : null),
  seeds: [seed(SUN, { registration: 'MH 02 AB 1234', kind: 'bus', seats: 52, driver: 'Ramesh Yadav', fitness: '2027-02-28', insurance: '2027-04-10' }, 'active'), seed(SUN, { registration: 'MH 02 CD 5678', kind: 'van', seats: 12, driver: 'Salim Shaikh', fitness: '2026-12-15', insurance: '2027-01-20' }, 'maintenance')],
};

const routes: CollectionDef = {
  key: 'routes',
  screenId: 'SC-12',
  module: 'transport',
  title: 'Routes and stops',
  singular: 'Route',
  description: 'Routes, their stops and the vehicle that runs them.',
  dependsOn: ['transport.fleet'],
  titleField: 'name',
  fields: [f.text('name', 'Route', { required: true, unique: true, list: true }), f.text('vehicle', 'Vehicle registration', { required: true, list: true }), f.long('stops', 'Stops in order', { required: true, hint: 'One stop per line.' }), f.text('pickup', 'Morning pick-up from', { list: true }), f.num('students', 'Students on the route', { min: 0, list: true })],
  rules: (data, ctx) => {
    const vehicle = ctx.related.fleet?.find((row) => row.data.registration === data.vehicle);
    if (!vehicle) return 'Choose a vehicle that is in the vehicle list.';
    if (vehicle.status !== 'active') return 'This vehicle is not in service.';
    return Number(data.students ?? 0) > Number(vehicle.data.seats) ? `The vehicle has only ${vehicle.data.seats} seats.` : null;
  },
  seeds: [seed(SUN, { name: 'Route A, Andheri', vehicle: 'MH 02 AB 1234', stops: 'Andheri station\nJuhu circle\nSchool gate', pickup: '06:45', students: 44 })],
};

const stock: CollectionDef = {
  key: 'stock',
  screenId: 'SC-13',
  module: 'inventory',
  title: 'Stock items',
  singular: 'Item',
  description: 'Items, quantities and the level at which to reorder.',
  titleField: 'name',
  fields: [f.text('name', 'Item', { required: true, unique: true, list: true }), f.sel('category', 'Category', ['Stationery', 'Lab', 'Sports', 'Furniture', 'Cleaning', 'IT', 'Other'], { required: true, list: true }), f.num('quantity', 'In stock', { required: true, min: 0, list: true }), f.num('reorder', 'Reorder at', { required: true, min: 0, list: true }), f.text('unit', 'Unit', { default: 'pcs' }), f.money('unitCost', 'Cost per unit'), f.text('location', 'Stored in')],
  seeds: [seed(SUN, { name: 'A4 paper ream', category: 'stationery', quantity: 18, reorder: 20, unit: 'ream', unitCost: 320, location: 'Store 1' }), seed(SUN, { name: 'Football', category: 'sports', quantity: 12, reorder: 4, unit: 'pcs', unitCost: 650, location: 'Sports room' })],
};

const movements: CollectionDef = {
  key: 'movements',
  screenId: 'SC-14',
  module: 'inventory',
  title: 'Stock movements',
  singular: 'Movement',
  description: 'Items received or issued. Stock cannot go below zero.',
  dependsOn: ['inventory.stock'],
  titleField: 'item',
  fields: [f.text('item', 'Item', { required: true, list: true }), f.sel('direction', 'Direction', ['Received', 'Issued'], { required: true, list: true }), f.num('quantity', 'Quantity', { required: true, min: 1, list: true }), f.date('date', 'Date', { required: true, list: true }), f.text('by', 'Handled by', { required: true }), f.text('note', 'Note')],
  rules: (data, ctx) => {
    const item = ctx.related.stock?.find((row) => row.data.name === data.item);
    if (!item) return 'Choose an item that is in the stock list.';
    if (data.direction === 'issued' && Number(data.quantity) > Number(item.data.quantity)) return `Only ${item.data.quantity} in stock.`;
    return String(data.date) > ctx.today ? 'The date cannot be in the future.' : null;
  },
  seeds: [seed(SUN, { item: 'A4 paper ream', direction: 'issued', quantity: 2, date: '2026-11-15', by: 'Office clerk', note: 'Exam cell' })],
};

export const SCHOOL_MODULES: ModuleGroup[] = [
  { key: 'admissions', label: 'Admissions', description: 'Enquiries and applications.', profiles: ['school'], scope: 'inst', nav: 'People', collections: [applications] },
  { key: 'wellbeing', label: 'Student wellbeing', description: 'Progress, behaviour, counselling, safeguarding, health and inclusion.', profiles: ['school'], scope: 'inst', nav: 'People', collections: [progress, behaviour, counselling, safeguarding, health, inclusion] },
  { key: 'academics', label: 'Academics', description: 'Classes, sections and homework.', profiles: ['school'], scope: 'inst', nav: 'Academics', collections: [structure, homework] },
  { key: 'attendance', label: 'Attendance', description: 'Class registers.', profiles: ['school'], scope: 'inst', nav: 'Academics', collections: [attendance] },
  { key: 'timetable', label: 'Timetable', description: 'Weekly periods of each class.', profiles: ['school'], scope: 'inst', nav: 'Academics', collections: [timetable] },
  { key: 'examinations', label: 'Examinations', description: 'Plan exams and publish results.', profiles: ['school'], scope: 'inst', nav: 'Academics', collections: [exams] },
  { key: 'schoolops', label: 'School operations', description: 'Substitutes, parent meetings, pickup, roll call and boarding.', profiles: ['school'], scope: 'inst', nav: 'Operations', collections: [substitutions, meetings, pickup, rollcall, boarding] },
  { key: 'communication', label: 'Communication', description: 'Notices to parents, students and staff.', profiles: ['school'], scope: 'inst', nav: 'Operations', collections: [notices] },
  { key: 'library', label: 'Library', description: 'Catalog and loans.', profiles: ['school'], scope: 'inst', nav: 'Operations', collections: [catalog, issues] },
  { key: 'transport', label: 'Transport', description: 'Vehicles and routes.', profiles: ['school'], scope: 'inst', nav: 'Operations', collections: [fleet, routes] },
  { key: 'inventory', label: 'Inventory', description: 'Stock and movements.', profiles: ['school'], scope: 'inst', nav: 'Operations', collections: [stock, movements] },
];
