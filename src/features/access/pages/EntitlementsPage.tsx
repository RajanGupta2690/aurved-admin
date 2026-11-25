import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { matchesAny } from '../../../core/access/match';
import { MODULES, moduleAppliesTo } from '../../../core/features/registry';
import { resolveFeature } from '../../../core/features/resolve';
import { isExternal } from '../../../core/org/rules';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField } from '../../../shared/ui/Field';
import { Card, DescriptionList, PageHeader } from '../../../shared/ui/Layout';
import { useOrgData, useWorld } from '../../organization/hooks';
import FeatureState from '../components/FeatureState';
import SectionNav from '../components/SectionNav';
import { FEATURE_PAGES } from '../sections';
import { useEffectiveConfig } from '../hooks';

interface Row {
  key: string;
  module: string;
  label: string;
  inPlan: boolean;
  required: boolean;
  resolution: ReturnType<typeof resolveFeature>;
}

/** ACC-01. What the subscription includes. Read only: the plan is changed by AURVED. */
export default function EntitlementsPage() {
  const { scope, inst, org, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const choices = scope === 'org' ? institutions.filter((item) => item.orgId === org.id && !isExternal(item)) : inst ? [inst] : [];
  const [chosen, setChosen] = useState('');
  const target = choices.find((item) => item.id === chosen) ?? choices[0];
  const config = useEffectiveConfig(target);
  const billing = world.billing[org.id];

  if (!target || !config) return null;
  const rows: Row[] = MODULES.filter((module) => moduleAppliesTo(module, target.profile)).flatMap((module) =>
    module.features.map((feature) => ({
      key: feature.key,
      module: module.label,
      label: feature.label,
      inPlan: feature.required === true || matchesAny(config.entitlements, feature.key),
      required: feature.required === true,
      resolution: resolveFeature(config, target.profile, feature.key),
    })),
  );
  const included = rows.filter((row) => row.inPlan).length;

  const columns: Column<Row>[] = [
    { key: 'module', header: 'Module', sortable: true, accessor: (row) => row.module },
    { key: 'label', header: 'Feature', sortable: true, accessor: (row) => row.label, cell: (row) => <span className="font-medium text-charcoal-900">{row.label}</span> },
    {
      key: 'plan',
      header: 'In the plan',
      sortable: true,
      accessor: (row) => (row.inPlan ? (row.required ? 'Included for everyone' : 'Included') : 'Not included'),
      cell: (row) => <Badge tone={row.inPlan ? 'success' : 'warning'}>{row.inPlan ? (row.required ? 'Included for everyone' : 'Included') : 'Not included'}</Badge>,
    },
    { key: 'now', header: 'Right now', accessor: (row) => (row.resolution.available ? 'On' : row.resolution.detail ?? 'Off'), cell: (row) => <FeatureState resolution={row.resolution} required={row.required} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Plan entitlements"
        eyebrow="ACC-01"
        description="What the subscription includes. This page is read only. Features that are included can still be switched off, locked, or blocked by something they need."
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Plan entitlements' }]}
      />
      <SectionNav label="Feature pages" items={FEATURE_PAGES} />
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Subscription" className="lg:col-span-2">
          <DescriptionList
            items={[
              { label: 'Plan', value: billing?.plan ?? 'Not recorded' },
              { label: 'Institution', value: target.name },
              { label: 'Features in the plan', value: `${included} of ${rows.length}` },
              { label: 'To change the plan', value: <Link to={path('billing')} className="text-primary-700 hover:underline">Request a plan change</Link> },
            ]}
          />
        </Card>
        {scope === 'org' && (
          <Card title="Institution">
            <SelectField label="Show the plan of" options={choices.map((item) => ({ value: item.id, label: item.shortName }))} value={target.id} onChange={setChosen} hint="Independent institutions have their own plan and are not listed." />
          </Card>
        )}
      </div>
      <div className="card !p-0 overflow-hidden">
        <DataTable caption="Plan entitlements" rows={rows} columns={columns} rowKey={(row) => row.key} searchText={(row) => `${row.module} ${row.label}`} searchPlaceholder="Search features" exportName={`${target.id}-entitlements`} initialSort={{ key: 'module', direction: 'asc' }} />
      </div>
    </PageContainer>
  );
}
