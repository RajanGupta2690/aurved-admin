import { useState } from 'react';
import { usePortal } from '../../../core/context/portalContext';
import { HISTORY_KIND_LABEL } from '../../../core/org/model';
import type { HistoryKind } from '../../../core/org/model';
import { isExternal } from '../../../core/org/rules';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { PageHeader } from '../../../shared/ui/Layout';
import { useOrgData, useWorld } from '../../organization/hooks';
import { formatDateTime } from '../../../core/i18n/format';

/** Changes that matter for security. Everything else is in the change history. */
const AUDIT_KINDS: HistoryKind[] = ['role', 'feature', 'policy', 'agreement', 'link', 'relationship'];
const PARENT_VISIBLE: HistoryKind[] = ['link', 'relationship', 'agreement'];

interface Row {
  id: string;
  at: string;
  byName: string;
  type: string;
  summary: string;
  reason: string;
  where: string;
}

/** ACC-13. Who changed access, and who was turned away. */
export default function AuditPage() {
  const { scope, org, inst, can, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const nameOf = (id?: string) => (id ? institutions.find((item) => item.id === id)?.shortName ?? id : org.name);
  const hiddenFromParent = (instId?: string) => {
    const about = institutions.find((item) => item.id === instId);
    return Boolean(about && isExternal(about));
  };

  const changes: Row[] = world.history
    .filter((entry) => AUDIT_KINDS.includes(entry.kind))
    .filter((entry) => (scope === 'inst' ? entry.instId === inst?.id || (!entry.instId && entry.orgId === org.id) : entry.orgId === org.id && !(hiddenFromParent(entry.instId) && !PARENT_VISIBLE.includes(entry.kind))))
    .map((entry) => ({ id: entry.id, at: entry.at, byName: entry.byName, type: HISTORY_KIND_LABEL[entry.kind], summary: entry.summary, reason: entry.reason ?? '', where: nameOf(entry.instId) }));
  const refusals: Row[] = world.audit
    .filter((event) => (scope === 'inst' ? event.instId === inst?.id : event.orgId === org.id && !hiddenFromParent(event.instId)))
    .map((event) => ({ id: event.id, at: event.at, byName: event.byName, type: 'Access refused', summary: event.detail, reason: '', where: nameOf(event.instId) }));
  const all = [...changes, ...refusals];
  const types = Array.from(new Set(all.map((row) => row.type)));
  const rows = all.filter((row) => (!type || row.type === type) && (!from || row.at.slice(0, 10) >= from) && (!to || row.at.slice(0, 10) <= to));

  const columns: Column<Row>[] = [
    { key: 'at', header: 'When', sortable: true, accessor: (row) => row.at, cell: (row) => formatDateTime(row.at), exportValue: (row) => row.at },
    { key: 'by', header: 'Who', sortable: true, accessor: (row) => row.byName },
    { key: 'type', header: 'Event', sortable: true, accessor: (row) => row.type, cell: (row) => <Badge tone={row.type === 'Access refused' ? 'danger' : 'neutral'}>{row.type}</Badge> },
    { key: 'summary', header: 'What happened', accessor: (row) => row.summary, className: 'min-w-[16rem]' },
    { key: 'reason', header: 'Reason', accessor: (row) => row.reason },
    { key: 'where', header: 'Where', sortable: true, accessor: (row) => row.where },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Audit log"
        eyebrow="ACC-13"
        description="Changes to roles, features, policy, sharing and links, and every time someone was refused a screen. Entries cannot be edited or removed."
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Audit log' }]}
      />
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Audit log"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => `${row.summary} ${row.byName} ${row.reason} ${row.where}`}
          searchPlaceholder="Search the audit log"
          exportName={can('access.audit.export').allowed ? `${(inst ?? org).id}-audit` : undefined}
          initialSort={{ key: 'at', direction: 'desc' }}
          filters={
            <div className="flex flex-wrap items-end gap-3">
              <SelectField label="Event" hideLabel placeholder="All events" value={type} onChange={setType} options={types.map((value) => ({ value, label: value }))} />
              <TextField label="From date" type="date" value={from} onChange={setFrom} max={to || undefined} />
              <TextField label="To date" type="date" value={to} onChange={setTo} min={from || undefined} />
            </div>
          }
          emptyTitle="No events match"
          emptyDescription="Change the filters or the dates."
        />
      </div>
    </PageContainer>
  );
}
