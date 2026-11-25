import { useState } from 'react';
import { usePortal } from '../../../core/context/portalContext';
import { effectiveConfig } from '../../../core/features/effective';
import { MODULES, moduleAppliesTo } from '../../../core/features/registry';
import { explainFeature, resolveFeature } from '../../../core/features/resolve';
import type { PolicyMode } from '../../../core/features/resolve';
import { configOf, featureLabel, setPolicy } from '../../../core/org/accessOps';
import { snapshot } from '../../../core/api/worldStore';
import { isExternal } from '../../../core/org/rules';
import type { Institution } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import type { Tone } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextareaField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useOrgData } from '../../organization/hooks';
import { useFeatureConfigs } from '../hooks';

const MODE_OPTIONS = [
  { value: '', label: 'Optional' },
  { value: 'mandatory', label: 'Required' },
  { value: 'locked_off', label: 'Locked off' },
];

function shortState(resolution: ReturnType<typeof resolveFeature>): { text: string; tone: Tone } {
  if (resolution.available) return resolution.mandatory ? { text: 'Required', tone: 'brand' } : { text: 'On', tone: 'success' };
  switch (resolution.reason) {
    case 'not_in_plan':
      return { text: 'Not in plan', tone: 'warning' };
    case 'locked_by_policy':
      return { text: 'Locked', tone: 'danger' };
    case 'disabled_locally':
      return { text: 'Switched off', tone: 'neutral' };
    case 'dependency_missing':
      return { text: 'Needs other', tone: 'warning' };
    default:
      return { text: 'Not applicable', tone: 'neutral' };
  }
}

/**
 * ACC-02 (default policy) and ACC-04 / ACC-05 (matrix of branches or colleges).
 * Policy applies to institutions the organization runs. Independent institutions keep their own settings.
 */
