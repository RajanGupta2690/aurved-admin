import type { CollectionDef, ModuleGroup } from '../../core/records/types';
import { f, flow, GRN, grnStaff, LAKE, lakeStaff, seed, st } from './helpers';

const PROGRAMMES = ['B.Sc Computer Science', 'B.Com', 'BBA', 'M.Sc Data Science', 'B.E. Computer Science', 'B.Tech Computer Science'];

// ---------- quality and compliance (every type of institution)
const inspections: CollectionDef = {
  key: 'inspections',
  screenId: 'SP-S-11',
  module: 'quality',
  title: 'Inspections and accreditation',
  singular: 'Inspection',
  description: 'Visits by boards, regulators and accreditation bodies, and what must be fixed.',
  titleField: 'body',
  fields: [f.text('body', 'Body', { required: true, list: true }), f.sel('kind', 'Kind', ['Board inspection', 'Accreditation visit', 'Safety audit', 'Fire audit', 'Statutory audit'], { required: true, list: true }), f.date('date', 'Visit date', { required: true, list: true }), f.long('findings', 'Findings'), f.num('openActions', 'Actions still open', { min: 0, list: true }), f.date('actionsDue', 'Actions due by')],
  statuses: [st('planned', 'Planned', 'info'), st('done', 'Visit done', 'warning'), st('actions', 'Actions open', 'danger'), st('closed', 'Closed', 'success', { final: true, needs: 'approve' })],
  initialStatus: 'planned',
  transitions: flow(['planned', 'done', 'actions', 'closed'], { done: ['closed'] }),
  dueField: 'actionsDue',
  actions: ['approve'],
  rules: (data) => (data.__status === 'closed' && Number(data.openActions ?? 0) > 0 ? 'Close all actions before closing the inspection.' : data.__status === 'actions' && !data.findings ? 'Write the findings first.' : null),
  seeds: [seed('inst-sunrise', { body: 'CBSE affiliation team', kind: 'board_inspection', date: '2027-01-20' }, 'planned'), seed('inst-sunrise', { body: 'Fire department', kind: 'fire_audit', date: '2026-10-12', findings: 'Two extinguishers expired.', openActions: 2, actionsDue: '2026-11-30' }, 'actions'), seed(GRN, { body: 'NAAC peer team', kind: 'accreditation_visit', date: '2027-02-10' }, 'planned')],
};

const improvement: CollectionDef = {
  key: 'improvement',
  screenId: 'SP-S-12',
  module: 'quality',
  title: 'Improvement plan',
  singular: 'Goal',
  description: 'Goals for the year with an owner, a measure and a date.',
  titleField: 'goal',
  fields: [f.text('goal', 'Goal', { required: true, list: true }), f.sel('area', 'Area', ['Teaching and learning', 'Results', 'Safety', 'Infrastructure', 'Community', 'Governance'], { required: true, list: true }), f.text('measure', 'How it is measured', { required: true }), f.num('target', 'Target', { required: true, list: true }), f.num('actual', 'Where we are', { min: 0, list: true }), f.staff('owner', 'Owner', { required: true, list: true }), f.date('due', 'Due', { required: true, list: true })],
  statuses: [st('planned', 'Planned', 'neutral'), st('onTrack', 'On track', 'success'), st('atRisk', 'At risk', 'warning', { reason: true }), st('done', 'Done', 'success', { final: true }), st('dropped', 'Dropped', 'neutral', { final: true, reason: true })],
  initialStatus: 'planned',
  transitions: { planned: ['onTrack', 'dropped'], onTrack: ['atRisk', 'done', 'dropped'], atRisk: ['onTrack', 'dropped'] },
  dueField: 'due',
  rules: (data) => (data.__status === 'done' && Number(data.actual ?? 0) < Number(data.target) ? 'The goal is not met yet. Where we are is below the target.' : null),
  seeds: [seed('inst-sunrise', { goal: 'Raise Class 10 mathematics pass rate', area: 'results', measure: 'Pass rate in percent', target: 95, actual: 88, owner: 'staff-inst-sunrise-3', due: '2027-03-31' }, 'onTrack')],
};

