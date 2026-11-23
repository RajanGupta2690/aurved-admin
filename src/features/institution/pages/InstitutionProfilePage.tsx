import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useInstitution, usePortal } from '../../../core/context/portalContext';
import { GRADING_SCHEMES, POLICY_CATALOG } from '../../../core/org/model';
import { updateInstitution } from '../../../core/org/ops';
import { RELATIONSHIP_HELP, formatDate, isExternal, isIndependent, monthName, policyFor } from '../../../core/org/rules';
import { ORG_TYPE_LABEL, PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import { TextareaField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, DescriptionList, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useForm } from '../../../shared/ui/useForm';
import { email, maxNumber, minNumber, phone, required } from '../../../shared/ui/validators';
import { useApply, useOrgData, useWorld } from '../../organization/hooks';

interface Values extends Record<string, unknown> {
  name: string;
  shortName: string;
  city: string;
  country: string;
  headName: string;
  registrationNo: string;
  foundedYear: string;
  email: string;
  phone: string;
  address: string;
  affiliation: string;
}

const SCHEMA = {
  name: [required('Enter the full name.')],
  shortName: [required('Enter a short name.')],
  city: [required('Enter the city.')],
  country: [required('Enter the country.')],
  foundedYear: [minNumber(1800, 'Enter a year after 1800.'), maxNumber(new Date().getFullYear(), 'The year cannot be in the future.')],
  email: [email()],
  phone: [phone()],
};

/** ORG-04 */
export default function InstitutionProfilePage() {
  const inst = useInstitution();
  const { org, can, path } = usePortal();
  const { organizations, institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const canEdit = can('institution.profile.edit').allowed;
  const independent = isIndependent(organizations, institutions, inst);

  const valuesOf = (): Values => ({
    name: inst.name,
    shortName: inst.shortName,
    city: inst.city,
    country: inst.country,
    headName: inst.headName ?? '',
    registrationNo: inst.registrationNo ?? '',
    foundedYear: inst.foundedYear ? String(inst.foundedYear) : '',
    email: inst.email ?? '',
    phone: inst.phone ?? '',
    address: inst.address ?? '',
    affiliation: inst.affiliation ?? '',
  });
  const form = useForm<Values>(valuesOf, SCHEMA);

  const save = form.handleSubmit((values) => {
    const result = apply(
      (snap, now, actor) =>
        updateInstitution(
          snap,
          inst.id,
          {
            name: values.name.trim(),
            shortName: values.shortName.trim(),
            city: values.city.trim(),
            country: values.country.trim(),
            headName: values.headName.trim() || undefined,
            registrationNo: values.registrationNo.trim() || undefined,
            foundedYear: values.foundedYear ? Number(values.foundedYear) : undefined,
            email: values.email.trim() || undefined,
            phone: values.phone.trim() || undefined,
            address: values.address.trim() || undefined,
            affiliation: values.affiliation.trim() || undefined,
          },
          actor,
          now,
        ),
      'Institution details saved.',
    );
    if (result.ok) setEditing(false);
    else setFormError(result.error);
  });

  const curriculum = world.curricula.find((item) => item.instId === inst.id);
  const current = world.sessions.find((item) => item.instId === inst.id && item.status === 'current');
  const units = world.units.filter((unit) => !unit.archived && unit.instIds.includes(inst.id));
  const parent = inst.relationship ? institutions.find((item) => item.id === inst.relationship!.parentInstId) : undefined;
  const relationshipType = inst.relationship?.type ?? (independent ? undefined : 'member');
  const activeCampuses = inst.campuses.filter((campus) => (campus.status ?? 'active') === 'active');

  return (
    <PageContainer>
      <PageHeader
        title={inst.name}
        eyebrow="ORG-04"
        description={`${PROFILE_LABEL[inst.profile]}, ${inst.city}`}
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Institution profile' }]}
        actions={
          <>
            <StatusBadge status={inst.status} />
            <Button
              variant="primary"
              icon={<Pencil size={16} aria-hidden="true" />}
              onClick={() => {
                form.reset(valuesOf());
                setFormError('');
                setEditing(true);
              }}
              disabled={!canEdit}
              title={canEdit ? undefined : 'Your role cannot edit the institution'}
            >
              Edit details
            </Button>
          </>
        }
      />
      {inst.status === 'pending' && (
        <Alert tone="warning" title="Waiting for approval" className="mb-4">
          {org.implicit ? 'This institution has not been approved yet.' : `${org.name} has not approved this institution yet.`}
        </Alert>
      )}

      <Tabs
        label="Institution profile"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Details' },
          { id: 'structure', label: 'Where it belongs' },
          { id: 'rules', label: 'Rules that apply' },
        ]}
      />

      <TabPanel id="overview" value={tab}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Identity" className="lg:col-span-2">
            <DescriptionList
              items={[
                { label: 'Full name', value: inst.name },
                { label: 'Short name', value: inst.shortName },
                { label: 'Type', value: PROFILE_LABEL[inst.profile] },
                { label: 'Head of institution', value: inst.headName },
                { label: 'Registration number', value: inst.registrationNo },
                { label: 'Founded', value: inst.foundedYear },
                { label: 'Affiliation', value: inst.affiliation },
                { label: 'Board or regulator', value: curriculum?.board },
              ]}
            />
          </Card>
          <Card title="Right now">
            <DescriptionList
              columns={1}
              items={[
                { label: 'Current session', value: current ? `${current.label} (${formatDate(current.start)} to ${formatDate(current.end)})` : 'None. Plan one in Academic sessions.' },
                { label: 'Active campuses', value: activeCampuses.map((campus) => campus.name).join(', ') },
                { label: 'Grading scheme', value: GRADING_SCHEMES.find((item) => item.value === curriculum?.gradingScheme)?.label },
              ]}
            />
          </Card>
          <Card title="Contact" className="lg:col-span-3">
            <DescriptionList
              columns={3}
              items={[
                { label: 'Email', value: inst.email },
                { label: 'Phone', value: inst.phone },
                { label: 'City and country', value: `${inst.city}, ${inst.country}` },
                { label: 'Address', value: inst.address },
              ]}
            />
          </Card>
        </div>
      </TabPanel>

      <TabPanel id="structure" value={tab}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Organization">
            {independent ? (
              <div className="space-y-3 text-sm">
                <p className="text-charcoal-700">This institution is independent. It has no parent organization and nobody above it sees its records.</p>
                <p>
                  <Link to={path('link-requests')} className="font-medium text-primary-700 hover:underline">
                    Ask to join a group, trust or university
                  </Link>
                </p>
              </div>
            ) : (
              <DescriptionList
                columns={1}
                items={[
                  { label: 'Organization', value: `${org.name} (${ORG_TYPE_LABEL[org.type].toLowerCase()})` },
                  { label: 'Relationship', value: relationshipType ? <span className="inline-flex flex-wrap items-center gap-2">{RELATIONSHIP_LABEL[relationshipType]}{isExternal(inst) && <Badge tone="info">Runs independently</Badge>}</span> : undefined },
                  { label: 'What the organization sees', value: relationshipType ? RELATIONSHIP_HELP[relationshipType].sees : undefined },
                  { label: 'Main institution', value: parent?.name },
                ]}
              />
            )}
          </Card>
          <Card title="Units">
            {units.length === 0 ? (
              <p className="text-sm text-charcoal-600">{independent ? 'An independent institution is not part of a hierarchy.' : 'Not placed in any unit of the organization.'}</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {units.map((unit) => (
                  <li key={unit.id} className="text-charcoal-900">
                    {unit.name}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </TabPanel>

      <TabPanel id="rules" value={tab}>
        <Card title="Rules of the organization" description={independent ? undefined : `Set by ${org.name}. They apply when this institution is created or edited.`}>
          {independent ? (
            <p className="text-sm text-charcoal-700">No organization sets rules for this institution.</p>
          ) : (
            <ul className="divide-y divide-warm-200">
              {POLICY_CATALOG.map((policy) => {
                const setting = policyFor(world, org.id, policy.key);
                const text = !setting
                  ? 'Not enforced'
                  : policy.input === 'grading'
                    ? GRADING_SCHEMES.find((item) => item.value === setting.value)?.label
                    : policy.input === 'month'
                      ? `Month: ${monthName(Number(setting.value))}`
                      : policy.input === 'sharing'
                        ? setting.value === 'summary'
                          ? 'Starts with summary only'
                          : 'Starts with nothing shared'
                        : `Must start with "${setting.value}"`;
                return (
                  <li key={policy.key} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-charcoal-900">{policy.label}</p>
                      <p className="text-xs text-charcoal-600">{policy.description}</p>
                    </div>
                    <Badge tone={setting ? 'brand' : 'neutral'}>{text}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </TabPanel>

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit institution"
        footer={
          <>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="inst-form">
              Save changes
            </Button>
          </>
        }
      >
        <form id="inst-form" onSubmit={save} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formError && (
            <div className="sm:col-span-2">
              <Alert tone="danger">{formError}</Alert>
            </div>
          )}
          <TextField className="sm:col-span-2" label="Full name" required autoFocus {...form.bind('name')} />
          <TextField label="Short name" required {...form.bind('shortName')} />
          <TextField label="Head of institution" {...form.bind('headName')} />
          <TextField label="City" required {...form.bind('city')} />
          <TextField label="Country" required {...form.bind('country')} />
          <TextField label="Registration number" {...form.bind('registrationNo')} />
          <TextField label="Founded in" type="number" {...form.bind('foundedYear')} />
          <TextField label="Email" type="email" {...form.bind('email')} />
          <TextField label="Phone" type="tel" {...form.bind('phone')} />
          <TextField className="sm:col-span-2" label="Affiliation text" hint="Shown on the profile, for example the board and affiliation number." {...form.bind('affiliation')} />
          <TextareaField className="sm:col-span-2" label="Address" rows={2} {...form.bind('address')} />
        </form>
      </Dialog>
    </PageContainer>
  );
}
