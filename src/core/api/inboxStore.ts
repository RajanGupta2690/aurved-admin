import { createStore } from './persistedStore';

export type InboxKind = 'approval' | 'task' | 'notification';
export type InboxStatus = 'pending' | 'approved' | 'rejected' | 'done' | 'unread' | 'read';

export interface InboxItem {
  id: string;
  instId: string;
  kind: InboxKind;
  title: string;
  detail: string;
  from?: string;
  createdAt: string;
  due?: string;
  status: InboxStatus;
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
}

type Seed = Omit<InboxItem, 'id' | 'status'> & { status?: InboxStatus };

const SEEDS: Seed[] = [
  // Sunrise International School
  { instId: 'inst-sunrise', kind: 'approval', title: 'Leave request, 2 days', detail: 'Priya Sharma (Teacher) asks for 24 and 25 November. Substitute: Anil Mehta.', from: 'Priya Sharma', createdAt: '2026-11-17', due: '2026-11-21' },
  { instId: 'inst-sunrise', kind: 'approval', title: 'Fee concession', detail: 'Concession of 10 percent on term 2 tuition for Aarav Sharma (sibling rule). Requested by the accounts desk.', from: 'Sunita Verma', createdAt: '2026-11-18' },
  { instId: 'inst-sunrise', kind: 'approval', title: 'Record correction: spelling of a name', detail: 'Parent of Diya Patel asks to correct the spelling of the mother name. Birth certificate attached.', from: 'Parent portal', createdAt: '2026-11-16', due: '2026-11-23' },
  { instId: 'inst-sunrise', kind: 'task', title: 'Publish the term 2 timetable', detail: 'Timetable for classes 1 to 5 is ready for review.', createdAt: '2026-11-15', due: '2026-11-25' },
  { instId: 'inst-sunrise', kind: 'task', title: 'Review pending admissions', detail: 'Three applications wait for a decision.', createdAt: '2026-11-14' },
  { instId: 'inst-sunrise', kind: 'notification', title: 'Attendance not marked', detail: 'Class 1, Section A has no attendance for today.', createdAt: '2026-11-20', status: 'unread' },
  { instId: 'inst-sunrise', kind: 'notification', title: 'Fee reminders sent', detail: 'A reminder went to 42 families with dues.', createdAt: '2026-11-19', status: 'unread' },
  { instId: 'inst-sunrise', kind: 'notification', title: 'Library fine collected', detail: 'Fine collected from Class 3 student.', createdAt: '2026-11-12', status: 'read' },
  // Horizon trust branches
  { instId: 'inst-horizon-a', kind: 'approval', title: 'Budget request: science lab', detail: 'Equipment worth 3.2 lakh for the senior lab. Needs trust approval.', from: 'Principal, Delhi', createdAt: '2026-11-17' },
  { instId: 'inst-horizon-a', kind: 'notification', title: 'Trust policy updated', detail: 'Notices are now mandatory in every branch.', createdAt: '2026-11-10', status: 'unread' },
  { instId: 'inst-horizon-b', kind: 'approval', title: 'Staff leave', detail: 'Two teachers request leave for the same week. Check cover.', from: 'Branch office', createdAt: '2026-11-18' },
  { instId: 'inst-horizon-b', kind: 'task', title: 'Plan transport for next session', detail: 'Transport is not in this branch plan. Decide whether to request it.', createdAt: '2026-11-11' },
  { instId: 'inst-horizon-c', kind: 'task', title: 'Library is switched off', detail: 'The branch turned the library off. Review before the next session.', createdAt: '2026-11-09' },
  { instId: 'inst-horizon-d', kind: 'notification', title: 'Reports locked by trust', detail: 'Reports are managed centrally for this branch.', createdAt: '2026-11-08', status: 'unread' },
  // Meridian University and its colleges
  { instId: 'inst-meridian', kind: 'approval', title: 'Affiliation renewal: Kaveri Engineering College', detail: 'Renewal file received with inspection report and fee proof.', from: 'Affiliation branch', createdAt: '2026-11-16', due: '2026-12-05' },
  { instId: 'inst-meridian', kind: 'approval', title: 'New affiliation inspection: Lotus Medical College', detail: 'Inspection committee report is ready for the council.', from: 'Inspection committee', createdAt: '2026-11-18' },
  { instId: 'inst-meridian', kind: 'approval', title: 'Curriculum proposal: Hampi School of Law', detail: 'Autonomous college proposes two new electives.', from: 'Hampi School of Law', createdAt: '2026-11-13' },
  { instId: 'inst-meridian', kind: 'task', title: 'Schedule the Academic Council meeting', detail: 'Agenda items are collected.', createdAt: '2026-11-12', due: '2026-12-01' },
  { instId: 'inst-meridian', kind: 'notification', title: 'Result moderation opens on 2 December', detail: 'Colleges must submit marks before that date.', createdAt: '2026-11-19', status: 'unread' },
  { instId: 'inst-mer-eng', kind: 'task', title: 'Upload renewal documents', detail: 'The university asks for the faculty list and lab audit.', createdAt: '2026-11-17', due: '2026-11-30' },
  { instId: 'inst-mer-sci', kind: 'task', title: 'Submit internal marks', detail: 'Semester 3 internal marks are due.', createdAt: '2026-11-15', due: '2026-12-01' },
  { instId: 'inst-mer-med', kind: 'task', title: 'Prepare for inspection', detail: 'Inspection visit planned next month.', createdAt: '2026-11-14' },
  // Greenfield and Lakeside
  { instId: 'inst-greenfield', kind: 'approval', title: 'Autonomy application: documents', detail: 'Governing body asks to approve the application file.', from: 'Registrar', createdAt: '2026-11-15' },
  { instId: 'inst-greenfield', kind: 'task', title: 'Plan the semester calendar', detail: 'Draft calendar for semester 2.', createdAt: '2026-11-10' },
  { instId: 'inst-lakeside', kind: 'approval', title: 'Campus transfer request', detail: 'A faculty member asks to move from Warangal to Gachibowli.', from: 'HR desk', createdAt: '2026-11-18' },
  { instId: 'inst-lakeside', kind: 'notification', title: 'Vizag campus lab audit', detail: 'Audit report is available.', createdAt: '2026-11-17', status: 'unread' },
];

