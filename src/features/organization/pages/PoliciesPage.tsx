import { useState } from 'react';
import { usePortal } from '../../../core/context/portalContext';
import { GRADING_SCHEMES, POLICY_CATALOG } from '../../../core/org/model';
import type { PolicyDef, PolicySetting } from '../../../core/org/model';
import { policyConflicts, savePolicy } from '../../../core/org/ops';
import { monthName } from '../../../core/org/rules';
import { snapshot } from '../../../core/api/worldStore';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import { SelectField, Switch, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { useApply, useOrgData, useWorld } from '../hooks';

const MONTHS = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: monthName(index + 1) }));
const DEFAULT_VALUE: Record<PolicyDef['input'], string> = { none: '', text: '', grading: 'percentage', month: '4', sharing: 'none' };

/** ORG-10 */
export default function PoliciesPage() {
  const { org, can, path } = usePortal();
  const world = useWorld();
  useOrgData(); // Conflicts depend on institutions too, so redraw when they change.
  const apply = useApply();
  const canEdit = can('org.policies.configure').allowed;
  const saved = world.policies[org.id] ?? {};
  const [drafts, setDrafts] = useState<Record<string, PolicySetting>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const current = (def: PolicyDef): PolicySetting => drafts[def.key] ?? saved[def.key] ?? { enforced: false, value: DEFAULT_VALUE[def.input] };
  const original = (def: PolicyDef): PolicySetting => saved[def.key] ?? { enforced: false, value: DEFAULT_VALUE[def.input] };
  const dirty = (def: PolicyDef) => JSON.stringify(current(def)) !== JSON.stringify(original(def));
  const patch = (def: PolicyDef, change: Partial<PolicySetting>) => {
    setDrafts({ ...drafts, [def.key]: { ...current(def), ...change } });
    setErrors({ ...errors, [def.key]: '' });
  };

  const save = (def: PolicyDef) => {
    const result = apply((snap, now, actor) => savePolicy(snap, org.id, def.key, current(def), actor, now), `${def.label}: saved.`);
    if (result.ok) {
      const { [def.key]: _removed, ...rest } = drafts;
      setDrafts(rest);
    } else setErrors({ ...errors, [def.key]: result.error });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Governance policies"
        eyebrow="ORG-10"
        description={`Rules ${org.name} enforces on every institution it runs. Institutions that run independently are not bound by them, except the data sharing start level.`}
        breadcrumbs={[{ label: org.name, to: path() }, { label: 'Governance policies' }]}
      />
      {!canEdit && (
        <Alert tone="info" className="mb-4">
          You can read the policies. Your role cannot change them.
        </Alert>
      )}
      <div className="grid gap-4">
        {POLICY_CATALOG.map((def) => {
          const setting = current(def);
          const changed = dirty(def);
          const conflicts = changed || setting.enforced ? policyConflicts(snapshot(), org.id, def.key, setting) : [];
          return (
            <Card key={def.key}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 max-w-2xl">
                  <h2 className="flex flex-wrap items-center gap-2 font-semibold text-charcoal-950">
                    {def.label}
                    <Badge tone={original(def).enforced ? 'brand' : 'neutral'}>{original(def).enforced ? 'Enforced' : 'Not enforced'}</Badge>
                  </h2>
                  <p className="mt-1 text-sm text-charcoal-700">{def.description}</p>
                  <p className="mt-1 text-xs text-charcoal-600">Applies in: {def.enforcedIn}</p>
                </div>
                <Switch label={`Enforce ${def.label}`} checked={setting.enforced} onChange={(checked) => patch(def, { enforced: checked })} disabled={!canEdit} description={setting.enforced ? 'Enforced' : 'Off'} />
              </div>

              {setting.enforced && (
                <div className="mt-4 max-w-md">
                  {def.input === 'text' && <TextField label="Names must start with" value={setting.value} onChange={(value) => patch(def, { value })} disabled={!canEdit} />}
                  {def.input === 'grading' && <SelectField label="Grading scheme" options={GRADING_SCHEMES.map((item) => ({ value: item.value, label: item.label }))} value={setting.value} onChange={(value) => patch(def, { value })} disabled={!canEdit} />}
                  {def.input === 'month' && <SelectField label="Sessions start in" options={MONTHS} value={setting.value} onChange={(value) => patch(def, { value })} disabled={!canEdit} />}
                  {def.input === 'sharing' && (
                    <SelectField
                      label="New independent institutions start with"
                      options={[
                        { value: 'none', label: 'Nothing shared' },
                        { value: 'summary', label: 'Summary only' },
                      ]}
                      value={setting.value}
                      onChange={(value) => patch(def, { value })}
                      disabled={!canEdit}
                    />
                  )}
                </div>
              )}

              {conflicts.length > 0 && (
                <Alert tone="warning" title={`${conflicts.length} ${conflicts.length === 1 ? 'institution does' : 'institutions do'} not meet this today`} className="mt-4">
                  {conflicts.map((inst) => inst.shortName).join(', ')}. They are not changed. The rule applies the next time they are created or edited.
                </Alert>
              )}
              {errors[def.key] && (
                <Alert tone="danger" className="mt-4">
                  {errors[def.key]}
                </Alert>
              )}
              {changed && (
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" onClick={() => save(def)} disabled={!canEdit}>
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      const { [def.key]: _removed, ...rest } = drafts;
                      setDrafts(rest);
                      setErrors({ ...errors, [def.key]: '' });
                    }}
                  >
                    Discard
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
