import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import { usePortal } from '../../core/context/portalContext';
import { formatDate } from '../../core/org/rules';
import { displayValue, featureKeyOf, isOverdue, setArchived, setStatus } from '../../core/records/ops';
import { collectionByKey, RECORD_MODULES } from '../../core/records/registry';
import type { CollectionDef, ModuleGroup, RecordRow } from '../../core/records/types';
import PageContainer from '../../shared/layout/PageContainer';
import { Badge } from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
import DataTable from '../../shared/ui/DataTable';
import type { Column } from '../../shared/ui/DataTable';
import { CheckboxField, SelectField } from '../../shared/ui/Field';
import { Alert, EmptyState } from '../../shared/ui/Feedback';
import { DescriptionList, PageHeader, Timeline } from '../../shared/ui/Layout';
import { Drawer } from '../../shared/ui/Overlay';
import { useApply } from '../organization/hooks';
import { useNames, useRows, useScopeId } from './hooks';
import RecordForm from './RecordForm';

const TONE = { success: 'success', warning: 'warning', danger: 'danger', info: 'info', neutral: 'neutral', brand: 'brand' } as const;

/** One kind of record: list, add, change, move through its statuses, archive. Used by every collection. */
export default function CollectionPage({ moduleKey, collectionKey }: { moduleKey: string; collectionKey: string }) {
  const module = RECORD_MODULES.find((item) => item.key === moduleKey);
  const def = collectionByKey(collectionKey);
  if (!module || !def) return <EmptyState title="Not found" />;
  return <Collection module={module} def={def} />;
}

