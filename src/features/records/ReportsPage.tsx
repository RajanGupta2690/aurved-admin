import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useStore } from '../../core/api/persistedStore';
import { recordsStore } from '../../core/api/stores';
import { usePortal } from '../../core/context/portalContext';
import { displayValue, featureKeyOf, isOverdue } from '../../core/records/ops';
import { RECORD_MODULES } from '../../core/records/registry';
import type { CollectionDef, ModuleGroup } from '../../core/records/types';
import PageContainer from '../../shared/layout/PageContainer';
import Button from '../../shared/ui/Button';
import DataTable from '../../shared/ui/DataTable';
import type { Column } from '../../shared/ui/DataTable';
import { Alert } from '../../shared/ui/Feedback';
import { PageHeader } from '../../shared/ui/Layout';
import { useNames } from './hooks';

interface Row {
  def: CollectionDef;
  module: ModuleGroup;
  total: number;
  open: number;
  overdue: number;
  archived: number;
}

const csvCell = (value: string) => {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Reports. Counts for every kind of record the person may see, and a download of each. */
export default function ReportsPage() {
  const { scope, inst, org, can, feature, path } = usePortal();
  const state = useStore(recordsStore);
  const { staffName, instName } = useNames();
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const scopeFor = (module: ModuleGroup) => (module.scope === 'org' ? org.id : inst?.id ?? org.id);

  const rows: Row[] = RECORD_MODULES.filter((module) => (scope === 'org') === (module.scope === 'org')).flatMap((module) =>
    module.collections
      .filter((def) => feature(featureKeyOf(def)).available && can(`${featureKeyOf(def)}.view`).allowed)
      .map((def) => {
        const mine = (state[def.key] ?? []).filter((row) => row.scopeId === scopeFor(module));
        const live = mine.filter((row) => !row.archived);
        return { def, module, total: live.length, archived: mine.length - live.length, overdue: live.filter((row) => isOverdue(def, row, today)).length, open: live.filter((row) => def.statuses && !def.statuses.find((item) => item.value === row.status)?.final).length };
      }),
  );

  const download = (row: Row) => {
    const mine = (state[row.def.key] ?? []).filter((item) => item.scopeId === scopeFor(row.module) && !item.archived);
    const header = [...row.def.fields.map((field) => field.label), ...(row.def.statuses ? ['Status'] : [])];
    const lines = mine.map((item) => [...row.def.fields.map((field) => displayValue(row.def, field, item.data, staffName, instName)), ...(row.def.statuses ? [row.def.statuses.find((status) => status.value === item.status)?.label ?? ''] : [])]);
    const text = [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scopeFor(row.module)}-${row.def.key}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<Row>[] = [
    { key: 'title', header: 'Records', sortable: true, accessor: (row) => row.def.title, cell: (row) => <Link to={path(`${row.module.key}/${row.def.key}`)} className="font-medium text-primary-700 hover:underline">{row.def.title}</Link> },
    { key: 'module', header: 'Module', sortable: true, accessor: (row) => row.module.label },
    { key: 'total', header: 'Records', sortable: true, align: 'right', accessor: (row) => row.total },
    { key: 'open', header: 'Not finished', sortable: true, align: 'right', accessor: (row) => row.open },
    { key: 'overdue', header: 'Overdue', sortable: true, align: 'right', accessor: (row) => row.overdue },
    { key: 'archived', header: 'Archived', sortable: true, align: 'right', accessor: (row) => row.archived, defaultHidden: true },
  ];

  return (
    <PageContainer>
      <PageHeader title="Reports" eyebrow="RPT-01" description="How many records there are of each kind, how many are not finished, and how many are overdue. Download any of them as a spreadsheet." breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Reports' }]} />
      <Alert tone="info" className="mb-4">
        Only what your role may see is listed. A download holds exactly the records you can see.
      </Alert>
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Reports by kind of record"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.def.key}
          searchText={(row) => `${row.def.title} ${row.module.label}`}
          searchPlaceholder="Search reports"
          initialSort={{ key: 'module', direction: 'asc' }}
          pageSize={15}
          rowActions={(row) => (
            <Button size="sm" icon={<Download size={14} aria-hidden="true" />} disabled={!can('reports.catalog.export').allowed || !can(`${featureKeyOf(row.def)}.export`).allowed} onClick={() => download(row)} aria-label={`Download ${row.def.title}`}>
              Download
            </Button>
          )}
        />
      </div>
    </PageContainer>
  );
}
