import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../../core/api/persistedStore';
import { accessStore } from '../../../core/api/stores';
import { usePortal } from '../../../core/context/portalContext';
import { dataScopeFor, explainAccess, SCOPE_LABEL } from '../../../core/access/engine';
import { effectiveConfig, OPEN_CONFIG } from '../../../core/features/effective';
import { actionsOf, MODULES, getFeature } from '../../../core/features/registry';
import { explainFeature } from '../../../core/features/resolve';
import { isExternal } from '../../../core/org/rules';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import { SelectField } from '../../../shared/ui/Field';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { useOrgData } from '../../organization/hooks';
import { useFeatureConfigs } from '../hooks';

const FEATURE_OPTIONS = MODULES.flatMap((module) => module.features.map((feature) => ({ value: feature.key, label: `${module.label}: ${feature.label}` })));

/** ACC-12. Pick a person, a place and something to do. See why it is allowed or refused, step by step. */
export default function ExplainerPage() {
  const { scope, org, inst, path } = usePortal();
  const { roles, personas } = useStore(accessStore);
  const { institutions, organizations } = useOrgData();
  const configs = useFeatureConfigs();
  const [params] = useSearchParams();

  const places = scope === 'inst' && inst ? [{ value: inst.id, label: inst.name }] : [...(org.implicit ? [] : [{ value: 'org', label: `${org.name} (whole organization)` }]), ...institutions.filter((item) => item.orgId === org.id).map((item) => ({ value: item.id, label: `${item.name}${isExternal(item) ? ' (independent)' : ''}` }))];
  const [personId, setPersonId] = useState(params.get('person') ?? personas[0]?.id ?? '');
  const [placeId, setPlaceId] = useState(places.some((item) => item.value === params.get('place')) ? (params.get('place') as string) : places[0]?.value ?? '');
  const initial = params.get('permission')?.split('.') ?? [];
  const [featureKey, setFeatureKey] = useState(initial.length >= 3 ? `${initial[0]}.${initial[1]}` : 'students.directory');
  const feature = getFeature(featureKey);
  const actions = feature ? actionsOf(feature) : ['view'];
  const [action, setAction] = useState(initial.length >= 3 ? initial[2] : 'view');
  const effectiveAction = actions.includes(action as never) ? action : actions[0];

  const person = personas.find((item) => item.id === personId);
  const targetInst = placeId === 'org' ? undefined : institutions.find((item) => item.id === placeId);
  const targetOrg = organizations.find((item) => item.id === (targetInst?.orgId ?? org.id)) ?? org;
  const place = { orgId: targetOrg.id, instId: targetInst?.id, external: targetInst ? isExternal(targetInst) : undefined };
  const permission = `${featureKey}.${effectiveAction}`;
  const module = MODULES.find((item) => item.key === featureKey.split('.')[0]);

  const access = person ? explainAccess(person, roles, permission, place) : null;
  const config = targetInst ? effectiveConfig(configs, organizations, targetInst) : OPEN_CONFIG;
  const available = explainFeature(config, targetInst?.profile ?? null, featureKey);
  const scopeKind = person && module ? dataScopeFor(person, roles, module.key, place) : null;
  const allowed = Boolean(access?.result.allowed && available.resolution.available);

  return (
    <PageContainer>
      <PageHeader
        title="Access explainer"
        eyebrow="ACC-12"
        description="Choose a person, a place and something to do. The answer comes from the same rules the portal uses."
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Access explainer' }]}
      />
      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField label="Person" options={personas.map((item) => ({ value: item.id, label: `${item.name}, ${item.title}` }))} value={personId} onChange={setPersonId} />
          <SelectField label="Place" options={places} value={placeId} onChange={setPlaceId} disabled={places.length === 1} />
          <SelectField label="Feature" options={FEATURE_OPTIONS} value={featureKey} onChange={setFeatureKey} />
          <SelectField label="Action" options={actions.map((item) => ({ value: item, label: item }))} value={effectiveAction} onChange={setAction} />
        </div>
      </Card>

      <section aria-labelledby="result-h" aria-live="polite" className={`mb-6 rounded-2xl border p-5 ${allowed ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50'}`}>
        <h2 id="result-h" className="text-xl font-bold text-charcoal-950">
          {allowed ? 'Allowed' : 'Not allowed'}
        </h2>
        <p className="mt-1 text-sm text-charcoal-800">
          {person?.name} {allowed ? 'can' : 'cannot'} do <strong>{permission}</strong> at {targetInst?.name ?? targetOrg.name}.
        </p>
        {!allowed && (
          <p className="mt-1 text-sm text-charcoal-800">
            {!available.resolution.available ? `The feature is not available there: ${available.resolution.detail ?? ''}` : access?.result.detail}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Is the feature available there?" description="Plan, organization policy, institution switch, and what it needs.">
          <Steps steps={available.steps} />
        </Card>
        <Card title="2. Does the person have the permission?" description="Role held there, explicit denies, then allows.">
          <Steps steps={access?.steps ?? []} />
          <div className="mt-4 border-t border-warm-200 pt-3 text-sm">
            <p className="font-medium text-charcoal-900">Data scope in {module?.label ?? 'this module'}</p>
            <p className="text-charcoal-700">{scopeKind ? SCOPE_LABEL[scopeKind] : 'None. The person has no role there.'}</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

function Steps({ steps }: { steps: Array<{ label: string; passed: boolean; detail: string }> }) {
  return (
    <ol className="space-y-3 text-sm">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          <Badge tone={step.passed ? 'success' : 'danger'}>{step.passed ? 'Yes' : 'No'}</Badge>
          <div>
            <p className="font-medium text-charcoal-900">{step.label}</p>
            <p className="text-charcoal-700">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
