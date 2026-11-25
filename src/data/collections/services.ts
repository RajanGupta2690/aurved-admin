import type { CollectionDef, ModuleGroup } from '../../core/records/types';
import { f, flow, GRN, seed, st, SUN, sunStaff } from './helpers';

// ============================================================ digital services and records (M10)
const requests: CollectionDef = {
  key: 'requests',
  screenId: 'DS-01',
  module: 'services',
  title: 'Service requests',
  singular: 'Request',
  description: 'Certificates and documents asked for online: bonafide, transcript, transfer certificate, ID card.',
  titleField: 'applicant',
  fields: [f.text('applicant', 'Applicant', { required: true, list: true }), f.sel('kind', 'Document', ['Bonafide certificate', 'Transcript', 'Transfer certificate', 'Character certificate', 'ID card replacement'], { required: true, list: true }), f.text('purpose', 'Purpose', { required: true }), f.date('needed', 'Needed by', { list: true }), f.money('fee', 'Fee', { list: true }), f.text('number', 'Reference number', { list: true })],
  statuses: [st('submitted', 'Submitted', 'neutral'), st('processing', 'Being prepared', 'warning'), st('ready', 'Ready', 'info'), st('delivered', 'Delivered', 'success', { final: true }), st('rejected', 'Rejected', 'danger', { final: true, reason: true, needs: 'approve' })],
  initialStatus: 'submitted',
  transitions: flow(['submitted', 'processing', 'ready', 'delivered'], { submitted: ['rejected'], processing: ['rejected'] }),
  dueField: 'needed',
  actions: ['approve'],
  rules: (data) => (data.__status === 'ready' && !data.number ? 'Give the document a reference number before it is ready.' : null),
  seeds: [seed(SUN, { applicant: 'Rahul Verma, Class 8', kind: 'bonafide_certificate', purpose: 'Passport application', needed: '2026-11-28', fee: 100 }, 'processing'), seed(GRN, { applicant: 'Meera Joshi', kind: 'transcript', purpose: 'Higher studies abroad', needed: '2026-12-10', fee: 500 }, 'submitted')],
};

