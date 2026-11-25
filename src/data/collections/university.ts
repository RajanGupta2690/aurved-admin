import type { CollectionDef, ModuleGroup } from '../../core/records/types';
import { f, flow, MER, seed, st } from './helpers';

const isAffiliated = (id: string, ctx: { institutions: Array<{ id: string; relationship?: { type: string } }> }) => ctx.institutions.find((inst) => inst.id === id)?.relationship?.type === 'affiliated';

const collegeInspections: CollectionDef = {
  key: 'collegeinspections',
  screenId: 'SP-U-01',
  module: 'univaffairs',
  title: 'Affiliated college inspections',
  singular: 'Inspection',
  description: 'Inspection of an affiliated college by a committee, and the decision on affiliation.',
  titleField: 'college',
  fields: [f.inst('college', 'Affiliated college', { required: true, list: true }), f.sel('purpose', 'Purpose', ['New affiliation', 'Renewal', 'Surprise visit', 'Complaint'], { required: true, list: true }), f.date('date', 'Visit date', { required: true, list: true }), f.text('committee', 'Committee members', { required: true }), f.long('findings', 'Findings')],
  statuses: [st('planned', 'Planned', 'info'), st('visited', 'Visited', 'warning'), st('report', 'Report written', 'warning'), st('granted', 'Granted', 'success', { final: true, needs: 'approve' }), st('conditional', 'Granted with conditions', 'info', { final: true, needs: 'approve', reason: true }), st('refused', 'Refused', 'danger', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'planned',
  transitions: { planned: ['visited'], visited: ['report'], report: ['granted', 'conditional', 'refused'] },
  dueField: 'date',
  actions: ['approve'],
  rules: (data, ctx) => (!isAffiliated(String(data.college), ctx) ? 'Only affiliated colleges are inspected for affiliation.' : data.__status === 'report' && !data.findings ? 'Write the findings first.' : null),
  seeds: [seed(MER, { college: 'inst-mer-eng', purpose: 'renewal', date: '2026-12-05', committee: 'Prof. Nair, Dr. Hegde, Dr. Pinto' }, 'planned'), seed(MER, { college: 'inst-mer-med', purpose: 'new_affiliation', date: '2026-11-15', committee: 'Dr. Shenoy, Dr. Rao', findings: 'Hospital beds and lab equipment meet the norms.' }, 'report')],
};

const resultApproval: CollectionDef = {
  key: 'resultapproval',
  screenId: 'SP-U-04',
  module: 'univaffairs',
  title: 'Central result approval',
  singular: 'Result',
  description: 'Results sent by colleges are moderated and approved centrally before they are published.',
  titleField: 'exam',
  fields: [f.inst('college', 'College', { required: true, list: true }), f.text('exam', 'Examination', { required: true, list: true }), f.num('appeared', 'Appeared', { required: true, min: 1, list: true }), f.num('passed', 'Passed', { required: true, min: 0, list: true }), f.num('passPercent', 'Pass percentage', { computed: true, list: true }), f.long('remarks', 'Moderation remarks')],
  statuses: [st('submitted', 'Submitted by the college', 'neutral'), st('moderation', 'Under moderation', 'warning'), st('approved', 'Approved', 'info', { needs: 'approve' }), st('published', 'Published', 'success', { final: true, needs: 'publish' }), st('returned', 'Returned to college', 'danger', { reason: true })],
  initialStatus: 'submitted',
  transitions: { submitted: ['moderation'], moderation: ['approved', 'returned'], returned: ['submitted'], approved: ['published'] },
  actions: ['approve', 'publish'],
  derive: (data) => ({ passPercent: Math.round((Number(data.passed) / Number(data.appeared)) * 1000) / 10 }),
  rules: (data) => (Number(data.passed) > Number(data.appeared) ? 'More passed than appeared.' : null),
  seeds: [seed(MER, { college: 'inst-mer-sci', exam: 'B.Sc Semester 3, November 2026', appeared: 410, passed: 361 }, 'moderation'), seed(MER, { college: 'inst-mer-eng', exam: 'B.E. Semester 5, November 2026', appeared: 520, passed: 404 }, 'submitted'), seed(MER, { college: 'inst-mer-arts', exam: 'B.A. Semester 1, October 2026', appeared: 300, passed: 270 }, 'published')],
};

const degrees: CollectionDef = {
  key: 'degrees',
  screenId: 'SP-U-05',
  module: 'univaffairs',
  title: 'Degree issuance',
  singular: 'Degree',
  description: 'Degrees awarded: eligibility, approval, printing and handing over. Every degree has a verification number.',
  titleField: 'student',
  fields: [f.text('student', 'Graduate', { required: true, list: true }), f.inst('college', 'College', { required: true, list: true }), f.text('programme', 'Programme', { required: true, list: true }), f.num('year', 'Year', { required: true, min: 2000, max: 2100, list: true }), f.text('verification', 'Verification number', { unique: true, list: true }), f.date('convocation', 'Convocation')],
  statuses: [st('eligible', 'Eligible', 'neutral'), st('approved', 'Approved by the council', 'info', { needs: 'approve' }), st('printed', 'Printed', 'warning'), st('issued', 'Issued', 'success', { final: true }), st('withheld', 'Withheld', 'danger', { reason: true, needs: 'approve' })],
  initialStatus: 'eligible',
  transitions: { eligible: ['approved', 'withheld'], approved: ['printed', 'withheld'], printed: ['issued'], withheld: ['eligible'] },
  actions: ['approve'],
  rules: (data) => (data.__status === 'printed' && !data.verification ? 'Give the degree a verification number before printing.' : null),
  seeds: [seed(MER, { student: 'Aisha Rahman', college: 'inst-mer-sci', programme: 'B.Sc Physics', year: 2026, verification: 'MU-2026-000118', convocation: '2026-12-18' }, 'printed')],
};

const council: CollectionDef = {
  key: 'council',
  screenId: 'SP-U-07',
  module: 'univaffairs',
  title: 'Academic council meetings',
  singular: 'Meeting',
  description: 'Meetings of the Academic Council, the agenda, and the minutes.',
  titleField: 'title',
  fields: [f.text('title', 'Meeting', { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.text('venue', 'Venue', { required: true }), f.long('agenda', 'Agenda', { required: true }), f.num('members', 'Members', { min: 1 }), f.num('present', 'Present', { min: 0, list: true }), f.long('minutes', 'Minutes')],
  statuses: [st('scheduled', 'Scheduled', 'info'), st('held', 'Held', 'warning'), st('minutes', 'Minutes approved', 'success', { final: true, needs: 'approve' })],
  initialStatus: 'scheduled',
  transitions: flow(['scheduled', 'held', 'minutes']),
  dueField: 'date',
  actions: ['approve'],
  rules: (data) => (Number(data.present ?? 0) > Number(data.members ?? Infinity) ? 'More present than members.' : data.__status === 'minutes' && !data.minutes ? 'Write the minutes first.' : null),
  seeds: [seed(MER, { title: 'Academic Council, December', date: '2026-12-01', venue: 'Senate hall', agenda: 'Result moderation. New electives at Hampi School of Law. Affiliation renewals.', members: 24 }, 'scheduled')],
};

const resolutions: CollectionDef = {
  key: 'resolutions',
  screenId: 'SP-U-08',
  module: 'univaffairs',
  title: 'Resolutions',
  singular: 'Resolution',
  description: 'Decisions of the council and who must carry them out.',
  titleField: 'number',
  fields: [f.text('number', 'Resolution number', { required: true, unique: true, list: true }), f.text('subject', 'Subject', { required: true, list: true }), f.long('text', 'Resolution', { required: true }), f.text('owner', 'Responsible office', { required: true, list: true }), f.date('due', 'Carry out by', { required: true, list: true })],
  statuses: [st('proposed', 'Proposed', 'neutral'), st('passed', 'Passed', 'success', { needs: 'approve' }), st('implemented', 'Implemented', 'info', { final: true }), st('rejected', 'Not passed', 'danger', { final: true, reason: true, needs: 'approve' })],
  initialStatus: 'proposed',
  transitions: { proposed: ['passed', 'rejected'], passed: ['implemented'] },
  dueField: 'due',
  actions: ['approve'],
  seeds: [seed(MER, { number: 'AC/2026/41', subject: 'Two new electives at Hampi School of Law', text: 'The council approves the proposed electives from the next session.', owner: 'Registrar', due: '2027-01-31' }, 'proposed')],
};

const phd: CollectionDef = {
  key: 'phd',
  screenId: 'SP-U-10',
  module: 'univaffairs',
  title: 'PhD thesis evaluation',
  singular: 'Thesis',
  description: 'From submission to the award of the degree: examiners, reports and the viva.',
  titleField: 'scholar',
  fields: [f.text('scholar', 'Scholar', { required: true, list: true }), f.text('title', 'Thesis title', { required: true, list: true }), f.inst('college', 'Research centre', { list: true }), f.text('supervisor', 'Supervisor', { required: true }), f.num('examinersReports', 'Examiner reports received', { min: 0, max: 5, list: true }), f.date('viva', 'Viva on')],
  statuses: [st('submitted', 'Submitted', 'neutral'), st('examiners', 'With examiners', 'warning'), st('viva', 'Viva scheduled', 'info'), st('awarded', 'Degree awarded', 'success', { final: true, needs: 'approve' }), st('revise', 'Revision asked', 'danger', { reason: true })],
  initialStatus: 'submitted',
  transitions: { submitted: ['examiners'], examiners: ['viva', 'revise'], revise: ['examiners'], viva: ['awarded', 'revise'] },
  actions: ['approve'],
  rules: (data) => (data.__status === 'viva' && Number(data.examinersReports ?? 0) < 2 ? 'At least two examiner reports are needed before the viva.' : data.__status === 'viva' && !data.viva ? 'Set the date of the viva.' : null),
  seeds: [seed(MER, { scholar: 'Mahesh Kamath', title: 'Soil carbon in the Western Ghats', college: 'inst-mer-sci', supervisor: 'Prof. D. Nayak', examinersReports: 1 }, 'examiners')],
};

const interTransfers: CollectionDef = {
  key: 'intertransfers',
  screenId: 'SP-U-11',
  module: 'univaffairs',
  title: 'Inter-college transfer',
  singular: 'Transfer',
  description: 'A student moves from one college of the university to another. Both colleges must agree.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.inst('from', 'From college', { required: true, list: true }), f.inst('to', 'To college', { required: true, list: true }), f.text('programme', 'Programme', { required: true }), f.long('reason', 'Reason', { required: true })],
  statuses: [st('requested', 'Requested', 'neutral'), st('released', 'Released by the first college', 'info'), st('accepted', 'Accepted by the second college', 'warning'), st('completed', 'Completed', 'success', { final: true, needs: 'approve' }), st('refused', 'Refused', 'danger', { final: true, reason: true })],
  initialStatus: 'requested',
  transitions: { requested: ['released', 'refused'], released: ['accepted', 'refused'], accepted: ['completed', 'refused'] },
  actions: ['approve'],
  rules: (data) => (data.from === data.to ? 'The two colleges must be different.' : null),
  seeds: [seed(MER, { student: 'Sahana Hegde', from: 'inst-mer-sci', to: 'inst-mer-arts', programme: 'B.Sc to B.A. Psychology', reason: 'Change of subject after the first year.' }, 'released')],
};

export const UNIVERSITY_MODULES: ModuleGroup[] = [
  { key: 'univaffairs', label: 'University affairs', description: 'Affiliation inspections, central results, degrees, council, resolutions, PhD evaluation and transfers.', profiles: 'all', scope: 'org', nav: 'Organization', orgTypes: ['university'], collections: [collegeInspections, resultApproval, degrees, council, resolutions, phd, interTransfers] },
];

