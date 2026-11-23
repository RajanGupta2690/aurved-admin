import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { calendarActions, calendarStore, EVENT_KIND_LABEL } from '../../../core/api/calendarStore';
import type { CalendarEvent, EventKind } from '../../../core/api/calendarStore';
import { useStore } from '../../../core/api/persistedStore';
import { usePortal } from '../../../core/context/portalContext';
import { useCoveredInstitutionIds } from '../../../shared/layout/hooks';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import type { Tone } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useToast } from '../../../shared/ui/toastContext';
import { useForm } from '../../../shared/ui/useForm';
import { required } from '../../../shared/ui/validators';

const KIND_TONE: Record<EventKind, Tone> = { holiday: 'success', exam: 'danger', meeting: 'info', event: 'brand', deadline: 'warning' };
const iso = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const KIND_OPTIONS = (Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((kind) => ({ value: kind, label: EVENT_KIND_LABEL[kind] }));

export default function CalendarPage() {
  const { inst, can, institutions } = usePortal();
  const toast = useToast();
  const events = useStore(calendarStore);
  const ids = useCoveredInstitutionIds();
  const [today] = useState(() => new Date());
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<string>(iso(today.getFullYear(), today.getMonth(), today.getDate()));
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<CalendarEvent | null>(null);

  const mayCreate = can('calendar.events.create').allowed;
  const mayArchive = can('calendar.events.archive').allowed;
  const targetInst = inst?.id ?? ids[0];

  const form = useForm({ title: '', date: selected, kind: 'event' as string }, { title: required('Give the event a title.'), date: required('Choose a date.') });

  const visible = useMemo(() => events.filter((event) => ids.includes(event.instId)), [events, ids]);
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    visible.forEach((event) => map.set(event.date, [...(map.get(event.date) ?? []), event]));
    return map;
  }, [visible]);

  const first = new Date(cursor.year, cursor.month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(first);
  const dayEvents = byDate.get(selected) ?? [];
  const shift = (delta: number) => setCursor((previous) => {
    const next = new Date(previous.year, previous.month + delta, 1);
    return { year: next.getFullYear(), month: next.getMonth() };
  });

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description={ids.length > 1 ? 'Dates of every institution in this organization.' : 'Holidays, exams, meetings and deadlines.'}
        eyebrow="SH-06"
        actions={
          <Button
            variant="primary"
            icon={<Plus size={18} aria-hidden="true" />}
            disabled={!mayCreate}
            title={mayCreate ? undefined : 'Your role can view the calendar but not add events.'}
            onClick={() => {
              form.reset({ title: '', date: selected, kind: 'event' });
              setAdding(true);
            }}
          >
            Add event
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-warm-200 p-3">
            <h2 className="text-lg font-semibold text-charcoal-950" aria-live="polite">
              {monthLabel}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" aria-label="Previous month" onClick={() => shift(-1)} icon={<ChevronLeft size={16} aria-hidden="true" />} />
              <Button size="sm" onClick={() => { setCursor({ year: today.getFullYear(), month: today.getMonth() }); setSelected(iso(today.getFullYear(), today.getMonth(), today.getDate())); }}>
                Today
              </Button>
              <Button size="sm" aria-label="Next month" onClick={() => shift(1)} icon={<ChevronRight size={16} aria-hidden="true" />} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] table-fixed">
              <caption className="sr-only">{monthLabel}. Choose a day to see its events.</caption>
              <thead>
                <tr>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <th key={day} scope="col" className="border-b border-warm-200 py-2 text-xs font-semibold uppercase text-charcoal-600">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, index) => (
                  <tr key={index}>
                    {week.map((day, column) => {
                      if (day === null) return <td key={column} className="h-20 border border-warm-100 bg-warm-50/60" />;
                      const date = iso(cursor.year, cursor.month, day);
                      const list = byDate.get(date) ?? [];
                      const isSelected = date === selected;
                      const isToday = date === iso(today.getFullYear(), today.getMonth(), today.getDate());
                      return (
                        <td key={column} className="h-20 border border-warm-100 p-0 align-top">
                          <button
                            type="button"
                            onClick={() => setSelected(date)}
                            aria-pressed={isSelected}
                            aria-label={`${new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date(cursor.year, cursor.month, day))}, ${list.length === 0 ? 'no events' : `${list.length} ${list.length === 1 ? 'event' : 'events'}`}`}
                            className={`flex h-full w-full flex-col items-start gap-1 p-1.5 text-left hover:bg-warm-50 ${isSelected ? 'bg-primary-50 ring-2 ring-inset ring-primary-700' : ''}`}
                          >
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${isToday ? 'bg-primary-700 font-semibold text-white' : 'text-charcoal-800'}`}>{day}</span>
                            {list.slice(0, 2).map((event) => (
                              <span key={event.id} className="w-full truncate rounded bg-warm-100 px-1 text-[11px] text-charcoal-800">
                                {event.title}
                              </span>
                            ))}
                            {list.length > 2 && <span className="text-[11px] text-charcoal-600">+{list.length - 2} more</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date(`${selected}T00:00:00`))} description={dayEvents.length === 0 ? 'Nothing planned.' : `${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`}>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-charcoal-600">Pick another day, or add an event for this date.</p>
          ) : (
            <ul className="space-y-3">
              {dayEvents.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal-900">{event.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={KIND_TONE[event.kind]}>{EVENT_KIND_LABEL[event.kind]}</Badge>
                      {ids.length > 1 && <span className="text-xs text-charcoal-600">{institutions.find((candidate) => candidate.id === event.instId)?.shortName}</span>}
                    </div>
                  </div>
                  {event.custom && mayArchive && (
                    <Button size="sm" variant="ghost" aria-label={`Remove ${event.title}`} onClick={() => setRemoving(event)} icon={<Trash2 size={16} aria-hidden="true" />} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add event"
        size="sm"
        footer={
          <>
            <Button onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="event-form">
              Add event
            </Button>
          </>
        }
      >
        <form
          id="event-form"
          noValidate
          onSubmit={form.handleSubmit((values) => {
            calendarActions.add(targetInst, { title: values.title.trim(), date: values.date, kind: values.kind as EventKind });
            setSelected(values.date);
            const [year, month] = values.date.split('-').map(Number);
            setCursor({ year, month: month - 1 });
            setAdding(false);
            toast.success(`Added: ${values.title.trim()}`);
          })}
          className="space-y-4"
        >
          <TextField label="Title" required autoFocus {...form.bind('title')} />
          <TextField label="Date" type="date" required {...form.bind('date')} />
          <SelectField label="Type" options={KIND_OPTIONS} {...form.bind('kind')} />
        </form>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove event"
        message="Only events added by people can be removed. Holidays and exams set by the system stay."
        itemName={removing?.title}
        confirmLabel="Remove event"
        onConfirm={() => {
          if (!removing) return;
          calendarActions.remove(removing.id);
          toast.success(`Removed: ${removing.title}`);
        }}
      />
    </PageContainer>
  );
}