const corrections: CollectionDef = {
  key: 'corrections',
  screenId: 'DS-02',
  module: 'services',
  title: 'Record corrections',
  singular: 'Correction',
  description: 'A request to correct a detail in a student or staff record. Proof is checked and the change is approved before it is applied.',
  titleField: 'subject',
  fields: [f.text('subject', 'Whose record', { required: true, list: true }), f.sel('field', 'Detail', ['Name spelling', 'Date of birth', 'Parent name', 'Address', 'Contact number'], { required: true, list: true }), f.text('current', 'Currently recorded', { required: true }), f.text('requested', 'Should be', { required: true, list: true }), f.text('proof', 'Proof seen', { required: true, hint: 'For example birth certificate' })],
  statuses: [st('submitted', 'Submitted', 'neutral'), st('verified', 'Proof verified', 'info'), st('approved', 'Approved', 'success', { needs: 'approve' }), st('applied', 'Applied to the record', 'success', { final: true }), st('rejected', 'Rejected', 'danger', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'submitted',
  transitions: { submitted: ['verified', 'rejected'], verified: ['approved', 'rejected'], approved: ['applied'] },
  actions: ['approve'],
  rules: (data) => (String(data.current).trim().toLowerCase() === String(data.requested).trim().toLowerCase() ? 'The requested value is the same as the current one.' : null),
  seeds: [seed(SUN, { subject: 'Diya Patel, Class 3', field: 'parent_name', current: 'Meena Patel', requested: 'Meenakshi Patel', proof: 'Birth certificate' }, 'verified')],
};

const complaints: CollectionDef = {
  key: 'complaints',
  screenId: 'DS-03',
  module: 'services',
  title: 'Complaints',
  singular: 'Complaint',
  description: 'Complaints from students, parents and staff. A complaint can be made without giving a name. Then no name is kept or shown.',
  sensitive: 'Anonymous complaints hide the name of the person. Do not try to find out who made them.',
  titleField: 'subject',
  fields: [f.text('subject', 'Subject', { required: true, list: true }), f.sel('category', 'Category', ['Teaching', 'Bullying', 'Fees', 'Facilities', 'Staff conduct', 'Safety', 'Other'], { required: true, list: true }), f.sel('severity', 'Severity', ['Low', 'Medium', 'High'], { required: true, list: true }), f.long('details', 'What happened', { required: true }), f.bool('anonymous', 'Make this anonymous'), f.text('complainant', 'Name', { showWhen: { key: 'anonymous', equals: 'false' }, list: true }), f.date('respondBy', 'Respond by', { list: true })],
  statuses: [st('new', 'New', 'warning'), st('investigating', 'Being looked into', 'info'), st('resolved', 'Resolved', 'success', { reason: true }), st('closed', 'Closed', 'neutral', { final: true })],
  initialStatus: 'new',
  transitions: flow(['new', 'investigating', 'resolved', 'closed']),
  dueField: 'respondBy',
  rules: (data) => (data.anonymous ? null : data.complainant ? null : 'Enter a name, or make the complaint anonymous.'),
  derive: (data) => (data.anonymous ? { complainant: undefined } : {}),
  seeds: [seed(SUN, { subject: 'Bus arrives late every morning', category: 'facilities', severity: 'medium', details: 'Route A has been 20 minutes late for two weeks.', anonymous: false, complainant: 'Parent of a Class 3 student', respondBy: '2026-11-30' }, 'investigating'), seed(SUN, { subject: 'Teasing in the playground', category: 'bullying', severity: 'high', details: 'Older students tease younger ones near the swings.', anonymous: true, respondBy: '2026-11-24' }, 'new')],
};

const feedback: CollectionDef = {
  key: 'feedback',
  screenId: 'DS-04',
  module: 'services',
  title: 'Feedback',
  singular: 'Response',
  description: 'Ratings and comments from students, parents and staff about teaching, facilities and services.',
  titleField: 'topic',
  fields: [f.sel('topic', 'About', ['Teaching', 'Facilities', 'Transport', 'Canteen', 'Events', 'Communication', 'Overall'], { required: true, list: true }), f.sel('from', 'From', ['Student', 'Parent', 'Staff'], { required: true, list: true }), f.num('rating', 'Rating (1 to 5)', { required: true, min: 1, max: 5, list: true }), f.long('comment', 'Comment'), f.date('date', 'Date', { required: true, list: true })],
  rules: (data, ctx) => (String(data.date) > ctx.today ? 'The date cannot be in the future.' : null),
  seeds: [seed(SUN, { topic: 'transport', from: 'parent', rating: 2, comment: 'Late buses.', date: '2026-11-15' }), seed(SUN, { topic: 'teaching', from: 'student', rating: 5, comment: 'Mathematics lessons are clear.', date: '2026-11-16' }), seed(SUN, { topic: 'events', from: 'parent', rating: 4, date: '2026-11-17' })],
};

const credentials: CollectionDef = {
  key: 'credentials',
  screenId: 'DS-05',
  module: 'services',
  title: 'Digital credentials',
  singular: 'Credential',
  description: 'Certificates issued digitally. Anyone with the verification code can check one, and a revoked one fails the check.',
  titleField: 'holder',
  fields: [f.text('holder', 'Holder', { required: true, list: true }), f.sel('kind', 'Credential', ['Degree', 'Diploma', 'Course certificate', 'Bonafide', 'Transfer certificate', 'Achievement'], { required: true, list: true }), f.text('title', 'Title', { required: true, list: true }), f.text('code', 'Verification code', { required: true, unique: true, list: true }), f.date('issued', 'Issued on', { required: true, list: true }), f.date('expires', 'Valid until')],
  statuses: [st('issued', 'Valid', 'success'), st('revoked', 'Revoked', 'danger', { final: true, reason: true, needs: 'approve' })],
  initialStatus: 'issued',
  transitions: { issued: ['revoked'] },
  actions: ['approve'],
  rules: (data) => (data.expires && String(data.expires) < String(data.issued) ? 'It cannot expire before it is issued.' : null),
  seeds: [seed(GRN, { holder: 'Aisha Rahman', kind: 'course_certificate', title: 'Data analysis with Python', code: 'GC-CERT-2026-0042', issued: '2026-09-30' }, 'issued'), seed(SUN, { holder: 'Rahul Verma', kind: 'achievement', title: 'District science fair, first prize', code: 'SUN-ACH-2026-0007', issued: '2026-10-05' }, 'issued')],
};

const identity: CollectionDef = {
  key: 'identity',
  screenId: 'DS-06',
  module: 'services',
  title: 'Verified identity',
  singular: 'Verification',
  description: 'Identity of students and staff checked against a document. Only the last four digits of a number are kept.',
  sensitive: 'Never store the full number of an identity document.',
  titleField: 'person',
  fields: [f.text('person', 'Person', { required: true, list: true }), f.sel('document', 'Document', ['Aadhaar', 'Passport', 'Driving licence', 'Voter ID', 'School ID'], { required: true, list: true }), f.text('last4', 'Last four digits', { required: true, hint: 'Only four digits.' }), f.staff('checkedBy', 'Checked by', { required: true, list: true }), f.date('date', 'Checked on', { required: true, list: true })],
  statuses: [st('pending', 'Pending', 'warning'), st('verified', 'Verified', 'success'), st('mismatch', 'Does not match', 'danger', { reason: true })],
  initialStatus: 'pending',
  transitions: { pending: ['verified', 'mismatch'], mismatch: ['pending'] },
  rules: (data) => (/^\d{4}$/.test(String(data.last4)) ? null : 'Enter exactly four digits. The full number is not kept.'),
  seeds: [seed(SUN, { person: 'Priya Sharma (staff)', document: 'aadhaar', last4: '4821', checkedBy: sunStaff(2), date: '2026-08-12' }, 'verified')],
};

// ============================================================ privacy and integrations (M11)
const consents: CollectionDef = {
  key: 'consents',
  screenId: 'PR-01',
  module: 'privacy',
  title: 'Consent register',
  singular: 'Consent',
  description: 'What each person has agreed to: photos, sharing with partners, communication. A withdrawn consent is kept as withdrawn.',
  titleField: 'person',
  fields: [f.text('person', 'Person', { required: true, list: true }), f.sel('purpose', 'Purpose', ['Photos and videos', 'Share data with the university', 'Marketing messages', 'Research use of data', 'Alumni contact'], { required: true, list: true }), f.date('given', 'Given on', { required: true, list: true }), f.text('how', 'How it was given', { required: true }), f.text('guardian', 'Guardian who agreed for a child')],
  statuses: [st('active', 'Given', 'success'), st('withdrawn', 'Withdrawn', 'neutral', { final: true, reason: true })],
  initialStatus: 'active',
  transitions: { active: ['withdrawn'] },
  seeds: [seed(SUN, { person: 'Aarav Sharma, Class 5', purpose: 'photos_and_videos', given: '2026-06-10', how: 'Admission form', guardian: 'Rakesh Sharma' }, 'active')],
};

const dataRequests: CollectionDef = {
  key: 'datarequests',
  screenId: 'PR-02',
  module: 'privacy',
  title: 'Data requests',
  singular: 'Request',
  description: 'A person asks to see, correct, move or erase their data. A reply is due within 30 days.',
  sensitive: 'Check the identity of the person before sending any data.',
  titleField: 'person',
  fields: [f.text('person', 'Person', { required: true, list: true }), f.sel('kind', 'Request', ['Copy of my data', 'Correction', 'Erasure', 'Restrict use', 'Move my data'], { required: true, list: true }), f.date('received', 'Received on', { required: true, list: true }), f.date('due', 'Reply by', { computed: true, list: true }), f.long('details', 'Details')],
  statuses: [st('received', 'Received', 'warning'), st('verified', 'Identity checked', 'info'), st('done', 'Completed', 'success', { final: true, needs: 'approve' }), st('refused', 'Refused', 'danger', { final: true, needs: 'approve', reason: true })],
  initialStatus: 'received',
  transitions: { received: ['verified', 'refused'], verified: ['done', 'refused'] },
  dueField: 'due',
  actions: ['approve'],
  derive: (data) => ({ due: new Date(Date.parse(String(data.received)) + 30 * 86_400_000).toISOString().slice(0, 10) }),
  rules: (data, ctx) => (String(data.received) > ctx.today ? 'The date cannot be in the future.' : null),
  seeds: [seed(SUN, { person: 'Savita Sharma', kind: 'copy_of_my_data', received: '2026-11-10', details: 'Wants everything held about her son.' }, 'received')],
};

const integrations: CollectionDef = {
  key: 'integrations',
  screenId: 'IN-01',
  module: 'integrations',
  title: 'Integrations',
  singular: 'Integration',
  description: 'Connections to other systems. These are settings records in this demo. They are not connected to a live service yet.',
  titleField: 'name',
  fields: [f.text('name', 'Name', { required: true, unique: true, list: true }), f.sel('kind', 'Kind', ['Payment gateway', 'SMS gateway', 'Email service', 'Learning platform', 'Government portal', 'Accounting software', 'Single sign-on'], { required: true, list: true }), f.text('endpoint', 'Address', { required: true, hint: 'Starts with https://' }), f.text('owner', 'Owner', { required: true, list: true }), f.date('reviewed', 'Last reviewed', { list: true })],
  statuses: [st('planned', 'Planned', 'neutral'), st('active', 'Active', 'success'), st('paused', 'Paused', 'warning', { reason: true }), st('retired', 'Retired', 'neutral', { final: true, reason: true })],
  initialStatus: 'planned',
  transitions: { planned: ['active', 'retired'], active: ['paused', 'retired'], paused: ['active', 'retired'] },
  rules: (data) => (/^https:\/\/\S+\.\S+/.test(String(data.endpoint)) ? null : 'The address must start with https://'),
  seeds: [seed(SUN, { name: 'Razorpay payments', kind: 'payment_gateway', endpoint: 'https://api.razorpay.example/v1', owner: 'Accounts office', reviewed: '2026-10-01' }, 'planned')],
};

export const SERVICE_MODULES: ModuleGroup[] = [
  { key: 'services', label: 'Digital services', description: 'Requests, corrections, complaints, feedback, credentials and verified identity.', profiles: 'all', scope: 'inst', nav: 'Insights', collections: [requests, corrections, complaints, feedback, credentials, identity] },
  { key: 'privacy', label: 'Privacy', description: 'Consent register and data requests.', profiles: 'all', scope: 'inst', nav: 'Administration', collections: [consents, dataRequests] },
  { key: 'integrations', label: 'Integrations', description: 'Connections to other systems.', profiles: 'all', scope: 'inst', nav: 'Administration', collections: [integrations] },
];