const regulatory: CollectionDef = {
  key: 'regulatory',
  screenId: 'SP-S-13',
  module: 'quality',
  title: 'Regulatory reporting',
  singular: 'Report',
  description: 'Reports due to boards, universities and the government. The due date is tracked.',
  titleField: 'report',
  fields: [f.text('report', 'Report', { required: true, list: true }), f.text('authority', 'Submitted to', { required: true, list: true }), f.sel('frequency', 'How often', ['Once', 'Monthly', 'Quarterly', 'Yearly'], { required: true }), f.date('due', 'Due on', { required: true, list: true }), f.staff('owner', 'Prepared by', { required: true, list: true }), f.text('reference', 'Acknowledgement number', { showWhen: { key: 'filed', equals: 'true' } }), f.bool('filed', 'Filed')],
  statuses: [st('preparing', 'Preparing', 'warning'), st('review', 'In review', 'info'), st('filed', 'Filed', 'success', { final: true, needs: 'approve' })],
  initialStatus: 'preparing',
  transitions: flow(['preparing', 'review', 'filed']),
  dueField: 'due',
  actions: ['approve'],
  rules: (data) => (data.__status === 'filed' && !data.reference ? 'Add the acknowledgement number before marking it filed.' : null),
  seeds: [seed('inst-sunrise', { report: 'UDISE+ data capture', authority: 'Ministry of Education', frequency: 'yearly', due: '2026-12-15', owner: 'staff-inst-sunrise-2' }, 'preparing'), seed(GRN, { report: 'AISHE annual return', authority: 'Ministry of Education', frequency: 'yearly', due: '2026-12-30', owner: grnStaff(2) }, 'review')],
};

const evidence: CollectionDef = {
  key: 'evidence',
  screenId: 'SP-C-13',
  module: 'quality',
  title: 'Accreditation evidence',
  singular: 'Evidence',
  description: 'Documents and data collected against each accreditation criterion.',
  titleField: 'title',
  fields: [f.text('title', 'Evidence', { required: true, list: true }), f.sel('criterion', 'Criterion', ['Curricular aspects', 'Teaching and evaluation', 'Research', 'Infrastructure', 'Student support', 'Governance', 'Best practices'], { required: true, list: true }), f.text('source', 'Where it is kept', { required: true }), f.staff('owner', 'Collected by', { required: true, list: true }), f.date('collected', 'Collected on', { required: true, list: true }), f.bool('verified', 'Verified')],
  seeds: [seed(GRN, { title: 'Faculty with doctorates, list and certificates', criterion: 'teaching_and_evaluation', source: 'Registrar cabinet 3', owner: grnStaff(2), collected: '2026-10-01', verified: true })],
};

// ---------- programmes (college, university, institute)
const catalogC: CollectionDef = {
  key: 'courses',
  screenId: 'SP-C-01',
  module: 'programmes',
  title: 'Course catalog',
  singular: 'Course',
  description: 'Courses that can be offered, with credits and the courses that must come first.',
  titleField: 'code',
  fields: [f.text('code', 'Code', { required: true, unique: true, list: true }), f.text('name', 'Course', { required: true, list: true }), f.sel('programme', 'Programme', PROGRAMMES, { required: true, list: true }), f.num('credits', 'Credits', { required: true, min: 1, max: 12, list: true }), f.sel('semester', 'Semester', ['1', '2', '3', '4', '5', '6', '7', '8'], { required: true, list: true }), f.sel('kind', 'Kind', ['Core', 'Elective', 'Lab', 'Project'], { required: true, list: true }), f.text('prerequisite', 'Prerequisite code')],
  rules: (data, ctx) => {
    if (data.prerequisite) {
      const pre = ctx.others.find((row) => row.data.code === data.prerequisite);
      if (!pre) return `The prerequisite ${data.prerequisite} is not in the catalog.`;
      if (Number(pre.data.semester) >= Number(data.semester)) return 'A prerequisite must be taught in an earlier semester.';
    }
    return data.prerequisite === data.code ? 'A course cannot need itself.' : null;
  },
  seeds: [seed(GRN, { code: 'CS101', name: 'Programming fundamentals', programme: 'b_sc_computer_science', credits: 4, semester: '1', kind: 'core' }), seed(GRN, { code: 'CS201', name: 'Data structures', programme: 'b_sc_computer_science', credits: 4, semester: '3', kind: 'core', prerequisite: 'CS101' }), seed(GRN, { code: 'MA101', name: 'Discrete mathematics', programme: 'b_sc_computer_science', credits: 3, semester: '1', kind: 'core' })],
};

