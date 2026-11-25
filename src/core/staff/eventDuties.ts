import type { Actor, Snapshot } from '../org/model';
import { nextId } from '../org/rules';

/**
 * Called when an event is held or cancelled: the jobs at that event end with it.
 * Kept apart from the other staff changes so the Events collection can use it without a circular import.
 */
export function endEventDuties(snap: Snapshot, eventId: string, why: string, actor: Actor, now: string): Snapshot {
  const open = snap.staff.duties.filter((duty) => duty.eventId === eventId && duty.status === 'active');
  if (open.length === 0) return snap;
  const today = now.slice(0, 10);
  const ended = new Set(open.map((duty) => duty.id));
  const duties = snap.staff.duties.map((duty) => (ended.has(duty.id) ? { ...duty, status: 'ended' as const, to: duty.to && duty.to < today ? duty.to : today } : duty));
  let events = snap.staff.events;
  open.forEach((duty) => {
    const id = nextId('stf-ev', events.map((event) => event.id));
    events = [{ id, at: now, instId: duty.instId, staffId: duty.staffId, byName: actor.name, summary: `The duty "${duty.title}" for ${duty.eventTitle} ended because the event ${why}.` }, ...events].slice(0, 2000);
  });
  return { ...snap, staff: { ...snap.staff, duties, events } };
}