function Collection({ module, def }: { module: ModuleGroup; def: CollectionDef }) {
  const { can, path, inst, org } = usePortal();
  const scopeId = useScopeId(module);
  const { staffName, instName } = useNames();
  const apply = useApply();
  const [showArchived, setShowArchived] = useState(false);
  const [status, setStatusFilter] = useState('');
  const [form, setForm] = useState<{ row?: RecordRow } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ row: RecordRow; to: string } | null>(null);
  const [archiving, setArchiving] = useState<RecordRow | null>(null);
  const [error, setError] = useState('');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const all = useRows(def, scopeId, true);
  const rows = all.filter((row) => (showArchived || !row.archived) && (!status || row.status === status));
  const feature = featureKeyOf(def);
  const open = all.find((row) => row.id === openId) ?? null;
  const canCreate = can(`${feature}.create`).allowed;
  const canEdit = can(`${feature}.edit`).allowed;
  const canArchive = can(`${feature}.archive`).allowed;
  const statusOf = (value?: string) => def.statuses?.find((item) => item.value === value);
  const show = (field: (typeof def.fields)[number], data: Record<string, unknown>) => displayValue(def, field, data, staffName, instName);

  const columns: Column<RecordRow>[] = [
    ...def.fields
      .filter((field) => field.list)
      .map(
        (field, index): Column<RecordRow> => ({
          key: field.key,
          header: field.label,
          sortable: true,
          align: field.type === 'number' ? 'right' : 'left',
          accessor: (row) => show(field, row.data),
          sortValue: (row) => (field.type === 'number' ? Number(row.data[field.key] ?? 0) : show(field, row.data)),
          cell: (row) => (index === 0 ? <button type="button" onClick={() => setOpenId(row.id)} className="text-left font-medium text-primary-700 hover:underline">{show(field, row.data) || '(empty)'}</button> : <span>{show(field, row.data)}</span>),
        }),
      ),
    ...(def.statuses
      ? [
          {
            key: '__status',
            header: 'Status',
            sortable: true,
            accessor: (row: RecordRow) => statusOf(row.status)?.label ?? '',
            cell: (row: RecordRow) => (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <Badge tone={TONE[statusOf(row.status)?.tone ?? 'neutral']}>{statusOf(row.status)?.label ?? row.status}</Badge>
                {isOverdue(def, row, today) && <Badge tone="danger">Overdue</Badge>}
                {row.archived && <Badge>Archived</Badge>}
              </span>
            ),
          } as Column<RecordRow>,
        ]
      : [{ key: '__arch', header: 'State', accessor: (row: RecordRow) => (row.archived ? 'Archived' : ''), cell: (row: RecordRow) => (row.archived ? <Badge>Archived</Badge> : isOverdue(def, row, today) ? <Badge tone="danger">Overdue</Badge> : null) } as Column<RecordRow>]),
  ];

  const move = (row: RecordRow, to: string, reason?: string) => {
    const result = apply((snap, now, actor) => setStatus(snap, def, row.id, to, actor, now, reason), `${statusOf(to)?.label ?? to}.`);
    setError(result.ok ? '' : result.error);
  };

  const nexts = (row: RecordRow) => (def.transitions?.[row.status ?? ''] ?? []).map((value) => ({ value, def: statusOf(value)! })).filter((item) => item.def);

  return (
    <PageContainer>
      <PageHeader
        title={def.title}
        eyebrow={def.screenId}
        description={def.description}
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: module.label, to: path(module.key) }, { label: def.title }]}
        actions={
          <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => setForm({})} title={canCreate ? undefined : 'Your role cannot add records here'}>
            New {def.singular.toLowerCase()}
          </Button>
        }
      />
      {def.sensitive && (
        <Alert tone="warning" title="Sensitive information" className="mb-4">
          {def.sensitive}
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption={def.title}
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => def.fields.map((field) => show(field, row.data)).join(' ')}
          searchPlaceholder={`Search ${def.title.toLowerCase()}`}
          exportName={can(`${feature}.export`).allowed ? `${scopeId}-${def.key}` : undefined}
          initialSort={{ key: columns[0]?.key ?? '', direction: 'asc' }}
          filters={
            <div className="flex flex-wrap items-end gap-3">
              {def.statuses && <SelectField label="Status" hideLabel placeholder="Every status" value={status} onChange={setStatusFilter} options={def.statuses.map((item) => ({ value: item.value, label: item.label }))} />}
              <CheckboxField label="Show archived" checked={showArchived} onChange={setShowArchived} />
            </div>
          }
          emptyTitle={`No ${def.title.toLowerCase()} yet`}
          emptyDescription={canCreate ? `Add the first ${def.singular.toLowerCase()}.` : 'Nothing has been recorded.'}
        />
      </div>

      {form && <RecordForm key={form.row?.id ?? 'new'} def={def} scopeId={scopeId} row={form.row} open onClose={() => setForm(null)} onSaved={(id) => !form.row && setOpenId(id)} />}

      <Drawer open={open !== null} onClose={() => setOpenId(null)} title={open ? String(open.data[def.titleField] ?? def.singular) : ''} description={def.singular} size="md">
        {open && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {def.statuses && <Badge tone={TONE[statusOf(open.status)?.tone ?? 'neutral']}>{statusOf(open.status)?.label}</Badge>}
              {isOverdue(def, open, today) && <Badge tone="danger">Overdue</Badge>}
              {open.archived && <Badge>Archived</Badge>}
            </div>
            {def.statuses && !open.archived && (
              <section aria-label="Next steps" className="flex flex-wrap gap-2">
                {nexts(open).length === 0 ? (
                  <p className="text-sm text-charcoal-600">{statusOf(open.status)?.final ? 'This record is closed.' : 'No further step.'}</p>
                ) : (
                  nexts(open).map((item) => {
                    const allowed = can(`${feature}.${item.def.needs ?? 'edit'}`).allowed;
                    return (
                      <Button
                        key={item.value}
                        variant={item.def.tone === 'danger' ? 'danger' : 'secondary'}
                        disabled={!allowed}
                        title={allowed ? undefined : `Your role cannot move a record to "${item.def.label}".`}
                        onClick={() => (item.def.reason ? setPending({ row: open, to: item.value }) : move(open, item.value))}
                      >
                        {item.def.label}
                      </Button>
                    );
                  })
                )}
              </section>
            )}
            <DescriptionList
              columns={1}
              items={def.fields
                .filter((field) => !(field.showWhen && String(open.data[field.showWhen.key] ?? 'false') !== field.showWhen.equals))
                .map((field) => ({ label: field.label, value: show(field, open.data) || undefined }))}
            />
            <div className="flex flex-wrap gap-2">
              <Button icon={<Pencil size={14} aria-hidden="true" />} disabled={!canEdit || open.archived || Boolean(statusOf(open.status)?.final)} onClick={() => setForm({ row: open })}>
                Edit
              </Button>
              {open.archived ? (
                <Button icon={<ArchiveRestore size={14} aria-hidden="true" />} disabled={!canArchive} onClick={() => { const r = apply((snap, now, actor) => setArchived(snap, def, open.id, false, actor, now), 'Restored.'); setError(r.ok ? '' : r.error); }}>
                  Restore
                </Button>
              ) : (
                <Button icon={<Archive size={14} aria-hidden="true" />} disabled={!canArchive} onClick={() => setArchiving(open)}>
                  Archive
                </Button>
              )}
            </div>
            <section aria-labelledby="record-history">
              <h3 id="record-history" className="mb-2 font-semibold text-charcoal-950">
                History
              </h3>
              <Timeline items={[...open.history].reverse().map((event, index) => ({ id: `${index}`, title: event.summary, meta: `${event.by} · ${formatDate(event.at)}`, description: event.reason }))} />
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={(reason) => pending && move(pending.row, pending.to, reason)}
        title={`Move to "${pending ? statusOf(pending.to)?.label : ''}"`}
        message="Say why. The reason is kept in the history of the record."
        itemName={pending ? String(pending.row.data[def.titleField] ?? '') : undefined}
        confirmLabel="Confirm"
        tone={pending && statusOf(pending.to)?.tone === 'danger' ? 'danger' : 'primary'}
        requireReason
      />
      <ConfirmDialog
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={(reason) => {
          if (!archiving) return;
          const result = apply((snap, now, actor) => setArchived(snap, def, archiving.id, true, actor, now, reason), 'Archived.');
          setError(result.ok ? '' : result.error);
        }}
        title={`Archive ${def.singular.toLowerCase()}`}
        message="It is hidden from the list but kept, and can be restored."
        itemName={archiving ? String(archiving.data[def.titleField] ?? '') : undefined}
        confirmLabel="Archive"
        requireReason
      />
      <p className="mt-4 text-sm text-charcoal-600">
        <Link to={path(module.key)} className="font-medium text-primary-700 hover:underline">
          Back to {module.label}
        </Link>
      </p>
    </PageContainer>
  );
}
