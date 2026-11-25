import { useMemo, useState } from 'react';
import { usePortal } from '../../../core/context/portalContext';
import { HISTORY_KIND_LABEL } from '../../../core/org/model';
import type { HistoryEntry, HistoryKind } from '../../../core/org/model';
import { isExternal } from '../../../core/org/rules';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { PageHeader } from '../../../shared/ui/Layout';
import { useOrgData, useWorld } from '../hooks';
import { formatDateTime } from '../../../core/i18n/format';

/** What a parent organization may read about an institution that runs independently. Its internal edits stay private. */
const PARENT_VISIBLE: HistoryKind[] = ['link', 'relationship', 'agreement'];

/** ORG-16 */
export default function HistoryPage() {
  const { scope, org, inst, can, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const [kind, setKind] = useState('');
  const [instId, setInstId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const entries = useMemo(
    () =>
      world.history.filter((entry) => {
        if (scope === 'inst') return entry.instId === inst?.id;
        if (entry.orgId !== org.id) return false;
        const about = institutions.find((item) => item.id === entry.instId);
        return !(about && isExternal(about) && !PARENT_VISIBLE.includes(entry.kind));
      }),
    [world.history, scope, org.id, inst?.id, institutions],
  );
  const rows = entries.filter((entry) => (!kind || entry.kind === kind) && (!instId || entry.instId === instId) && (!from || entry.at.slice(0, 10) >= from) && (!to || entry.at.slice(0, 10) <= to));
  const nameOf = (id?: string) => (id ? institutions.find((item) => item.id === id)?.shortName ?? id : '');

  const columns: Column<HistoryEntry>[] = [
    { key: 'at', header: 'When', sortable: true, accessor: (row) => row.at, cell: (row) => formatDateTime(row.at), exportValue: (row) => row.at },
    { key: 'by', header: 'Who', sortable: true, accessor: (row) => row.byName },
    { key: 'kind', header: 'Area', sortable: true, accessor: (row) => HISTORY_KIND_LABEL[row.kind], cell: (row) => <Badge>{HISTORY_KIND_LABEL[row.kind]}</Badge> },
    { key: 'summary', header: 'What changed', accessor: (row) => row.summary, className: 'min-w-[16rem]' },
    { key: 'reason', header: 'Reason', accessor: (row) => row.reason ?? '' },
    ...(scope === 'org' ? [{ key: 'inst', header: 'Institution', sortable: true, accessor: (row: HistoryEntry) => nameOf(row.instId) } as Column<HistoryEntry>] : []),
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Change history"
        eyebrow="ORG-16"
        description={scope === 'org' ? `Every change to ${org.name}, its institutions and their links. Entries are never edited.` : `Changes to ${inst?.name}. Entries are never edited.`}
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Change history' }]}
      />
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Change history"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => `${row.summary} ${row.byName} ${row.reason ?? ''}`}
          searchPlaceholder="Search the history"
          exportName={can('institution.history.export').allowed ? `${(inst ?? org).id}-history` : undefined}
          initialSort={{ key: 'at', direction: 'desc' }}
          filters={
            <div className="flex flex-wrap items-end gap-3">
              <SelectField label="Area" hideLabel placeholder="All areas" value={kind} onChange={setKind} options={Object.entries(HISTORY_KIND_LABEL).map(([value, label]) => ({ value, label }))} />
              {scope === 'org' && (
                <SelectField
                  label="Institution"
                  hideLabel
                  placeholder="All institutions"
                  value={instId}
                  onChange={setInstId}
                  options={institutions.filter((item) => item.orgId === org.id).map((item) => ({ value: item.id, label: item.shortName }))}
                />
              )}
              <TextField label="From date" type="date" value={from} onChange={setFrom} max={to || undefined} />
              <TextField label="To date" type="date" value={to} onChange={setTo} min={from || undefined} />
            </div>
          }
          emptyTitle="No changes match"
          emptyDescription="Change the filters or the dates."
        />
      </div>
    </PageContainer>
  );
}
