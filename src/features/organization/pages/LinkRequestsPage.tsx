import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { inboxActions } from '../../../core/api/inboxStore';
import { usePortal } from '../../../core/context/portalContext';
import { LINK_STATUS_LABEL, OPEN_LINK_STATUSES } from '../../../core/org/model';
import type { LinkRequest } from '../../../core/org/model';
import { createLink } from '../../../core/org/ops';
import { ALLOWED_RELATIONSHIPS, RELATIONSHIP_HELP, formatDate, isIndependent, relationshipProblem } from '../../../core/org/rules';
import { PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Organization, RelationshipType } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextareaField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useOrgData, useWorld } from '../hooks';
import { LINK_TONE, notifyOrganization } from '../linkUi';

/** ORG-09 list */
export default function LinkRequestsPage() {
  const { scope, org, inst, can, path } = usePortal();
  const { organizations, institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [show, setShow] = useState('open');
  const [form, setForm] = useState<{ target: string; relationship: string; note: string } | null>(params.get('new') ? { target: '', relationship: '', note: '' } : null);
  const [error, setError] = useState('');

  const canCreate = scope === 'org' ? can('org.relationships.create').allowed : can('institution.links.create').allowed;
  const independent = scope === 'inst' && inst ? isIndependent(organizations, institutions, inst) : false;

  const rows = useMemo(
    () =>
      world.links
        .filter((link) => (scope === 'org' ? link.parentOrgId === org.id : link.childInstId === inst?.id))
        .filter((link) => (show === 'open' ? OPEN_LINK_STATUSES.includes(link.status) : show === 'closed' ? !OPEN_LINK_STATUSES.includes(link.status) : true)),
    [world.links, scope, org.id, inst?.id, show],
  );

  const nameOf = (id: string) => institutions.find((item) => item.id === id)?.name ?? id;
  const orgName = (id: string) => organizations.find((item) => item.id === id)?.name ?? id;

  // Who can be invited (organization) or which organization can be asked (institution).
  const invitable = institutions.filter(
    (candidate) =>
      isIndependent(organizations, institutions, candidate) &&
      candidate.status === 'active' &&
      candidate.orgId !== org.id &&
      !world.links.some((link) => link.childInstId === candidate.id && OPEN_LINK_STATUSES.includes(link.status)) &&
      ALLOWED_RELATIONSHIPS[org.type].some((type) => relationshipProblem(org, candidate, type) === null),
  );
  const askable: Organization[] = organizations.filter((candidate) => !candidate.implicit && inst && ALLOWED_RELATIONSHIPS[candidate.type].some((type) => relationshipProblem(candidate, inst, type) === null));

  const chosenInst = scope === 'org' ? institutions.find((item) => item.id === form?.target) : inst ?? undefined;
  const chosenOrg = scope === 'org' ? org : organizations.find((item) => item.id === form?.target);
  const relationshipChoices: RelationshipType[] = chosenOrg && chosenInst ? ALLOWED_RELATIONSHIPS[chosenOrg.type].filter((type) => relationshipProblem(chosenOrg, chosenInst, type) === null) : [];

  const submit = () => {
    if (!form || !chosenInst || !chosenOrg) return setError('Choose who to link.');
    if (!form.relationship) return setError('Choose the relationship.');
    const direction = scope === 'org' ? 'invite' : 'apply';
    const result = apply((snap, now, actor) => createLink(snap, { parentOrgId: chosenOrg.id, childInstId: chosenInst.id, relationship: form.relationship as RelationshipType, direction, note: form.note }, actor, now), direction === 'invite' ? 'Invitation sent.' : 'Application sent.');
    if (!result.ok) return setError(result.error);
    if (direction === 'invite') inboxActions.notify(chosenInst.id, `${chosenOrg.name} invited you to join`, `As ${RELATIONSHIP_LABEL[form.relationship as RelationshipType].toLowerCase()}. Open Linking requests to answer.`);
    else notifyOrganization(institutions, chosenOrg.id, `${chosenInst.name} applied to join`, `As ${RELATIONSHIP_LABEL[form.relationship as RelationshipType].toLowerCase()}. Open Linking requests to verify the documents.`);
    setForm(null);
    setParams({});
    navigate(path(`link-requests/${result.linkId}`));
  };

  const columns: Column<LinkRequest>[] = [
    {
      key: 'id',
      header: 'Request',
      sortable: true,
      accessor: (row) => row.id,
      cell: (row) => (
        <Link to={path(`link-requests/${row.id}`)} className="font-medium text-primary-700 hover:underline">
          {row.id}
        </Link>
      ),
    },
    { key: 'inst', header: 'Institution', sortable: true, accessor: (row) => nameOf(row.childInstId) },
    ...(scope === 'inst' ? [{ key: 'org', header: 'Organization', sortable: true, accessor: (row: LinkRequest) => orgName(row.parentOrgId) } as Column<LinkRequest>] : []),
    { key: 'relationship', header: 'Relationship', sortable: true, accessor: (row) => RELATIONSHIP_LABEL[row.relationship] },
    { key: 'direction', header: 'Started as', accessor: (row) => (row.direction === 'invite' ? 'Invitation' : 'Application') },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => LINK_STATUS_LABEL[row.status], cell: (row) => <Badge tone={LINK_TONE[row.status]}>{LINK_STATUS_LABEL[row.status]}</Badge> },
    { key: 'created', header: 'Started', sortable: true, accessor: (row) => row.createdAt, cell: (row) => formatDate(row.createdAt) },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Linking requests"
        eyebrow="ORG-09"
        description={
          scope === 'org'
            ? `Bring an existing institution into ${org.name}. The institution must accept, its documents are verified, and then the request is approved.`
            : `Ask a group, trust or university to take ${inst?.shortName}, or answer an invitation. Nothing changes until the request is approved.`
        }
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Linking requests' }]}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => { setError(''); setForm({ target: '', relationship: '', note: '' }); }}
            disabled={!canCreate || (scope === 'inst' && !independent) || (scope === 'org' && ALLOWED_RELATIONSHIPS[org.type].length === 0)}
            title={scope === 'inst' && !independent ? 'This institution already belongs to an organization' : canCreate ? undefined : 'Your role cannot start requests'}
          >
            {scope === 'org' ? 'Invite an institution' : 'Ask to join'}
          </Button>
        }
      />
      {scope === 'inst' && !independent && (
        <Alert tone="info" className="mb-4">
          {inst?.shortName} belongs to {org.name}. To leave, ask {org.name} to end the relationship.
        </Alert>
      )}
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Linking requests"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => `${row.id} ${nameOf(row.childInstId)} ${orgName(row.parentOrgId)}`}
          searchPlaceholder="Search requests"
          initialSort={{ key: 'created', direction: 'desc' }}
          filters={
            <SelectField
              label="Show"
              hideLabel
              value={show}
              onChange={setShow}
              options={[
                { value: 'open', label: 'Open requests' },
                { value: 'closed', label: 'Finished requests' },
                { value: 'all', label: 'All requests' },
              ]}
            />
          }
          rowActions={(row) => (
            <Link to={path(`link-requests/${row.id}`)} className="btn-secondary !px-3 !py-1.5 text-sm" aria-label={`Open ${row.id}`}>
              Open
            </Link>
          )}
          emptyTitle={show === 'open' ? 'No open requests' : 'No requests'}
          emptyDescription="Requests appear here from the moment they are sent."
        />
      </div>

      <Dialog
        open={form !== null}
        onClose={() => { setForm(null); setParams({}); }}
        title={scope === 'org' ? 'Invite an institution' : 'Ask to join an organization'}
        description={scope === 'org' ? `The institution must accept before documents are checked.` : 'The organization verifies your documents and approves.'}
        footer={
          <>
            <Button onClick={() => { setForm(null); setParams({}); }}>Cancel</Button>
            <Button variant="primary" onClick={submit}>
              {scope === 'org' ? 'Send invitation' : 'Send application'}
            </Button>
          </>
        }
      >
        {form && (
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            {scope === 'org' ? (
              <>
                <SelectField
                  label="Institution"
                  required
                  placeholder={invitable.length === 0 ? 'No institution can be invited' : 'Choose an institution'}
                  options={invitable.map((item) => ({ value: item.id, label: `${item.name} (${PROFILE_LABEL[item.profile]}, ${item.city})` }))}
                  value={form.target}
                  onChange={(value) => setForm({ ...form, target: value, relationship: '' })}
                  hint="Only independent institutions without an open request are listed."
                />
                <p className="text-sm text-charcoal-600">
                  Not on the platform yet?{' '}
                  <Link to={path('institutions/new')} className="font-medium text-primary-700 hover:underline">
                    Create it in {org.name}
                  </Link>
                </p>
              </>
            ) : (
              <SelectField
                label="Organization"
                required
                placeholder={askable.length === 0 ? 'No organization can take this institution' : 'Choose an organization'}
                options={askable.map((item) => ({ value: item.id, label: item.name }))}
                value={form.target}
                onChange={(value) => setForm({ ...form, target: value, relationship: '' })}
              />
            )}
            <SelectField
              label="Relationship"
              required
              placeholder={form.target ? 'Choose' : 'Choose who first'}
              options={relationshipChoices.map((type) => ({ value: type, label: RELATIONSHIP_LABEL[type] }))}
              value={form.relationship}
              onChange={(value) => setForm({ ...form, relationship: value })}
              hint={form.relationship ? `${RELATIONSHIP_HELP[form.relationship as RelationshipType].summary} ${RELATIONSHIP_HELP[form.relationship as RelationshipType].sees}` : undefined}
              disabled={!form.target}
            />
            <TextareaField label="Note" rows={3} value={form.note} onChange={(value) => setForm({ ...form, note: value })} hint="Optional. Seen by both sides." />
          </form>
        )}
      </Dialog>
    </PageContainer>
  );
}
