import type { CollectionDef, ModuleGroup } from '../../core/records/types';
import { f, flow, GRN, grnStaff, seed, st, SUN, sunStaff } from './helpers';
import { currentRegion } from '../../core/i18n/format';

// ============================================================ finance (replaces the old fees screen)
const feeHeads: CollectionDef = {
  key: 'fees',
  screenId: 'FIN-01',
  module: 'finance',
  title: 'Fee structure',
  singular: 'Fee head',
  description: 'What is charged, how much, how often, and to whom.',
  titleField: 'name',
  fields: [f.text('name', 'Fee head', { required: true, unique: true, list: true }), f.sel('frequency', 'How often', ['Once', 'Monthly', 'Quarterly', 'Per term', 'Yearly'], { required: true, list: true }), f.money('amount', 'Amount', { required: true, list: true }), f.text('appliesTo', 'Applies to', { required: true, list: true, hint: 'For example Class 1 to 5' }), f.sel('account', 'Counts as', ['Tuition revenue', 'Other revenue', 'Refundable deposit'], { required: true, list: true, hint: 'A refundable deposit is a liability, not revenue.' })],
  statuses: [st('active', 'In use', 'success'), st('retired', 'Retired', 'neutral', { final: true, reason: true })],
  initialStatus: 'active',
  transitions: { active: ['retired'] },
  seeds: [seed(SUN, { name: 'Tuition, Class 1 to 5', frequency: 'quarterly', amount: 18000, appliesTo: 'Class 1 to 5', account: 'tuition_revenue' }), seed(SUN, { name: 'Security deposit', frequency: 'once', amount: 5000, appliesTo: 'New admissions', account: 'refundable_deposit' }), seed(GRN, { name: 'Tuition, B.Sc', frequency: 'per_term', amount: 42000, appliesTo: 'B.Sc programmes', account: 'tuition_revenue' })],
};