const requirements: CollectionDef = {
  key: 'requirements',
  screenId: 'SP-C-02',
  module: 'programmes',
  title: 'Programme requirements',
  singular: 'Requirement',
  description: 'What a student must complete to earn a programme. Checked in the degree audit.',
  titleField: 'programme',
  fields: [f.sel('programme', 'Programme', PROGRAMMES, { required: true, list: true }), f.sel('group', 'Requirement group', ['Core', 'Elective', 'Lab', 'Project', 'Community service'], { required: true, list: true }), f.num('minCredits', 'Minimum credits', { required: true, min: 1, list: true }), f.num('minCourses', 'Minimum courses', { min: 0, list: true }), f.text('note', 'Note')],
  uniqueTogether: [{ keys: ['programme', 'group'], message: 'This programme already has that requirement group.' }],
  seeds: [seed(GRN, { programme: 'b_sc_computer_science', group: 'core', minCredits: 90, minCourses: 22 }), seed(GRN, { programme: 'b_sc_computer_science', group: 'elective', minCredits: 18, minCourses: 5 })],
};

const creditTransfers: CollectionDef = {
  key: 'credittransfers',
  screenId: 'SP-C-03',
  module: 'programmes',
  title: 'Credit transfer evaluation',
  singular: 'Evaluation',
  description: 'Credits from another institution, and how many are accepted.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.text('from', 'Credits earned at', { required: true, list: true }), f.text('course', 'Course there', { required: true }), f.text('equivalent', 'Equivalent course here', { required: true }), f.num('creditsClaimed', 'Credits claimed', { required: true, min: 1, list: true }), f.num('creditsAccepted', 'Credits accepted', { min: 0, list: true }), f.staff('evaluator', 'Evaluator', { required: true })],
  statuses: [st('submitted', 'Submitted', 'neutral'), st('review', 'Under evaluation', 'warning'), st('accepted', 'Accepted', 'success', { final: true, needs: 'approve' }), st('declined', 'Declined', 'danger', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'submitted',
  transitions: { submitted: ['review'], review: ['accepted', 'declined'] },
  actions: ['approve'],
  rules: (data) => (Number(data.creditsAccepted ?? 0) > Number(data.creditsClaimed) ? 'Accepted credits cannot exceed the credits claimed.' : data.__status === 'accepted' && !Number(data.creditsAccepted) ? 'Enter the credits accepted first.' : null),
  seeds: [seed(GRN, { student: 'Ishaan Mehra', from: 'Pune Institute', course: 'Intro to programming', equivalent: 'CS101', creditsClaimed: 4, evaluator: grnStaff(3) }, 'review')],
};

// ---------- academic records
const standing: CollectionDef = {
  key: 'standing',
  screenId: 'SP-C-04',
  module: 'academicrecords',
  title: 'Academic standing and probation',
  singular: 'Standing',
  description: 'A student whose results put them in good standing, on warning or on probation.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.sel('programme', 'Programme', PROGRAMMES, { required: true, list: true }), f.sel('semester', 'Semester', ['1', '2', '3', '4', '5', '6', '7', '8'], { required: true }), f.num('gpa', 'Semester grade point average', { required: true, min: 0, max: 10, list: true }), f.num('cgpa', 'Cumulative grade point average', { required: true, min: 0, max: 10, list: true }), f.text('standing', 'Standing', { computed: true, list: true }), f.long('plan', 'Support plan')],
  statuses: [st('open', 'Open', 'warning'), st('cleared', 'Cleared', 'success', { final: true, needs: 'approve' })],
  initialStatus: 'open',
  transitions: { open: ['cleared'] },
  actions: ['approve'],
  derive: (data) => ({ standing: Number(data.cgpa) >= 5 ? 'Good standing' : Number(data.cgpa) >= 4 ? 'Academic warning' : 'Probation' }),
  rules: (data) => (data.__status === 'cleared' && Number(data.cgpa) < 5 ? 'The cumulative average is below 5. Standing cannot be cleared.' : null),
  seeds: [seed(GRN, { student: 'Rohan Das', programme: 'b_sc_computer_science', semester: '3', gpa: 4.2, cgpa: 4.6, plan: 'Weekly mentoring.' }, 'open')],
};

const holds: CollectionDef = {
  key: 'holds',
  screenId: 'SP-C-05',
  module: 'academicrecords',
  title: 'Registration holds',
  singular: 'Hold',
  description: 'Reasons a student cannot register for the next term, and who can lift the hold.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.sel('reason', 'Reason', ['Unpaid fees', 'Library dues', 'Missing documents', 'Disciplinary', 'Attendance shortage'], { required: true, list: true }), f.text('owner', 'Office that lifts it', { required: true, list: true }), f.date('placed', 'Placed on', { required: true, list: true }), f.money('amount', 'Amount due', { showWhen: { key: 'reason', equals: 'unpaid_fees' } })],
  statuses: [st('active', 'Active', 'danger'), st('lifted', 'Lifted', 'success', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'active',
  transitions: { active: ['lifted'] },
  actions: ['approve'],
  seeds: [seed(GRN, { student: 'Rohan Das', reason: 'unpaid_fees', owner: 'Accounts office', placed: '2026-11-10', amount: 24000 }, 'active')],
};

const audits: CollectionDef = {
  key: 'audits',
  screenId: 'SP-C-09',
  module: 'academicrecords',
  title: 'Degree completion audit',
  singular: 'Audit',
  description: 'Does a student meet every requirement for the degree? Credits are counted against the requirements.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.sel('programme', 'Programme', PROGRAMMES, { required: true, list: true }), f.num('creditsDone', 'Credits completed', { required: true, min: 0, list: true }), f.num('creditsNeeded', 'Credits needed', { required: true, min: 1, list: true }), f.long('gaps', 'What is missing'), f.num('missing', 'Credits missing', { computed: true, list: true })],
  statuses: [st('in_progress', 'In progress', 'info'), st('eligible', 'Eligible', 'success', { needs: 'approve' }), st('not_eligible', 'Not eligible', 'danger')],
  initialStatus: 'in_progress',
  transitions: { in_progress: ['eligible', 'not_eligible'], not_eligible: ['in_progress'] },
  actions: ['approve'],
  derive: (data) => ({ missing: Math.max(0, Number(data.creditsNeeded) - Number(data.creditsDone)) }),
  rules: (data) => (data.__status === 'eligible' && Number(data.creditsDone) < Number(data.creditsNeeded) ? 'The student has not completed enough credits.' : null),
  seeds: [seed(GRN, { student: 'Meera Joshi', programme: 'b_com', creditsDone: 118, creditsNeeded: 120, gaps: 'One elective.' }, 'in_progress')],
};

// ---------- faculty workload
const workload: CollectionDef = {
  key: 'workload',
  screenId: 'SP-C-06',
  module: 'facultywork',
  title: 'Faculty workload planner',
  singular: 'Workload',
  description: 'Hours per week for teaching, research and administration for each faculty member. The total cannot pass the cap.',
  titleField: 'faculty',
  fields: [f.staff('faculty', 'Faculty', { required: true, list: true }), f.sel('semester', 'Semester', ['Odd', 'Even'], { required: true, list: true }), f.num('teaching', 'Teaching hours', { required: true, min: 0, max: 40, list: true }), f.num('research', 'Research hours', { required: true, min: 0, max: 40, list: true }), f.num('admin', 'Administration hours', { required: true, min: 0, max: 40, list: true }), f.num('total', 'Total', { computed: true, list: true }), f.num('cap', 'Cap', { required: true, min: 10, max: 60, default: 40 })],
  statuses: [st('draft', 'Draft', 'warning'), st('approved', 'Approved', 'success', { needs: 'approve' })],
  initialStatus: 'draft',
  transitions: { draft: ['approved'], approved: ['draft'] },
  actions: ['approve'],
  uniqueTogether: [{ keys: ['faculty', 'semester'], message: 'This person already has a plan for that semester.' }],
  derive: (data) => ({ total: Number(data.teaching) + Number(data.research) + Number(data.admin) }),
  rules: (data) => (Number(data.teaching) + Number(data.research) + Number(data.admin) > Number(data.cap) ? `The total is above the cap of ${data.cap} hours.` : null),
  seeds: [seed(GRN, { faculty: grnStaff(3), semester: 'odd', teaching: 16, research: 12, admin: 6, cap: 40 }, 'draft'), seed(LAKE, { faculty: lakeStaff(3), semester: 'odd', teaching: 18, research: 10, admin: 8, cap: 40 }, 'approved')],
};

// ---------- examination controller
const papers: CollectionDef = {
  key: 'papers',
  screenId: 'SP-C-07',
  module: 'examcontrol',
  title: 'Examination controller workspace',
  singular: 'Paper',
  description: 'Question papers from setting to results. Moderation comes before results.',
  titleField: 'paper',
  fields: [f.text('paper', 'Paper', { required: true, list: true }), f.sel('programme', 'Programme', PROGRAMMES, { required: true, list: true }), f.date('examDate', 'Exam date', { required: true, list: true }), f.staff('setter', 'Paper setter', { required: true }), f.staff('moderator', 'Moderator', { list: true }), f.num('students', 'Students', { min: 0, list: true })],
  statuses: [st('setting', 'Being set', 'neutral'), st('moderated', 'Moderated', 'info', { needs: 'approve' }), st('held', 'Held', 'warning'), st('evaluated', 'Evaluated', 'warning'), st('published', 'Results published', 'success', { final: true, needs: 'publish' })],
  initialStatus: 'setting',
  transitions: flow(['setting', 'moderated', 'held', 'evaluated', 'published']),
  dueField: 'examDate',
  actions: ['approve', 'publish'],
  rules: (data) => (data.setter && data.moderator && data.setter === data.moderator ? 'The moderator must be someone other than the paper setter.' : data.__status === 'moderated' && !data.moderator ? 'Choose a moderator first.' : null),
  seeds: [seed(GRN, { paper: 'Data structures, end semester', programme: 'b_sc_computer_science', examDate: '2026-12-10', setter: grnStaff(3), students: 62 }, 'setting')],
};

const externals: CollectionDef = {
  key: 'externals',
  screenId: 'SP-C-08',
  module: 'examcontrol',
  title: 'External examiners',
  singular: 'Examiner',
  description: 'Examiners from outside, their panel, fees and conflicts of interest.',
  titleField: 'name',
  fields: [f.text('name', 'Examiner', { required: true, list: true }), f.text('organization', 'Organization', { required: true, list: true }), f.email('email', 'Email', { required: true }), f.sel('subject', 'Subject', ['Computer Science', 'Commerce', 'Management', 'Mathematics', 'Physics'], { required: true, list: true }), f.money('fee', 'Fee per paper', { list: true }), f.bool('conflict', 'Has a conflict of interest')],
  statuses: [st('invited', 'Invited', 'neutral'), st('confirmed', 'Confirmed', 'success'), st('declined', 'Declined', 'neutral', { final: true, reason: true })],
  initialStatus: 'invited',
  transitions: { invited: ['confirmed', 'declined'] },
  rules: (data) => (data.__status === 'confirmed' && data.conflict ? 'An examiner with a conflict of interest cannot be confirmed.' : null),
  seeds: [seed(GRN, { name: 'Dr. Leela Menon', organization: 'IIT Bombay', email: 'leela.menon@example.demo', subject: 'computer_science', fee: 2500 }, 'confirmed')],
};

// ---------- research
const ethics: CollectionDef = {
  key: 'ethics',
  screenId: 'SP-C-10',
  module: 'research',
  title: 'Research ethics',
  singular: 'Application',
  description: 'Ethics approval for studies involving people, animals or sensitive data.',
  titleField: 'title',
  sensitive: 'Ethics applications can include personal data of participants.',
  fields: [f.text('title', 'Study', { required: true, list: true }), f.staff('investigator', 'Principal investigator', { required: true, list: true }), f.sel('risk', 'Risk', ['Minimal', 'Moderate', 'High'], { required: true, list: true }), f.num('participants', 'Participants', { min: 0, list: true }), f.bool('consent', 'Consent process described'), f.long('summary', 'Summary', { required: true })],
  statuses: [st('submitted', 'Submitted', 'neutral'), st('review', 'Committee review', 'warning'), st('approved', 'Approved', 'success', { needs: 'approve' }), st('rejected', 'Rejected', 'danger', { needs: 'approve', reason: true, final: true }), st('revise', 'Revisions asked', 'info', { reason: true })],
  initialStatus: 'submitted',
  transitions: { submitted: ['review'], review: ['approved', 'rejected', 'revise'], revise: ['review'] },
  actions: ['approve'],
  rules: (data) => (data.__status === 'approved' && !data.consent && Number(data.participants ?? 0) > 0 ? 'A study with participants needs a consent process before approval.' : null),
  seeds: [seed(GRN, { title: 'Study habits of first year students', investigator: grnStaff(3), risk: 'minimal', participants: 120, consent: true, summary: 'A survey on study time and results.' }, 'review')],
};

const grants: CollectionDef = {
  key: 'grants',
  screenId: 'SP-U-09',
  module: 'research',
  title: 'Research projects and grants',
  singular: 'Project',
  description: 'Funded projects, the amount sanctioned and the amount spent.',
  titleField: 'title',
  fields: [f.text('title', 'Project', { required: true, list: true }), f.staff('investigator', 'Investigator', { required: true, list: true }), f.text('funder', 'Funding body', { required: true, list: true }), f.money('sanctioned', 'Sanctioned', { required: true, list: true }), f.money('spent', 'Spent', { list: true }), f.date('start', 'Starts', { required: true }), f.date('end', 'Ends', { required: true, list: true })],
  statuses: [st('proposed', 'Proposed', 'neutral'), st('active', 'Active', 'success', { needs: 'approve' }), st('completed', 'Completed', 'info', { final: true }), st('terminated', 'Terminated', 'danger', { final: true, reason: true })],
  initialStatus: 'proposed',
  transitions: { proposed: ['active', 'terminated'], active: ['completed', 'terminated'] },
  dueField: 'end',
  actions: ['approve'],
  rules: (data) => (String(data.end) <= String(data.start) ? 'The end must be after the start.' : Number(data.spent ?? 0) > Number(data.sanctioned) ? 'Spent is more than sanctioned.' : null),
  seeds: [seed(LAKE, { title: 'Low power sensors for farms', investigator: lakeStaff(3), funder: 'DST', sanctioned: 1800000, spent: 420000, start: '2026-04-01', end: '2028-03-31' }, 'active')],
};

const publications: CollectionDef = {
  key: 'publications',
  screenId: 'SC-15',
  module: 'research',
  title: 'Publications',
  singular: 'Publication',
  description: 'Papers, books and patents by faculty.',
  titleField: 'title',
  fields: [f.text('title', 'Title', { required: true, list: true }), f.staff('author', 'Author from here', { required: true, list: true }), f.sel('kind', 'Kind', ['Journal paper', 'Conference paper', 'Book chapter', 'Book', 'Patent'], { required: true, list: true }), f.text('venue', 'Journal or venue', { required: true, list: true }), f.num('year', 'Year', { required: true, min: 1990, max: 2100, list: true }), f.text('doi', 'DOI', { unique: true })],
  seeds: [seed(GRN, { title: 'Adaptive study planners', author: grnStaff(3), kind: 'journal_paper', venue: 'Journal of Educational Computing', year: 2026, doi: '10.1000/demo.2026.1' })],
};

// ---------- careers
const internships: CollectionDef = {
  key: 'internships',
  screenId: 'SP-C-11',
  module: 'careers',
  title: 'Internships and apprenticeships',
  singular: 'Placement',
  description: 'Students placed with employers, with a supervisor and an evaluation.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.text('employer', 'Employer', { required: true, list: true }), f.staff('mentor', 'Faculty mentor', { required: true, list: true }), f.date('start', 'Starts', { required: true, list: true }), f.date('end', 'Ends', { required: true, list: true }), f.money('stipend', 'Stipend a month'), f.num('rating', 'Supervisor rating (1 to 5)', { min: 1, max: 5 })],
  statuses: [st('proposed', 'Proposed', 'neutral'), st('approved', 'Approved', 'info', { needs: 'approve' }), st('ongoing', 'Ongoing', 'warning'), st('completed', 'Completed', 'success', { final: true }), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'proposed',
  transitions: flow(['proposed', 'approved', 'ongoing', 'completed'], { proposed: ['cancelled'], approved: ['cancelled'], ongoing: ['cancelled'] }),
  dueField: 'end',
  actions: ['approve'],
  rules: (data) => (String(data.end) <= String(data.start) ? 'The end must be after the start.' : data.__status === 'completed' && !data.rating ? 'Record the supervisor rating first.' : null),
  seeds: [seed(GRN, { student: 'Kriti Shah', employer: 'Infosys', mentor: grnStaff(3), start: '2026-12-01', end: '2027-01-31', stipend: 15000 }, 'approved')],
};

const partnerships: CollectionDef = {
  key: 'partnerships',
  screenId: 'SP-C-12',
  module: 'careers',
  title: 'Industry partnerships',
  singular: 'Partnership',
  description: 'Agreements with companies: internships, guest lectures, labs, hiring.',
  titleField: 'company',
  fields: [f.text('company', 'Company', { required: true, unique: true, list: true }), f.sel('kind', 'Kind', ['Internships', 'Hiring', 'Guest lectures', 'Joint lab', 'Sponsorship'], { required: true, list: true }), f.text('contact', 'Contact person', { required: true }), f.email('email', 'Contact email'), f.date('signed', 'Signed on', { required: true }), f.date('renew', 'Renew by', { required: true, list: true })],
  statuses: [st('active', 'Active', 'success'), st('lapsed', 'Lapsed', 'warning'), st('ended', 'Ended', 'neutral', { final: true, reason: true })],
  initialStatus: 'active',
  transitions: { active: ['lapsed', 'ended'], lapsed: ['active', 'ended'] },
  dueField: 'renew',
  rules: (data) => (String(data.renew) <= String(data.signed) ? 'The renewal date must be after the signing date.' : null),
  seeds: [seed(GRN, { company: 'Infosys', kind: 'internships', contact: 'Anand Rao', email: 'anand.rao@example.demo', signed: '2025-12-01', renew: '2026-12-01' }, 'active')],
};

const placements: CollectionDef = {
  key: 'placements',
  screenId: 'SC-16',
  module: 'careers',
  title: 'Placements',
  singular: 'Offer',
  description: 'Job offers to students and whether they were accepted.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.text('company', 'Company', { required: true, list: true }), f.text('role', 'Role', { required: true, list: true }), f.money('package', 'Package a year', { required: true, list: true }), f.date('offered', 'Offered on', { required: true })],
  statuses: [st('offered', 'Offered', 'info'), st('accepted', 'Accepted', 'success'), st('declined', 'Declined', 'neutral', { final: true })],
  initialStatus: 'offered',
  transitions: { offered: ['accepted', 'declined'] },
  seeds: [seed(GRN, { student: 'Kriti Shah', company: 'Infosys', role: 'Systems engineer', package: 420000, offered: '2026-10-20' }, 'accepted')],
};

// ---------- alumni
const alumni: CollectionDef = {
  key: 'directory',
  screenId: 'SC-17',
  module: 'alumni',
  title: 'Alumni directory',
  singular: 'Alumnus',
  description: 'Former students, where they are now, and whether they want to stay in touch.',
  titleField: 'name',
  sensitive: 'Alumni contact details are shared only with their consent.',
  fields: [f.text('name', 'Name', { required: true, list: true }), f.num('year', 'Year of graduation', { required: true, min: 1950, max: 2100, list: true }), f.sel('programme', 'Programme', PROGRAMMES, { required: true, list: true }), f.text('employer', 'Works at', { list: true }), f.email('email', 'Email'), f.bool('consent', 'Agrees to be contacted')],
  rules: (data) => (data.email && !data.consent ? 'Contact details are kept only with the alumnus\'s consent.' : null),
  seeds: [seed(GRN, { name: 'Sneha Kulkarni', year: 2019, programme: 'b_com', employer: 'Deloitte', email: 'sneha.k@example.demo', consent: true })],
};

const engagements: CollectionDef = {
  key: 'engagements',
  screenId: 'SC-18',
  module: 'alumni',
  title: 'Alumni engagement and giving',
  singular: 'Engagement',
  description: 'Events, mentoring and donations from alumni.',
  titleField: 'alumnus',
  fields: [f.text('alumnus', 'Alumnus', { required: true, list: true }), f.sel('kind', 'Kind', ['Guest lecture', 'Mentoring', 'Donation', 'Event', 'Job referral'], { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.money('amount', 'Amount', { showWhen: { key: 'kind', equals: 'donation' }, list: true }), f.text('note', 'Note')],
  seeds: [seed(GRN, { alumnus: 'Sneha Kulkarni', kind: 'donation', date: '2026-08-15', amount: 25000, note: 'Library fund' })],
};

// ---------- international
const mobility: CollectionDef = {
  key: 'mobility',
  screenId: 'SC-19',
  module: 'international',
  title: 'Student mobility',
  singular: 'Exchange',
  description: 'Students going out or coming in on exchange.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.sel('direction', 'Direction', ['Going out', 'Coming in'], { required: true, list: true }), f.text('partner', 'Partner institution', { required: true, list: true }), f.text('country', 'Country', { required: true, list: true }), f.date('start', 'From', { required: true }), f.date('end', 'To', { required: true }), f.num('credits', 'Credits to transfer', { min: 0 })],
  statuses: [st('applied', 'Applied', 'neutral'), st('approved', 'Approved', 'info', { needs: 'approve' }), st('ongoing', 'Ongoing', 'warning'), st('completed', 'Completed', 'success', { final: true }), st('declined', 'Declined', 'danger', { final: true, reason: true, needs: 'approve' })],
  initialStatus: 'applied',
  transitions: flow(['applied', 'approved', 'ongoing', 'completed'], { applied: ['declined'] }),
  actions: ['approve'],
  rules: (data) => (String(data.end) <= String(data.start) ? 'The end must be after the start.' : null),
  seeds: [seed(GRN, { student: 'Aditi Rao', direction: 'going_out', partner: 'University of Leeds', country: 'United Kingdom', start: '2027-01-10', end: '2027-05-30', credits: 12 }, 'applied')],
};

const mous: CollectionDef = {
  key: 'mous',
  screenId: 'SC-20',
  module: 'international',
  title: 'Agreements and partners',
  singular: 'Agreement',
  description: 'Memoranda of understanding with institutions abroad.',
  titleField: 'partner',
  fields: [f.text('partner', 'Partner', { required: true, unique: true, list: true }), f.text('country', 'Country', { required: true, list: true }), f.sel('scope', 'Scope', ['Student exchange', 'Faculty exchange', 'Joint research', 'Twinning', 'Dual degree'], { required: true, list: true }), f.date('signed', 'Signed', { required: true }), f.date('expires', 'Expires', { required: true, list: true })],
  statuses: [st('active', 'Active', 'success'), st('expired', 'Expired', 'warning'), st('terminated', 'Terminated', 'neutral', { final: true, reason: true })],
  initialStatus: 'active',
  transitions: { active: ['expired', 'terminated'], expired: ['active', 'terminated'] },
  dueField: 'expires',
  rules: (data) => (String(data.expires) <= String(data.signed) ? 'The agreement must expire after it is signed.' : null),
  seeds: [seed(GRN, { partner: 'University of Leeds', country: 'United Kingdom', scope: 'student_exchange', signed: '2024-09-01', expires: '2027-08-31' }, 'active')],
};

export const SHARED_MODULES: ModuleGroup[] = [{ key: 'quality', label: 'Quality and compliance', description: 'Inspections, improvement plan, regulatory reports and accreditation evidence.', profiles: 'all', scope: 'inst', nav: 'Insights', collections: [inspections, improvement, regulatory, evidence] }];

const HIGHER: ModuleGroup['profiles'] = ['college', 'university', 'institute'];
export const COLLEGE_MODULES: ModuleGroup[] = [
  { key: 'programmes', label: 'Programmes and courses', description: 'Course catalog, requirements and credit transfer.', profiles: HIGHER, scope: 'inst', nav: 'Academics', collections: [catalogC, requirements, creditTransfers] },
  { key: 'academicrecords', label: 'Academic records', description: 'Standing and probation, registration holds, degree audit.', profiles: HIGHER, scope: 'inst', nav: 'Academics', collections: [standing, holds, audits] },
  { key: 'facultywork', label: 'Faculty workload', description: 'Weekly hours of teaching, research and administration.', profiles: HIGHER, scope: 'inst', nav: 'Academics', collections: [workload] },
  { key: 'examcontrol', label: 'Examination control', description: 'Papers, moderation, external examiners and results.', profiles: HIGHER, scope: 'inst', nav: 'Academics', collections: [papers, externals] },
  { key: 'research', label: 'Research', description: 'Ethics, projects and grants, publications.', profiles: HIGHER, scope: 'inst', nav: 'Insights', collections: [ethics, grants, publications] },
  { key: 'careers', label: 'Careers and industry', description: 'Internships, partnerships and placements.', profiles: HIGHER, scope: 'inst', nav: 'Operations', collections: [internships, partnerships, placements] },
  { key: 'alumni', label: 'Alumni', description: 'Directory, engagement and giving.', profiles: HIGHER, scope: 'inst', nav: 'Operations', collections: [alumni, engagements] },
  { key: 'international', label: 'International relations', description: 'Student mobility and agreements.', profiles: HIGHER, scope: 'inst', nav: 'Operations', collections: [mobility, mous] },
];

