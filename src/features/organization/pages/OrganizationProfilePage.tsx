import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { updateOrganization } from '../../../core/org/ops';
import type { OrgPatch } from '../../../core/org/ops';
import { ORG_TYPE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { GovernanceModel, OrgType } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import Button from '../../../shared/ui/Button';
import { SelectField, TextareaField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, DescriptionList, PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useForm } from '../../../shared/ui/useForm';
import { email, maxNumber, minNumber, phone, pattern, required } from '../../../shared/ui/validators';
import { useApply, useOrgData } from '../hooks';

const EDITABLE_TYPES: OrgType[] = ['school_group', 'school_trust', 'school_chain', 'college_group', 'university_group', 'multi_institution', 'university', 'other'];
const GOVERNANCE: Array<{ value: GovernanceModel; label: string }> = [
  { value: 'centralized', label: 'Centralized: the organization decides' },
  { value: 'federated', label: 'Federated: shared decisions' },
  { value: 'autonomous', label: 'Autonomous: institutions decide' },
];

interface Values extends Record<string, unknown> {
  name: string;
  legalName: string;
  type: string;
  governance: string;
  country: string;
  foundedYear: string;
  registrationNo: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

const SCHEMA = {
  name: [required('Enter the organization name.')],
  country: [required('Enter the country.')],
  foundedYear: [minNumber(1800, 'Enter a year after 1800.'), maxNumber(new Date().getFullYear(), 'The year cannot be in the future.')],
  email: [email()],
  phone: [phone()],
  website: [pattern(/^https?:\/\/\S+\.\S+$/i, 'Start with http:// or https://')],
};

/** ORG-02 */
export default function OrganizationProfilePage() {
  const { org, can } = usePortal();
  const { institutions } = useOrgData();
  const apply = useApply();
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const canEdit = can('org.profile.edit').allowed;
  const members = institutions.filter((inst) => inst.orgId === org.id);

  const form = useForm<Values>(
    () => ({
      name: org.name,
      legalName: org.legalName ?? '',
      type: org.type,
      governance: org.governance ?? '',
      country: org.country,
      foundedYear: org.foundedYear ? String(org.foundedYear) : '',
      registrationNo: org.registrationNo ?? '',
      email: org.email ?? '',
      phone: org.phone ?? '',
      website: org.website ?? '',
      address: org.address ?? '',
    }),
    SCHEMA,
  );

  const open = () => {
    form.reset({
      name: org.name,
      legalName: org.legalName ?? '',
      type: org.type,
      governance: org.governance ?? '',
      country: org.country,
      foundedYear: org.foundedYear ? String(org.foundedYear) : '',
      registrationNo: org.registrationNo ?? '',
      email: org.email ?? '',
      phone: org.phone ?? '',
      website: org.website ?? '',
      address: org.address ?? '',
    });
    setFormError('');
    setEditing(true);
  };

  const save = form.handleSubmit((values) => {
    const patch: OrgPatch = {
      name: values.name,
      legalName: values.legalName.trim() || undefined,
      type: values.type as OrgType,
      governance: (values.governance || undefined) as GovernanceModel | undefined,
      country: values.country.trim(),
      foundedYear: values.foundedYear ? Number(values.foundedYear) : undefined,
      registrationNo: values.registrationNo.trim() || undefined,
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
      website: values.website.trim() || undefined,
      address: values.address.trim() || undefined,
    };
    const result = apply((snap, now, actor) => updateOrganization(snap, org.id, patch, actor, now), 'Organization details saved.');
    if (result.ok) setEditing(false);
    else setFormError(result.error);
  });

  const counts = members.reduce<Record<string, number>>((all, inst) => {
    const key = inst.relationship?.type ?? 'member';
    all[key] = (all[key] ?? 0) + 1;
    return all;
  }, {});

  return (
    <PageContainer>
      <PageHeader
        title="Organization profile"
        eyebrow="ORG-02"
        description="Legal details and contacts. Changes are recorded in the change history."
        breadcrumbs={[{ label: org.name, to: `/org/${org.id}` }, { label: 'Organization profile' }]}
        actions={
          <Button variant="primary" icon={<Pencil size={16} aria-hidden="true" />} onClick={open} disabled={!canEdit} title={canEdit ? undefined : 'Your role cannot edit the organization'}>
            Edit details
          </Button>
        }
      />
      {!canEdit && (
        <Alert tone="info" className="mb-6">
          You can read this page. Your role does not allow changes.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Identity" className="lg:col-span-2">
          <DescriptionList
            items={[
              { label: 'Name', value: org.name },
              { label: 'Legal name', value: org.legalName },
              { label: 'Type', value: ORG_TYPE_LABEL[org.type] },
              { label: 'Governance', value: org.governance ? GOVERNANCE.find((item) => item.value === org.governance)?.label : undefined },
              { label: 'Country', value: org.country },
              { label: 'Founded', value: org.foundedYear },
              { label: 'Registration number', value: org.registrationNo },
            ]}
          />
        </Card>
        <Card title="Structure">
          <p className="mb-3 text-sm text-charcoal-700">{members.length} institutions</p>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(counts).map(([type, count]) => (
              <li key={type} className="flex justify-between gap-3">
                <span className="text-charcoal-600">{RELATIONSHIP_LABEL[type as keyof typeof RELATIONSHIP_LABEL]}</span>
                <span className="font-medium text-charcoal-900">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Contact" className="lg:col-span-3">
          <DescriptionList
            columns={3}
            items={[
              { label: 'Email', value: org.email },
              { label: 'Phone', value: org.phone },
              { label: 'Website', value: org.website },
              { label: 'Address', value: org.address },
            ]}
          />
        </Card>
      </div>

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit organization"
        size="md"
        footer={
          <>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="org-form">
              Save changes
            </Button>
          </>
        }
      >
        <form id="org-form" onSubmit={save} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formError && (
            <div className="sm:col-span-2">
              <Alert tone="danger">{formError}</Alert>
            </div>
          )}
          <TextField label="Name" required autoFocus {...form.bind('name')} />
          <TextField label="Legal name" hint="As registered, if different." {...form.bind('legalName')} />
          <SelectField label="Type" options={(org.implicit ? [org.type] : EDITABLE_TYPES).map((value) => ({ value, label: ORG_TYPE_LABEL[value] }))} disabled={org.implicit} {...form.bind('type')} />
          <SelectField label="Governance" placeholder="Not set" options={GOVERNANCE} {...form.bind('governance')} />
          <TextField label="Country" required {...form.bind('country')} />
          <TextField label="Founded in" type="number" {...form.bind('foundedYear')} />
          <TextField label="Registration number" {...form.bind('registrationNo')} />
          <TextField label="Email" type="email" {...form.bind('email')} />
          <TextField label="Phone" type="tel" {...form.bind('phone')} />
          <TextField label="Website" type="url" placeholder="https://" {...form.bind('website')} />
          <TextareaField className="sm:col-span-2" label="Address" rows={2} {...form.bind('address')} />
        </form>
      </Dialog>
    </PageContainer>
  );
}
