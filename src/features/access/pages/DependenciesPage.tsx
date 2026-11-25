import { usePortal } from '../../../core/context/portalContext';
import { MODULES } from '../../../core/features/registry';
import { resolveFeature } from '../../../core/features/resolve';
import { featureLabel } from '../../../core/org/accessOps';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { PageHeader } from '../../../shared/ui/Layout';
import SectionNav from '../components/SectionNav';
import { FEATURE_PAGES } from '../sections';
import { useEffectiveConfig } from '../hooks';

interface Row {
  key: string;
  module: string;
  label: string;
  needs: string[];
  neededBy: string[];
}

const ALL = MODULES.flatMap((module) => module.features.map((feature) => ({ module: module.label, feature })));
const ROWS: Row[] = ALL.map(({ module, feature }) => ({
  key: feature.key,
  module,
  label: feature.label,
  needs: feature.dependsOn ?? [],
  neededBy: ALL.filter((other) => other.feature.dependsOn?.includes(feature.key)).map((other) => other.feature.key),
})).filter((row) => row.needs.length > 0 || row.neededBy.length > 0);

/** ACC-06. Which feature needs which. Inside an institution the current state of each is shown too. */
export default function DependenciesPage() {
  const { inst, org, path } = usePortal();
  const config = useEffectiveConfig(inst);

  const chip = (key: string) => {
    const resolution = config && inst ? resolveFeature(config, inst.profile, key) : null;
    return (
      <Badge key={key} tone={resolution ? (resolution.available ? 'success' : 'warning') : 'neutral'} className="mr-1.5 mb-1">
        {featureLabel(key)}
        {resolution && !resolution.available ? ' (off)' : ''}
      </Badge>
    );
  };

  const columns: Column<Row>[] = [
    { key: 'label', header: 'Feature', sortable: true, accessor: (row) => `${row.label}`, cell: (row) => <span className="font-medium text-charcoal-900">{row.label}</span> },
    { key: 'module', header: 'Module', sortable: true, accessor: (row) => row.module },
    { key: 'needs', header: 'Needs', accessor: (row) => row.needs.map(featureLabel).join(', '), cell: (row) => (row.needs.length ? <span>{row.needs.map(chip)}</span> : <span className="text-charcoal-500">Nothing</span>) },
    { key: 'neededBy', header: 'Needed by', accessor: (row) => row.neededBy.map(featureLabel).join(', '), cell: (row) => (row.neededBy.length ? <span>{row.neededBy.map(chip)}</span> : <span className="text-charcoal-500">Nothing</span>) },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Feature dependencies"
        eyebrow="ACC-06"
        description="A feature stops working when something it needs is off, locked, or not in the plan. Switching one off takes its dependents with it."
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Dependencies' }]}
      />
      <SectionNav label="Feature pages" items={FEATURE_PAGES} />
      <div className="card !p-0 overflow-hidden">
        <DataTable caption="Feature dependencies" rows={ROWS} columns={columns} rowKey={(row) => row.key} searchText={(row) => `${row.label} ${row.module}`} searchPlaceholder="Search features" initialSort={{ key: 'label', direction: 'asc' }} pageSize={20} />
      </div>
    </PageContainer>
  );
}