export default function FeaturePolicyPage() {
  const { org, institutions, can, path } = usePortal();
  const { organizations } = useOrgData();
  const configs = useFeatureConfigs();
  const apply = useApply();
  const [tab, setTab] = useState('default');
  const [error, setError] = useState('');
  const [cell, setCell] = useState<{ inst: Institution; key: string; mode: string; reason: string } | null>(null);
  const [cellError, setCellError] = useState('');

  const members = institutions.filter((inst) => inst.orgId === org.id);
  const governed = members.filter((inst) => !isExternal(inst));
  const independent = members.filter((inst) => isExternal(inst));
  const canEdit = can('org.featurepolicy.configure').allowed;
  const isUniversity = org.type === 'university';
  const unit = isUniversity ? 'college' : 'branch';

  const features = MODULES.flatMap((module) => module.features.map((feature) => ({ module, feature }))).filter(({ module, feature }) => !feature.required && governed.some((inst) => moduleAppliesTo(module, inst.profile)));
  const orgPolicy = configs[org.id]?.policy ?? {};

  const changeDefault = (key: string, mode: string) => {
    const result = apply((snap, now, actor) => setPolicy(snap, { kind: 'organization', orgId: org.id }, key, (mode || null) as PolicyMode | null, actor, now), `Policy for ${featureLabel(key)} saved.`);
    setError(result.ok ? '' : result.error);
  };

  interface Row {
    key: string;
    module: string;
    label: string;
    description: string;
    mode: string;
  }
  const rows: Row[] = features.map(({ module, feature }) => ({ key: feature.key, module: module.label, label: feature.label, description: feature.description, mode: orgPolicy[feature.key] ?? '' }));
  const columns: Column<Row>[] = [
    { key: 'module', header: 'Module', sortable: true, accessor: (row) => row.module },
    { key: 'label', header: 'Feature', sortable: true, accessor: (row) => row.label, cell: (row) => (<div><p className="font-medium text-charcoal-900">{row.label}</p><p className="text-xs text-charcoal-600">{row.description}</p></div>) },
    {
      key: 'mode',
      header: isUniversity ? 'Policy for all colleges' : 'Policy for all branches',
      accessor: (row) => MODE_OPTIONS.find((item) => item.value === row.mode)?.label ?? '',
      cell: (row) => <SelectField label={`Policy for ${row.label}`} hideLabel options={MODE_OPTIONS} value={row.mode} onChange={(value) => changeDefault(row.key, value)} disabled={!canEdit} />,
    },
  ];

  const openCell = (inst: Institution, key: string) => {
    setCell({ inst, key, mode: configOf(snapshot(), inst.id).policy[key] ?? '', reason: '' });
    setCellError('');
  };
  const saveCell = () => {
    if (!cell) return;
    const result = apply((snap, now, actor) => setPolicy(snap, { kind: 'institution', instId: cell.inst.id }, cell.key, (cell.mode || null) as PolicyMode | null, actor, now, cell.reason), 'Policy saved.');
    if (result.ok) setCell(null);
    else setCellError(result.error);
  };

  if (governed.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Feature policy" eyebrow="ACC-02" breadcrumbs={[{ label: org.name, to: path() }, { label: 'Feature policy' }]} />
        <EmptyState title="No institution to set policy for" description="Every institution here runs independently, or there are none yet." />
      </PageContainer>
    );
  }

  const explanation = cell ? explainFeature(effectiveConfig(configs, organizations, cell.inst), cell.inst.profile, cell.key) : null;

  return (
    <PageContainer>
      <PageHeader
        title="Feature policy"
        eyebrow={tab === 'default' ? 'ACC-02' : isUniversity ? 'ACC-05' : 'ACC-04'}
        description={`Decide which features every ${unit} must have, may choose, or cannot use. ${independent.length > 0 ? `${independent.length} independent ${independent.length === 1 ? 'institution is' : 'institutions are'} not bound by this: they keep their own settings.` : ''}`}
        breadcrumbs={[{ label: org.name, to: path() }, { label: 'Feature policy' }]}
      />
      {!canEdit && (
        <Alert tone="info" className="mb-4">
          You can read the policy. Your role cannot change it.
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <Tabs
        label="Feature policy views"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'default', label: 'Default for everyone' },
          { id: 'matrix', label: isUniversity ? 'College matrix' : 'Branch matrix', badge: governed.length },
        ]}
      />
      <TabPanel id="default" value={tab}>
        <p className="mb-4 max-w-3xl text-sm text-charcoal-700">
          <strong>Optional</strong>: each {unit} decides. <strong>Required</strong>: it is on and cannot be switched off. <strong>Locked off</strong>: it cannot be used. Features that the platform needs are not listed. In the matrix you can make an exception for one {unit}.
        </p>
        {rows.length === 0 ? (
          <EmptyState title="Nothing to configure yet" description={`Every feature that applies to a ${unit} is needed by the platform. Optional features arrive with the next modules.`} />
        ) : (
          <div className="card !p-0 overflow-hidden">
            <DataTable caption="Default feature policy" rows={rows} columns={columns} rowKey={(row) => row.key} searchText={(row) => `${row.module} ${row.label}`} searchPlaceholder="Search features" initialSort={{ key: 'module', direction: 'asc' }} pageSize={50} />
          </div>
        )}
      </TabPanel>
      <TabPanel id="matrix" value={tab}>
        {rows.length === 0 ? (
          <EmptyState title="Nothing to show yet" description={`Every feature that applies to a ${unit} is needed by the platform. Optional features arrive with the next modules.`} />
        ) : (
          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Features by {unit}</caption>
                <thead>
                  <tr className="border-b border-warm-200 bg-warm-50 text-left">
                    <th scope="col" className="sticky left-0 bg-warm-50 px-4 py-3 font-semibold text-charcoal-800">
                      Feature
                    </th>
                    {governed.map((inst) => (
                      <th key={inst.id} scope="col" className="px-3 py-3 text-center font-semibold text-charcoal-800">
                        {inst.shortName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map(({ feature }) => (
                    <tr key={feature.key} className="border-b border-warm-100 last:border-0">
                      <th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-medium text-charcoal-900">
                        {feature.label}
                      </th>
                      {governed.map((inst) => {
                        const resolution = resolveFeature(effectiveConfig(configs, organizations, inst), inst.profile, feature.key);
                        const state = shortState(resolution);
                        const own = configs[inst.id]?.policy[feature.key];
                        return (
                          <td key={inst.id} className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => openCell(inst, feature.key)}
                              aria-label={`${feature.label} in ${inst.shortName}: ${state.text}${own ? `, exception set` : ''}. Open to change`}
                              className="rounded-lg px-1 py-1 hover:bg-warm-100"
                            >
                              <Badge tone={state.tone}>{state.text}</Badge>
                              {own && <span className="ml-1 text-xs text-charcoal-600" aria-hidden="true">*</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-warm-200 px-4 py-3 text-xs text-charcoal-600">* An exception for that {unit}, set on top of the default policy.</p>
          </Card>
        )}
      </TabPanel>

      <Dialog
        open={cell !== null}
        onClose={() => setCell(null)}
        title={cell ? `${featureLabel(cell.key)} in ${cell.inst.shortName}` : ''}
        description="Why it is as it is, and an exception for this one only."
        footer={
          <>
            <Button onClick={() => setCell(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveCell} disabled={!canEdit}>
              Save exception
            </Button>
          </>
        }
      >
        {cell && explanation && (
          <div className="space-y-4">
            {cellError && <Alert tone="danger">{cellError}</Alert>}
            <ol className="space-y-2 text-sm">
              {explanation.steps.map((step) => (
                <li key={step.label} className="flex gap-2">
                  <Badge tone={step.passed ? 'success' : 'danger'}>{step.passed ? 'Yes' : 'No'}</Badge>
                  <span>
                    <span className="font-medium text-charcoal-900">{step.label}</span> <span className="text-charcoal-700">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
            <SelectField
              label={`Policy for ${cell.inst.shortName}`}
              options={[{ value: '', label: `Follow the default (${MODE_OPTIONS.find((item) => item.value === (orgPolicy[cell.key] ?? ''))?.label.toLowerCase()})` }, ...MODE_OPTIONS.slice(1)]}
              value={cell.mode}
              onChange={(value) => setCell({ ...cell, mode: value })}
              disabled={!canEdit}
            />
            <TextareaField label="Reason" rows={2} value={cell.reason} onChange={(value) => setCell({ ...cell, reason: value })} hint="Written to the configuration history." />
          </div>
        )}
      </Dialog>
    </PageContainer>
  );
}
