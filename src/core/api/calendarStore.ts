import { createStore } from './persistedStore';

export type EventKind = 'holiday' | 'exam' | 'meeting' | 'event' | 'deadline';

export interface CalendarEvent {
  id: string;
  instId: string;
  title: string;
  /** yyyy-mm-dd */
  date: string;
  kind: EventKind;
  /** Added by a person, so it can be removed. Seed events are fixed. */
  custom: boolean;
}

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  holiday: 'Holiday',
  exam: 'Exam',
  meeting: 'Meeting',
  event: 'Event',
  deadline: 'Deadline',
};

const COMMON: Array<Omit<CalendarEvent, 'id' | 'instId' | 'custom'>> = [
  { title: 'Winter break begins', date: '2026-12-24', kind: 'holiday' },
  { title: 'Staff meeting', date: '2026-11-26', kind: 'meeting' },
  { title: 'Term results deadline', date: '2026-12-18', kind: 'deadline' },
  { title: 'Annual day', date: '2026-12-12', kind: 'event' },
  { title: 'Term 2 examinations start', date: '2026-12-02', kind: 'exam' },
];

const INSTITUTION_IDS = [
  'inst-sunrise', 'inst-greenfield', 'inst-horizon-a', 'inst-horizon-b', 'inst-horizon-c', 'inst-horizon-d',
  'inst-meridian', 'inst-mer-sci', 'inst-mer-arts', 'inst-mer-eng', 'inst-mer-med', 'inst-mer-law', 'inst-mer-ptr', 'inst-lakeside',
];

function seed(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  INSTITUTION_IDS.forEach((instId) => {
    COMMON.forEach((event, index) => events.push({ ...event, id: `cal-${instId}-${index}`, instId, custom: false }));
  });
  events.push({ id: 'cal-sunrise-pt', instId: 'inst-sunrise', title: 'Parent-teacher meeting', date: '2026-11-28', kind: 'meeting', custom: false });
  events.push({ id: 'cal-mer-council', instId: 'inst-meridian', title: 'Academic Council', date: '2026-12-04', kind: 'meeting', custom: false });
  return events;
}

export const calendarStore = createStore<CalendarEvent[]>('calendar', seed, (value): value is CalendarEvent[] => Array.isArray(value));

let counter = 0;
export const calendarActions = {
  add(instId: string, event: { title: string; date: string; kind: EventKind }) {
    counter += 1;
    const id = `cal-custom-${Date.now()}-${counter}`;
    calendarStore.set((items) => [...items, { ...event, id, instId, custom: true }]);
  },
  remove(id: string) {
    calendarStore.set((items) => items.filter((item) => !(item.id === id && item.custom)));
  },
};