const invoices: CollectionDef = {
  key: 'invoices',
  screenId: 'FIN-02',
  module: 'finance',
  title: 'Invoices',
  singular: 'Invoice',
  description: 'Fees billed to students. The invoice becomes partly paid and paid by itself as payments are recorded.',
  dependsOn: ['finance.fees'],
  titleField: 'number',
  fields: [f.text('number', 'Invoice number', { required: true, unique: true, list: true }), f.text('student', 'Student', { required: true, list: true }), f.text('feeHead', 'Fee head', { required: true, list: true }), f.money('amount', 'Amount', { required: true, min: 1, list: true }), f.date('issued', 'Issued on', { required: true }), f.date('due', 'Due on', { required: true, list: true })],
  statuses: [st('issued', 'Unpaid', 'warning'), st('partial', 'Part paid', 'info'), st('paid', 'Paid', 'success', { final: true }), st('waived', 'Waived', 'neutral', { final: true, needs: 'approve', reason: true }), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'issued',
  transitions: { issued: ['partial', 'paid', 'waived', 'cancelled'], partial: ['paid', 'waived'] },
  dueField: 'due',
  actions: ['approve'],
  rules: (data, ctx) => {
    if (String(data.due) < String(data.issued)) return 'The due date cannot be before the issue date.';
    if (!ctx.related.fees?.some((row) => row.data.name === data.feeHead)) return 'Choose a fee head that is in the fee structure.';
    if (data.__status === 'paid' || data.__status === 'partial') {
      const paid = (ctx.related.payments ?? []).filter((row) => row.data.invoice === data.number && row.data.kind !== 'refund').reduce((sum, row) => sum + Number(row.data.amount), 0);
      if (data.__status === 'paid' && paid < Number(data.amount)) return 'The payments recorded do not cover the invoice. Record the payment first.';
      if (data.__status === 'partial' && paid <= 0) return 'No payment is recorded for this invoice.';
    }
    return null;
  },
  seeds: [seed(SUN, { number: 'INV-1001', student: 'Aarav Sharma, Class 5', feeHead: 'Tuition, Class 1 to 5', amount: 18000, issued: '2026-10-01', due: '2026-10-15' }, 'partial'), seed(SUN, { number: 'INV-1002', student: 'Diya Patel, Class 3', feeHead: 'Tuition, Class 1 to 5', amount: 18000, issued: '2026-10-01', due: '2026-10-15' }, 'issued'), seed(SUN, { number: 'INV-1003', student: 'Rahul Verma, Class 8', feeHead: 'Tuition, Class 1 to 5', amount: 18000, issued: '2026-10-01', due: '2026-10-15' }, 'paid')],
};

const payments: CollectionDef = {
  key: 'payments',
  screenId: 'FIN-03',
  module: 'finance',
  title: 'Payments received',
  singular: 'Payment',
  description: 'Cash received. A fee payment is matched to an invoice and cannot exceed what is owed. An advance is money received before an invoice, a liability until applied.',
  dependsOn: ['finance.invoices'],
  titleField: 'receipt',
  fields: [f.text('receipt', 'Receipt number', { required: true, unique: true, list: true }), f.sel('kind', 'Kind', [['fee', 'Fee payment'], ['advance', 'Advance'], ['refund', 'Refund']], { required: true, list: true }), f.text('invoice', 'Invoice number', { showWhen: { key: 'kind', equals: 'fee' }, list: true }), f.text('payer', 'Received from', { required: true, list: true }), f.money('amount', 'Amount', { required: true, min: 1, list: true }), f.date('date', 'Date', { required: true, list: true }), f.sel('mode', 'Mode', ['Cash', 'Cheque', 'Bank transfer', 'UPI', 'Card'], { required: true, list: true })],
  rules: (data, ctx) => {
    if (String(data.date) > ctx.today) return 'The date cannot be in the future.';
    if (data.kind === 'fee') {
      const invoice = ctx.related.invoices?.find((row) => row.data.number === data.invoice);
      if (!invoice) return 'Enter the number of an invoice that exists.';
      if (invoice.status === 'cancelled' || invoice.status === 'waived') return 'This invoice is closed. Nothing is owed.';
      const paid = ctx.others.filter((row) => row.data.invoice === data.invoice && row.data.kind === 'fee').reduce((sum, row) => sum + Number(row.data.amount), 0);
      const owed = Number(invoice.data.amount) - paid;
      if (Number(data.amount) > owed) return `Only ${owed.toLocaleString(currentRegion().locale)} is owed on this invoice. Record the rest as an advance.`;
    }
    return null;
  },
  after: (snap, row) => {
    if (row.data.kind !== 'fee') return snap;
    const list = snap.records.invoices ?? [];
    const invoice = list.find((item) => item.scopeId === row.scopeId && item.data.number === row.data.invoice);
    if (!invoice) return snap;
    const paid = (snap.records.payments ?? []).filter((item) => item.scopeId === row.scopeId && item.data.invoice === row.data.invoice && item.data.kind === 'fee').reduce((sum, item) => sum + Number(item.data.amount), 0);
    const status = paid >= Number(invoice.data.amount) ? 'paid' : 'partial';
    if (invoice.status === status) return snap;
    return { ...snap, records: { ...snap.records, invoices: list.map((item) => (item.id === invoice.id ? { ...item, status, updatedAt: row.createdAt, history: [...item.history, { at: row.createdAt, by: row.createdBy, summary: `Status: ${status === 'paid' ? 'Paid' : 'Part paid'} after receipt ${row.data.receipt}.` }] } : item)) } };
  },
  seeds: [seed(SUN, { receipt: 'RCT-501', kind: 'fee', invoice: 'INV-1001', payer: 'Rakesh Sharma', amount: 9000, date: '2026-10-10', mode: 'upi' }), seed(SUN, { receipt: 'RCT-502', kind: 'fee', invoice: 'INV-1003', payer: 'Verma family', amount: 18000, date: '2026-10-12', mode: 'bank_transfer' }), seed(SUN, { receipt: 'RCT-503', kind: 'advance', payer: 'Joshi family', amount: 20000, date: '2026-11-02', mode: 'cheque' })],
};

const expenses: CollectionDef = {
  key: 'expenses',
  screenId: 'FIN-04',
  module: 'finance',
  title: 'Expenses and payables',
  singular: 'Expense',
  description: 'Bills to pay. Large amounts need approval before they can be paid.',
  titleField: 'description',
  fields: [f.text('description', 'What for', { required: true, list: true }), f.text('vendor', 'Vendor', { required: true, list: true }), f.sel('category', 'Category', ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Events', 'Transport', 'Other'], { required: true, list: true }), f.money('amount', 'Amount', { required: true, min: 1, list: true }), f.date('billDate', 'Bill date', { required: true }), f.date('due', 'Pay by', { required: true, list: true })],
  statuses: [st('draft', 'Draft', 'neutral'), st('approved', 'Approved', 'info', { needs: 'approve' }), st('paid', 'Paid', 'success', { final: true }), st('rejected', 'Rejected', 'danger', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'draft',
  transitions: { draft: ['approved', 'rejected'], approved: ['paid'] },
  dueField: 'due',
  actions: ['approve'],
  rules: (data) => (String(data.due) < String(data.billDate) ? 'The due date cannot be before the bill date.' : null),
  seeds: [seed(SUN, { description: 'Electricity, October', vendor: 'MSEDCL', category: 'utilities', amount: 84500, billDate: '2026-11-02', due: '2026-11-22' }, 'approved'), seed(SUN, { description: 'Science lab equipment', vendor: 'Edu Supplies Ltd', category: 'supplies', amount: 320000, billDate: '2026-11-10', due: '2026-12-10' }, 'draft')],
};

const budgets: CollectionDef = {
  key: 'budgets',
  screenId: 'FIN-05',
  module: 'finance',
  title: 'Budgets',
  singular: 'Budget line',
  description: 'The yearly budget by category, compared with approved and paid expenses.',
  titleField: 'category',
  fields: [f.sel('category', 'Category', ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Events', 'Transport', 'Other'], { required: true, list: true }), f.text('year', 'Financial year', { required: true, list: true, hint: 'For example 2026-27' }), f.money('allocated', 'Allocated', { required: true, min: 1, list: true }), f.text('note', 'Note')],
  uniqueTogether: [{ keys: ['category', 'year'], message: 'This category already has a budget for that year.' }],
  seeds: [seed(SUN, { category: 'utilities', year: '2026-27', allocated: 900000 }), seed(SUN, { category: 'supplies', year: '2026-27', allocated: 500000 })],
};

// ============================================================ hr
const leave: CollectionDef = {
  key: 'leave',
  screenId: 'HR-01',
  module: 'hr',
  title: 'Leave',
  singular: 'Leave request',
  description: 'Leave requests and decisions. Leave cannot overlap and casual leave is limited to 12 days a year.',
  titleField: 'staff',
  fields: [f.staff('staff', 'Person', { required: true, list: true }), f.sel('kind', 'Kind', ['Casual', 'Sick', 'Earned', 'Maternity', 'Without pay'], { required: true, list: true }), f.date('from', 'From', { required: true, list: true }), f.date('to', 'To', { required: true, list: true }), f.num('days', 'Days', { computed: true, list: true }), f.long('reason', 'Reason'), f.staff('cover', 'Cover arranged with')],
  statuses: [st('submitted', 'Waiting', 'warning'), st('approved', 'Approved', 'success', { needs: 'approve' }), st('rejected', 'Rejected', 'danger', { final: true, needs: 'approve', reason: true }), st('withdrawn', 'Withdrawn', 'neutral', { final: true })],
  initialStatus: 'submitted',
  transitions: { submitted: ['approved', 'rejected', 'withdrawn'], approved: ['withdrawn'] },
  actions: ['approve'],
  derive: (data) => ({ days: Math.round((Date.parse(String(data.to)) - Date.parse(String(data.from))) / 86_400_000) + 1 }),
  rules: (data, ctx) => {
    if (String(data.to) < String(data.from)) return 'The last day cannot be before the first.';
    const overlap = ctx.others.find((row) => row.data.staff === data.staff && row.status !== 'rejected' && row.status !== 'withdrawn' && String(data.from) <= String(row.data.to) && String(data.to) >= String(row.data.from));
    if (overlap) return 'This person already has leave on some of these days.';
    if (data.cover && data.cover === data.staff) return 'The cover must be someone else.';
    if (data.kind === 'casual') {
      const days = Math.round((Date.parse(String(data.to)) - Date.parse(String(data.from))) / 86_400_000) + 1;
      const used = ctx.others.filter((row) => row.data.staff === data.staff && row.data.kind === 'casual' && row.status !== 'rejected' && row.status !== 'withdrawn' && String(row.data.from).slice(0, 4) === String(data.from).slice(0, 4)).reduce((sum, row) => sum + Number(row.data.days ?? 0), 0);
      if (used + days > 12) return `Casual leave is limited to 12 days a year. ${used} already used.`;
    }
    return null;
  },
  seeds: [seed(SUN, { staff: sunStaff(3), kind: 'casual', from: '2026-11-24', to: '2026-11-25', reason: 'Family function.', cover: sunStaff(6) }, 'submitted'), seed(GRN, { staff: grnStaff(3), kind: 'sick', from: '2026-11-10', to: '2026-11-12' }, 'approved')],
};

const recruitment: CollectionDef = {
  key: 'recruitment',
  screenId: 'HR-02',
  module: 'hr',
  title: 'Recruitment',
  singular: 'Opening',
  description: 'Posts to fill, applicants and decisions.',
  titleField: 'post',
  fields: [f.text('post', 'Post', { required: true, list: true }), f.text('department', 'Department', { required: true, list: true }), f.num('vacancies', 'Vacancies', { required: true, min: 1, max: 50, list: true }), f.num('applicants', 'Applicants', { min: 0, list: true }), f.num('hired', 'Hired so far', { min: 0, list: true }), f.date('closing', 'Applications close', { required: true, list: true }), f.long('requirements', 'Requirements')],
  statuses: [st('open', 'Open', 'info'), st('interviewing', 'Interviewing', 'warning'), st('filled', 'Filled', 'success', { final: true }), st('closed', 'Closed', 'neutral', { final: true, reason: true })],
  initialStatus: 'open',
  transitions: { open: ['interviewing', 'closed'], interviewing: ['filled', 'closed'] },
  dueField: 'closing',
  rules: (data) => (Number(data.hired ?? 0) > Number(data.vacancies) ? 'More hired than vacancies.' : data.__status === 'filled' && Number(data.hired ?? 0) < Number(data.vacancies) ? 'Not every vacancy is filled yet.' : null),
  seeds: [seed(SUN, { post: 'Mathematics teacher, senior classes', department: 'Academics', vacancies: 1, applicants: 14, hired: 0, closing: '2026-12-10', requirements: 'M.Sc Mathematics and B.Ed' }, 'open')],
};

const appraisals: CollectionDef = {
  key: 'appraisals',
  screenId: 'HR-03',
  module: 'hr',
  title: 'Appraisals',
  singular: 'Appraisal',
  description: 'Yearly review of each person. The person acknowledges it.',
  titleField: 'staff',
  sensitive: 'Appraisals are confidential between the person, their manager and the head.',
  fields: [f.staff('staff', 'Person', { required: true, list: true }), f.text('period', 'Period', { required: true, list: true }), f.staff('reviewer', 'Reviewer', { required: true, list: true }), f.num('rating', 'Rating (1 to 5)', { required: true, min: 1, max: 5, list: true }), f.long('strengths', 'Strengths'), f.long('goals', 'Goals for next year')],
  statuses: [st('draft', 'Draft', 'neutral'), st('submitted', 'Submitted', 'info'), st('acknowledged', 'Acknowledged', 'success', { final: true })],
  initialStatus: 'draft',
  transitions: flow(['draft', 'submitted', 'acknowledged']),
  uniqueTogether: [{ keys: ['staff', 'period'], message: 'This person already has an appraisal for that period.' }],
  rules: (data) => (data.staff === data.reviewer ? 'A person cannot review themselves.' : null),
  seeds: [seed(SUN, { staff: sunStaff(3), period: '2025-26', reviewer: sunStaff(1), rating: 4, strengths: 'Strong with weaker students.', goals: 'Lead the science club.' }, 'submitted')],
};

const training: CollectionDef = {
  key: 'training',
  screenId: 'HR-04',
  module: 'hr',
  title: 'Training',
  singular: 'Training',
  description: 'Courses staff have attended or are booked on.',
  titleField: 'course',
  fields: [f.staff('staff', 'Person', { required: true, list: true }), f.text('course', 'Course', { required: true, list: true }), f.text('provider', 'Provider', { required: true }), f.date('date', 'Date', { required: true, list: true }), f.num('hours', 'Hours', { required: true, min: 1, max: 400, list: true })],
  statuses: [st('booked', 'Booked', 'info'), st('attended', 'Attended', 'success', { final: true }), st('missed', 'Missed', 'warning', { final: true })],
  initialStatus: 'booked',
  transitions: { booked: ['attended', 'missed'] },
  dueField: 'date',
  seeds: [seed(SUN, { staff: sunStaff(3), course: 'Inclusive classroom practice', provider: 'State SCERT', date: '2026-12-12', hours: 16 }, 'booked')],
};

// ============================================================ facilities, hostel, events, procurement, aid
const workorders: CollectionDef = {
  key: 'workorders',
  screenId: 'OPS-01',
  module: 'facilities',
  title: 'Maintenance requests',
  singular: 'Request',
  description: 'Repairs and maintenance, by priority and location.',
  titleField: 'issue',
  fields: [f.text('issue', 'Issue', { required: true, list: true }), f.text('location', 'Where', { required: true, list: true }), f.sel('priority', 'Priority', ['Low', 'Normal', 'High', 'Urgent'], { required: true, list: true }), f.staff('reportedBy', 'Reported by', { required: true }), f.text('assignedTo', 'Assigned to', { list: true }), f.date('due', 'Fix by', { list: true })],
  statuses: [st('new', 'New', 'warning'), st('assigned', 'Assigned', 'info'), st('done', 'Done', 'success', { final: true }), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'new',
  transitions: { new: ['assigned', 'cancelled'], assigned: ['done', 'cancelled'] },
  dueField: 'due',
  rules: (data) => (data.__status === 'assigned' && !data.assignedTo ? 'Say who it is assigned to.' : null),
  seeds: [seed(SUN, { issue: 'Leaking tap in the boys washroom', location: 'Block B, ground floor', priority: 'high', reportedBy: sunStaff(2), due: '2026-11-25' }, 'new'), seed(SUN, { issue: 'Projector not working', location: 'Room 205', priority: 'normal', reportedBy: sunStaff(3), assignedTo: 'IT vendor', due: '2026-11-27' }, 'assigned')],
};

const risks: CollectionDef = {
  key: 'risks',
  screenId: 'OPS-02',
  module: 'facilities',
  title: 'Risk and safety register',
  singular: 'Risk',
  description: 'Risks to people and property, how likely and how serious, and what is done about them.',
  titleField: 'risk',
  fields: [f.text('risk', 'Risk', { required: true, list: true }), f.sel('category', 'Category', ['Fire', 'Structural', 'Health', 'Traffic', 'Cyber', 'Security', 'Weather'], { required: true, list: true }), f.num('likelihood', 'Likelihood (1 to 5)', { required: true, min: 1, max: 5 }), f.num('impact', 'Impact (1 to 5)', { required: true, min: 1, max: 5 }), f.num('score', 'Score', { computed: true, list: true }), f.long('mitigation', 'What is done', { required: true }), f.staff('owner', 'Owner', { required: true, list: true }), f.date('review', 'Review on', { required: true, list: true })],
  statuses: [st('open', 'Open', 'danger'), st('mitigated', 'Mitigated', 'success'), st('accepted', 'Accepted', 'neutral', { reason: true, needs: 'approve' })],
  initialStatus: 'open',
  transitions: { open: ['mitigated', 'accepted'], mitigated: ['open'] },
  dueField: 'review',
  actions: ['approve'],
  derive: (data) => ({ score: Number(data.likelihood) * Number(data.impact) }),
  rules: (data) => (data.__status === 'accepted' && Number(data.likelihood) * Number(data.impact) >= 15 ? 'A high risk (score 15 or more) cannot be accepted. Reduce it first.' : null),
  seeds: [seed(SUN, { risk: 'Overcrowded stairwell at dispersal', category: 'fire', likelihood: 3, impact: 4, mitigation: 'Staggered dispersal and a marshal on each landing.', owner: sunStaff(2), review: '2026-12-20' }, 'open')],
};

const rooms: CollectionDef = {
  key: 'rooms',
  screenId: 'OPS-03',
  module: 'hostel',
  title: 'Hostel rooms',
  singular: 'Room',
  description: 'Rooms, beds and how many are taken.',
  titleField: 'room',
  fields: [f.text('block', 'Block', { required: true, list: true }), f.text('room', 'Room', { required: true, list: true }), f.num('beds', 'Beds', { required: true, min: 1, max: 12, list: true }), f.sel('kind', 'For', ['Boys', 'Girls', 'Staff', 'Visitors'], { required: true, list: true })],
  uniqueTogether: [{ keys: ['block', 'room'], message: 'This block already has a room with that number.' }],
  seeds: [seed(SUN, { block: 'Tagore House', room: '101', beds: 4, kind: 'boys' }), seed(SUN, { block: 'Tagore House', room: '102', beds: 4, kind: 'boys' })],
};

const allotments: CollectionDef = {
  key: 'allotments',
  screenId: 'OPS-04',
  module: 'hostel',
  title: 'Room allotments',
  singular: 'Allotment',
  description: 'Who lives where. A room cannot have more people than beds.',
  dependsOn: ['hostel.rooms'],
  titleField: 'resident',
  fields: [f.text('resident', 'Resident', { required: true, list: true }), f.text('block', 'Block', { required: true, list: true }), f.text('room', 'Room', { required: true, list: true }), f.date('from', 'From', { required: true, list: true }), f.date('to', 'Until')],
  statuses: [st('active', 'Living here', 'success'), st('left', 'Moved out', 'neutral', { final: true })],
  initialStatus: 'active',
  transitions: { active: ['left'] },
  rules: (data, ctx) => {
    const room = ctx.related.rooms?.find((row) => row.data.block === data.block && row.data.room === data.room);
    if (!room) return 'That room is not in the room list.';
    const taken = ctx.others.filter((row) => row.data.block === data.block && row.data.room === data.room && row.status === 'active').length;
    if (taken >= Number(room.data.beds)) return `Room ${data.room} has ${room.data.beds} beds and all are taken.`;
    return ctx.others.some((row) => row.data.resident === data.resident && row.status === 'active') ? 'This person already has a room.' : null;
  },
  seeds: [seed(SUN, { resident: 'Neel Joshi, Class 9', block: 'Tagore House', room: '101', from: '2026-06-15' }, 'active')],
};

const events: CollectionDef = {
  key: 'events',
  screenId: 'OPS-05',
  module: 'events',
  title: 'Events and activities',
  singular: 'Event',
  description: 'School and college events with a budget and an owner.',
  titleField: 'title',
  fields: [f.text('title', 'Event', { required: true, list: true }), f.sel('kind', 'Kind', ['Sports', 'Cultural', 'Academic', 'Trip', 'Community service', 'Other'], { required: true, list: true }), f.date('date', 'Date', { required: true, list: true }), f.staff('owner', 'In charge', { required: true, list: true }), f.money('budget', 'Budget', { list: true }), f.num('expected', 'Expected participants', { min: 0 })],
  statuses: [st('proposed', 'Proposed', 'neutral'), st('approved', 'Approved', 'info', { needs: 'approve' }), st('held', 'Held', 'success', { final: true }), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'proposed',
  transitions: { proposed: ['approved', 'cancelled'], approved: ['held', 'cancelled'] },
  dueField: 'date',
  actions: ['approve'],
  rules: (data, ctx) => (ctx.isNew && String(data.date) < ctx.today ? 'The date cannot be in the past.' : null),
  seeds: [seed(SUN, { title: 'Annual sports day', kind: 'sports', date: '2027-01-15', owner: sunStaff(3), budget: 150000, expected: 900 }, 'approved'), seed(GRN, { title: 'Tech fest', kind: 'academic', date: '2027-02-20', owner: grnStaff(3), budget: 300000 }, 'proposed')],
};

const vendors: CollectionDef = {
  key: 'vendors',
  screenId: 'OPS-06',
  module: 'procurement',
  title: 'Vendors',
  singular: 'Vendor',
  description: 'Approved suppliers.',
  titleField: 'name',
  fields: [f.text('name', 'Vendor', { required: true, unique: true, list: true }), f.text('contact', 'Contact person', { required: true }), f.phone('phone', 'Phone', { required: true, list: true }), f.email('email', 'Email'), f.text('gstin', 'GST number', { unique: true }), f.sel('category', 'Supplies', ['Stationery', 'IT', 'Furniture', 'Food', 'Services', 'Other'], { required: true, list: true })],
  statuses: [st('active', 'Approved', 'success'), st('blocked', 'Blocked', 'danger', { reason: true })],
  initialStatus: 'active',
  transitions: { active: ['blocked'], blocked: ['active'] },
  seeds: [seed(SUN, { name: 'Edu Supplies Ltd', contact: 'Mahesh Rao', phone: '+91 98200 33333', category: 'stationery' })],
};

const orders: CollectionDef = {
  key: 'orders',
  screenId: 'OPS-07',
  module: 'procurement',
  title: 'Purchase orders',
  singular: 'Order',
  description: 'Orders to vendors. Above 1,00,000 an order needs approval. Blocked vendors cannot be used.',
  dependsOn: ['procurement.vendors'],
  titleField: 'number',
  fields: [f.text('number', 'Order number', { required: true, unique: true, list: true }), f.text('vendor', 'Vendor', { required: true, list: true }), f.text('items', 'Items', { required: true, list: true }), f.money('amount', 'Amount', { required: true, min: 1, list: true }), f.date('expected', 'Expected on', { list: true })],
  statuses: [st('draft', 'Draft', 'neutral'), st('approved', 'Approved', 'info', { needs: 'approve' }), st('ordered', 'Ordered', 'warning'), st('received', 'Received', 'success', { final: true }), st('cancelled', 'Cancelled', 'neutral', { final: true, reason: true })],
  initialStatus: 'draft',
  transitions: { draft: ['approved', 'cancelled'], approved: ['ordered', 'cancelled'], ordered: ['received', 'cancelled'] },
  dueField: 'expected',
  actions: ['approve'],
  rules: (data, ctx) => {
    const vendor = ctx.related.vendors?.find((row) => row.data.name === data.vendor);
    if (!vendor) return 'Choose a vendor from the vendor list.';
    if (vendor.status === 'blocked') return 'This vendor is blocked.';
    return null;
  },
  seeds: [seed(SUN, { number: 'PO-2026-014', vendor: 'Edu Supplies Ltd', items: 'Lab equipment', amount: 320000, expected: '2026-12-20' }, 'draft')],
};

const scholarships: CollectionDef = {
  key: 'scholarships',
  screenId: 'OPS-08',
  module: 'aid',
  title: 'Scholarships and financial aid',
  singular: 'Award',
  description: 'Awards to students, with the scheme and the amount.',
  titleField: 'student',
  fields: [f.text('student', 'Student', { required: true, list: true }), f.sel('scheme', 'Scheme', ['Merit', 'Need based', 'Sports', 'Government', 'Alumni funded'], { required: true, list: true }), f.money('amount', 'Amount', { required: true, min: 1, list: true }), f.text('year', 'Year', { required: true, list: true }), f.long('basis', 'Basis of the award')],
  statuses: [st('applied', 'Applied', 'neutral'), st('approved', 'Approved', 'info', { needs: 'approve' }), st('disbursed', 'Disbursed', 'success', { final: true }), st('declined', 'Declined', 'danger', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'applied',
  transitions: flow(['applied', 'approved', 'disbursed'], { applied: ['declined'] }),
  actions: ['approve'],
  rules: (data) => (data.scheme === 'merit' && Number(data.amount) > 100000 ? 'A merit award is capped at 1,00,000.' : null),
  seeds: [seed(GRN, { student: 'Kriti Shah', scheme: 'merit', amount: 40000, year: '2026-27', basis: 'Top rank in first year.' }, 'approved')],
};

export const OPS_MODULES: ModuleGroup[] = [
  { key: 'finance', label: 'Fees and accounts', description: 'Fee structure, invoices, payments, expenses and budgets, with cash, revenue, receivables, advances and liabilities kept apart.', profiles: 'all', scope: 'inst', nav: 'Operations', collections: [feeHeads, invoices, payments, expenses, budgets] },
  { key: 'hr', label: 'HR', description: 'Leave, recruitment, appraisals and training.', profiles: 'all', scope: 'inst', nav: 'People', collections: [leave, recruitment, appraisals, training] },
  { key: 'facilities', label: 'Facilities and safety', description: 'Maintenance requests and the risk register.', profiles: 'all', scope: 'inst', nav: 'Operations', collections: [workorders, risks] },
  { key: 'hostel', label: 'Hostel', description: 'Rooms and allotments.', profiles: 'all', scope: 'inst', nav: 'Operations', collections: [rooms, allotments] },
  { key: 'events', label: 'Events', description: 'Events and activities.', profiles: 'all', scope: 'inst', nav: 'Operations', collections: [events] },
  { key: 'procurement', label: 'Procurement', description: 'Vendors and purchase orders.', profiles: 'all', scope: 'inst', nav: 'Operations', collections: [vendors, orders] },
  { key: 'aid', label: 'Scholarships', description: 'Scholarships and financial aid.', profiles: ['college', 'university', 'institute'], scope: 'inst', nav: 'Operations', collections: [scholarships] },
];

