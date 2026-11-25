import { useState } from 'react';
import { CalendarCheck, Plus } from 'lucide-react';
import { snapshot } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import { formatDate } from '../../../core/org/rules';
import type { Duty } from '../../../core/staff/model';
import { endDuty, openEventsOf } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { useApply } from '../../organization/hooks';
import DutyDialog from '../components/DutyDialog';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

/** STF-17. Ongoing duties and jobs at events. */
export default function StaffDutiesPage() {
  const { can, path } = usePortal();
  const { inst, state, nameOf } = useInstStaff();
  const apply = useApply();
  const [tab, setTab] = useState('all');
  const [dialog, setDialog] = useState<{ kind: 'standing' | 'event'; eventId?: string } | null>(null);
  const [error, setError] = useState('');
  const canCreate = can('staff.duties.create').allowed;
  const canEnd = can('staff.duties.archive').allowed;
  const rows = state.duties.filter((duty) => duty.instId === inst.id);
  const eventDuties = rows.filter((duty) => duty.eventId);
  const openEvents = openEventsOf(snapshot(), inst.id).sort((a, b) => String(a.data.date).localeCompare(String(b.data.date)));

  const end = (row: Duty) => {
    const result = apply((snap, now, actor) => endDuty(snap, row.id, actor, now), 'Duty ended.');
    setError(result.ok ? '' : result.error);
  };

  const endButton = (row: Duty) =>
    row.status === 'active' ? (
      <Button size="sm" disabled={!canEnd} onClick={() => end(row)} aria-label={`End the duty ${row.title} of ${nameOf(row.staffId)}`}>
        End
      </Button>
    ) : null;

  const columns: Column<Duty>[] = [
    {
      key: 'title',
      header: 'Duty',
      sortable: true,
      accessor: (row) => row.title,
      cell: (row) => (
        <div>
          <p className="font-medium text-charcoal-900">{row.title}</p>
          {row.note && <p className="text-xs text-charcoal-600">{row.note}</p>}
        </div>
      ),
    },
    { key: 'event', header: 'Event', sortable: true, accessor: (row) => row.eventTitle ?? '', cell: (row) => (row.eventTitle ? <Badge tone="info">{row.eventTitle}</Badge> : <span className="text-charcoal-600">Ongoing</span>) },
    { key: 'who', header: 'Person', sortable: true, accessor: (row) => nameOf(row.staffId) },
    { key: 'from', header: 'From', sortable: true, accessor: (row) => row.from, cell: (row) => formatDate(row.from) },
    { key: 'to', header: 'Until', sortable: true, accessor: (row) => row.to ?? '', cell: (row) => (row.to ? formatDate(row.to) : 'No end date') },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status === 'active' ? 'active' : 'closed'} label={row.status} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Additional duties"
        eyebrow="STF-17"
        description="Duties on top of the job: class teacher, exam coordinator, in-charge roles, and jobs at events. A duty ends when the person leaves, and a job at an event ends when the event is held or cancelled."
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Duties' }]}
        actions={
          <>
            <Button icon={<CalendarCheck size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => setDialog({ kind: 'event' })}>
              Add event duty
            </Button>
            <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => setDialog({ kind: 'standing' })}>
              Add duty
            </Button>
          </>
        }
      />
      <StaffNav />
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <Tabs
        label="Duty views"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'all', label: 'All duties', badge: rows.filter((row) => row.status === 'active').length },
          { id: 'events', label: 'By event', badge: openEvents.length },
        ]}
      />
      <TabPanel id="all" value={tab}>
        <div className="card !p-0 overflow-hidden">
          <DataTable caption="Additional duties" rows={rows} columns={columns} rowKey={(row) => row.id} searchText={(row) => `${row.title} ${row.eventTitle ?? ''} ${nameOf(row.staffId)} ${row.note ?? ''}`} searchPlaceholder="Search duties" initialSort={{ key: 'from', direction: 'desc' }} rowActions={endButton} emptyTitle="No duties" />
        </div>
      </TabPanel>
      <TabPanel id="events" value={tab}>
        {openEvents.length === 0 ? (
          <EmptyState title="No open events" description="Events that are proposed or approved in the Events module appear here, with the people who have a job at each." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {openEvents.map((event) => {
              const jobs = eventDuties.filter((duty) => duty.eventId === event.id && duty.status === 'active');
              return (
                <Card key={event.id} title={String(event.data.title)} description={`${formatDate(String(event.data.date))}${event.status ? `, ${event.status}` : ''}`} actions={<Button size="sm" disabled={!canCreate} onClick={() => setDialog({ kind: 'event', eventId: event.id })} aria-label={`Assign someone to ${String(event.data.title)}`}>Assign</Button>}>
                  {jobs.length === 0 ? (
                    <p className="text-sm text-charcoal-600">Nobody is assigned yet.</p>
                  ) : (
                    <ul className="divide-y divide-warm-200 text-sm">
                      {jobs.map((duty) => (
                        <li key={duty.id} className="flex items-center justify-between gap-3 py-2">
                          <span>
                            <span className="font-medium text-charcoal-900">{nameOf(duty.staffId)}</span>
                            <span className="text-charcoal-700">, {duty.title}</span>
                            {duty.note && <span className="block text-xs text-charcoal-600">{duty.note}</span>}
                          </span>
                          {endButton(duty)}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </TabPanel>
      <DutyDialog open={dialog !== null} onClose={() => setDialog(null)} initialKind={dialog?.kind} eventId={dialog?.eventId} />
    </PageContainer>
  );
}
