import { useState } from 'react';
import { snapshot } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import { DOCUMENT_TYPES } from '../../../core/staff/model';
import type { StaffPolicy } from '../../../core/staff/model';
import { policyOf, saveStaffPolicy } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import Button from '../../../shared/ui/Button';
import { CheckboxField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { useApply } from '../../organization/hooks';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

/** STF-30. Used when adding staff, assigning classes and checking documents. */
export default function StaffPoliciesPage() {
  const { can, org, path } = usePortal();
  const { inst, state } = useInstStaff();
  const apply = useApply();
  const saved = policyOf(snapshot(), inst.id);
  const own = Boolean(state.policies[inst.id]);
  const [policy, setPolicy] = useState<StaffPolicy>(saved);
  const [error, setError] = useState('');
  const canEdit = can('staff.policies.configure').allowed;

  const save = () => {
    const result = apply((snap, now, actor) => saveStaffPolicy(snap, inst.id, policy, actor, now), 'Staff policy saved.');
    setError(result.ok ? '' : result.error);
  };
  const number = (key: keyof Pick<StaffPolicy, 'maxPeriodsPerWeek' | 'probationMonths' | 'noticeDays'>) => (value: string) => setPolicy({ ...policy, [key]: Number(value) });

  return (
    <PageContainer>
      <PageHeader title="Staff policies" eyebrow="STF-30" description="Rules this institution follows for staff. They apply from now on." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Policies' }]} />
      <StaffNav />
      {!own && !org.implicit && <Alert tone="info" className="mb-4">These values come from the default of {org.name}. Saving here makes them specific to {inst.shortName}.</Alert>}
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <form onSubmit={(event) => { event.preventDefault(); save(); }} noValidate className="grid gap-6">
        <Card title="Numbers">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Maximum periods a week" type="number" hint="A teacher cannot be given more." value={policy.maxPeriodsPerWeek} onChange={number('maxPeriodsPerWeek')} disabled={!canEdit} />
            <TextField label="Probation in months" type="number" hint="Permanent staff start on probation. 0 for none." value={policy.probationMonths} onChange={number('probationMonths')} disabled={!canEdit} />
            <TextField label="Notice period in days" type="number" value={policy.noticeDays} onChange={number('noticeDays')} disabled={!canEdit} />
            <TextField label="Employee number prefix" hint="Letters, such as EMP or HZN-" value={policy.employeeIdPrefix} onChange={(value) => setPolicy({ ...policy, employeeIdPrefix: value })} disabled={!canEdit} />
          </div>
        </Card>
        <Card title="Required documents" description="A person is flagged until each of these is added and verified.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DOCUMENT_TYPES.map((type) => (
              <CheckboxField key={type} label={type} checked={policy.requiredDocuments.includes(type)} onChange={(checked) => setPolicy({ ...policy, requiredDocuments: checked ? [...policy.requiredDocuments, type] : policy.requiredDocuments.filter((item) => item !== type) })} disabled={!canEdit} />
            ))}
          </div>
        </Card>
        <div>
          <Button variant="primary" type="submit" disabled={!canEdit || JSON.stringify(policy) === JSON.stringify(saved)}>
            Save policy
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
