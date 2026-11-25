import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import type { ConfigChange } from '../../../core/org/model';
import { describeDiff, revertConfig } from '../../../core/org/accessOps';
import { formatDate, isExternal } from '../../../core/org/rules';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { Drawer } from '../../../shared/ui/Overlay';
import { useApply, useOrgData, useWorld } from '../../organization/hooks';
import SectionNav from '../components/SectionNav';
import { FEATURE_PAGES } from '../sections';

/** ACC-14. Every change of a feature setting, with what it was before, and a way back. */
export default function ConfigHistoryPage() {
  const { scope, inst, org, can, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const [open, setOpen] = useState<ConfigChange | null>(null);
  const [undo, setUndo] = useState<ConfigChange | null>(null);
  const [error, setError] = useState('');
  const canEdit = can('access.confighistory.edit').allowed;

  const nameOf = (change: ConfigChange) =>
    change.targetKind === 'organization' ? `${org.name}, all institutions` : institutions.find((item) => item.id === change.targetId)?.shortName ?? change.targetId;

  const rows = world.configHistory.filter((change) => {
    if (scope === 'inst') return change.targetId === inst?.id || (change.targetKind === 'organization' && change.orgId === org.id && inst && !isExternal(inst));
    const target = institutions.find((item) => item.id === change.targetId);
    return change.orgId === org.id && !(target && isExternal(target));
  });

  const columns: Column<ConfigChange>[] = [
    { key: 'at', header: 'When', sortable: true, accessor: (row) => row.at, cell: (row) => formatDate(row.at), exportValue: (row) => row.at },
    { key: 'by', header: 'Who', sortable: true, accessor: (row) => row.byName },
    { key: 'target', header: 'Applies to', sortable: true, accessor: nameOf, cell: (row) => <Badge tone={row.targetKind === 'organization' ? 'brand' : 'neutral'}>{nameOf(row)}</Badge> },
    { key: 'summary', header: 'Change', accessor: (row) => row.summary, className: 'min-w-[16rem]' },
    { key: 'reason', header: 'Reason', accessor: (row) => row.reason ?? '' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Configuration history"
        eyebrow="ACC-14"
        description="Every change to feature switches and feature policy. Open a change to see what differs, or go back to the setting before it."
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Configuration history' }]}
      />
      <SectionNav label="Feature pages" items={FEATURE_PAGES} />
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Configuration history"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => `${row.summary} ${row.byName} ${row.reason ?? ''}`}
          searchPlaceholder="Search changes"
          initialSort={{ key: 'at', direction: 'desc' }}
          rowActions={(row) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" onClick={() => setOpen(row)} aria-label={`Details of ${row.id}`}>
                Details
              </Button>
              <Button size="sm" icon={<RotateCcw size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => { setError(''); setUndo(row); }} aria-label={`Go back to before ${row.id}`}>
                Go back
              </Button>
            </div>
          )}
          emptyTitle="No changes yet"
          emptyDescription="Switching a feature or setting a policy writes an entry here."
        />
      </div>

      <Drawer open={open !== null} onClose={() => setOpen(null)} title={open?.id ?? ''} description={open?.summary}>
        {open && (
          <div className="space-y-4 text-sm">
            <p className="text-charcoal-700">
              {open.byName}, {formatDate(open.at)}
            </p>
            {open.reason && <p className="text-charcoal-700">Reason: {open.reason}</p>}
            <section aria-labelledby="diff-h">
              <h3 id="diff-h" className="mb-2 font-semibold text-charcoal-950">
                What differs
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-charcoal-800">
                {describeDiff(open.before, open.after).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={undo !== null}
        onClose={() => setUndo(null)}
        onConfirm={(reason) => {
          if (!undo) return;
          const result = apply((snap, now, actor) => revertConfig(snap, undo.id, actor, now, reason), 'Configuration restored.');
          setError(result.ok ? '' : result.error);
        }}
        title="Go back to before this change"
        message="The settings return to how they were before this change. The undo is a new entry in the history. Earlier entries stay."
        itemName={undo?.summary}
        confirmLabel="Go back"
        tone="primary"
        requireReason
      />
    </PageContainer>
  );
}
