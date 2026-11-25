import { useState } from 'react';
import { Link } from 'react-router-dom';
import { snapshot } from '../../../core/api/worldStore';
import { useInstitution, usePortal } from '../../../core/context/portalContext';
import { MODULES, moduleAppliesTo } from '../../../core/features/registry';
import { resolveFeature } from '../../../core/features/resolve';
import { featureImpact, featureLabel, setLocalFeature } from '../../../core/org/accessOps';
import PageContainer from '../../../shared/layout/PageContainer';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { Switch } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { useApply } from '../../organization/hooks';
import FeatureState from '../components/FeatureState';
import SectionNav from '../components/SectionNav';
import { FEATURE_PAGES } from '../sections';
import { useEffectiveConfig } from '../hooks';

/** ACC-03. Switch optional features on or off for this institution. */
export default function FeaturesPage() {
  const inst = useInstitution();
  const { org, can, path } = usePortal();
  const config = useEffectiveConfig(inst);
  const apply = useApply();
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ key: string; lost: string[] } | null>(null);
  const canEdit = can('access.features.edit').allowed;

  if (!config) return null;
  const modules = MODULES.filter((module) => moduleAppliesTo(module, inst.profile));
  const all = modules.flatMap((module) => module.features);
  const on = all.filter((feature) => resolveFeature(config, inst.profile, feature.key).available).length;

  const run = (key: string, enabled: boolean) => {
    const result = apply((snap, now, actor) => setLocalFeature(snap, inst.id, key, enabled, actor, now), `${featureLabel(key)} is ${enabled ? 'on' : 'off'}.`);
    setError(result.ok ? '' : result.error);
  };

  const toggle = (key: string, enabled: boolean) => {
    const impact = featureImpact(snapshot(), inst.id, key, enabled);
    if (!enabled && impact.lost.length > 0) setConfirm({ key, lost: impact.lost });
    else run(key, enabled);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Features"
        eyebrow="ACC-03"
        description={`Choose which optional features ${inst.shortName} uses. A feature that is not in the plan, or that ${org.implicit ? 'the platform needs' : `${org.name} controls`}, cannot be changed here.`}
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Features' }]}
      />
      <SectionNav label="Feature pages" items={FEATURE_PAGES} />
      {!canEdit && (
        <Alert tone="info" className="mb-4">
          You can see the features. Your role cannot change them.
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <p className="mb-4 text-sm text-charcoal-700" aria-live="polite">
        {on} of {all.length} features are on. See what the plan includes in{' '}
        <Link to={path('entitlements')} className="font-medium text-primary-700 hover:underline">
          Plan entitlements
        </Link>
        .
      </p>

      <div className="grid gap-6">
        {modules.map((module) => (
          <Card key={module.key} title={module.label} description={module.description}>
            <ul className="divide-y divide-warm-200">
              {module.features.map((feature) => {
                const resolution = resolveFeature(config, inst.profile, feature.key);
                const switchable = !feature.required && !resolution.mandatory && (resolution.available || resolution.reason === 'disabled_locally' || resolution.reason === 'dependency_missing');
                return (
                  <li key={feature.key} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 max-w-xl">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-charcoal-900">
                        {feature.label}
                        <FeatureState resolution={resolution} required={feature.required} />
                      </p>
                      <p className="text-xs text-charcoal-600">{feature.description}</p>
                      {!resolution.available && resolution.detail && <p className="mt-0.5 text-xs text-charcoal-700">{resolution.detail}</p>}
                      {feature.dependsOn && <p className="mt-0.5 text-xs text-charcoal-500">Needs: {feature.dependsOn.map(featureLabel).join(', ')}</p>}
                    </div>
                    <Switch
                      label={`${feature.label} in ${inst.shortName}`}
                      checked={resolution.available}
                      onChange={(checked) => toggle(feature.key, checked)}
                      disabled={!canEdit || !switchable}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm.key, false)}
        title={`Switch off ${confirm ? featureLabel(confirm.key) : ''}`}
        message="These features need it and will stop working too. Their data is kept. Switch it on again to get them back."
        itemName={confirm?.lost.map(featureLabel).join(', ')}
        confirmLabel="Switch off"
      />
    </PageContainer>
  );
}