function seed(): InboxItem[] {
  return SEEDS.map((item, index) => ({
    ...item,
    id: `inb-${index + 1}`,
    status: item.status ?? (item.kind === 'approval' ? 'pending' : item.kind === 'task' ? 'pending' : 'unread'),
  }));
}

export const inboxStore = createStore<InboxItem[]>('inbox', seed, (value): value is InboxItem[] => Array.isArray(value));

export const inboxActions = {
  /** A notification for the people of one institution. Used when something happens to them elsewhere, such as a linking request. */
  notify(instId: string, title: string, detail: string) {
    inboxStore.set((items) => {
      const max = items.reduce((highest, item) => Math.max(highest, Number(item.id.replace('inb-', '')) || 0), 0);
      return [{ id: `inb-${max + 1}`, instId, kind: 'notification', title, detail, createdAt: new Date().toISOString().slice(0, 10), status: 'unread' }, ...items];
    });
  },
  decide(id: string, decision: 'approved' | 'rejected', by: string, reason?: string) {
    inboxStore.set((items) =>
      items.map((item) => (item.id === id ? { ...item, status: decision, decidedBy: by, decidedAt: new Date().toISOString(), reason: reason || undefined } : item)),
    );
  },
  complete(id: string, by: string) {
    inboxStore.set((items) => items.map((item) => (item.id === id ? { ...item, status: 'done', decidedBy: by, decidedAt: new Date().toISOString() } : item)));
  },
  reopen(id: string) {
    inboxStore.set((items) =>
      items.map((item) => (item.id === id ? { ...item, status: 'pending', decidedBy: undefined, decidedAt: undefined, reason: undefined } : item)),
    );
  },
  markRead(id: string) {
    inboxStore.set((items) => items.map((item) => (item.id === id && item.status === 'unread' ? { ...item, status: 'read' } : item)));
  },
  markAllRead(instId: string) {
    inboxStore.set((items) => items.map((item) => (item.instId === instId && item.status === 'unread' ? { ...item, status: 'read' } : item)));
  },
};

export function pendingCount(items: InboxItem[], instId: string): number {
  return items.filter((item) => item.instId === instId && (item.kind === 'approval' || item.kind === 'task') && item.status === 'pending').length;
}

export function unreadCount(items: InboxItem[], instId: string): number {
  return items.filter((item) => item.instId === instId && item.kind === 'notification' && item.status === 'unread').length;
}
