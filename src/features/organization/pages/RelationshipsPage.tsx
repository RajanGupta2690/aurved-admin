import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Unlink } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { SHARE_DOMAINS } from '../../../core/org/model';
import { changeRelationship, endRelationship } from '../../../core/org/ops';
import { ALLOWED_RELATIONSHIPS, RELATIONSHIP_HELP, isExternal, relationshipProblem, sharedDomainCount } from '../../../core/org/rules';
import { PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Institution, RelationshipType } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextareaField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useOrgData, useWorld } from '../hooks';

/** ORG-08 */
export default function RelationshipsPage() {
  const { org, can, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const [changing, setChanging] = useState<{ inst: Institution; type: string; reason: string } | null>(null);
  const [changeError, setChangeError] = useState('');
  const [ending, setEnding] = useState<Institution | null>(null);
  const [actionError, setActionError] = useState('');

  const allowed = ALLOWED_RELATIONSHIPS[org.type];
  const members = institutions.filter((inst) => inst.orgId === org.id);
  const isMain = (inst: Institution) => inst.profile === 'university' && !inst.relationship && org.type === 'university';
  const typeOf = (inst: Institution): RelationshipType => inst.relationship?.type ?? 'member';
  const canEdit = can('org.relationships.edit').allowed;
  const canEnd = can('org.relationships.archive').allowed;
  const canInvite = can('org.relationships.create').allowed;

  const submitChange = () => {
    if (!changing) return;
    const result = apply((snap, now, actor) => changeRelationship(snap, changing.inst.id, changing.type as RelationshipType, actor, now, changing.reason), `${changing.inst.shortName}: relationship changed.`);
    if (result.ok) setChanging(null);
    else setChangeError(result.error);
  };

  const columns: Column<Institution>[] = [
    { key: 'name', header: 'Institution', sortable: true, accessor: (row) => row.name, cell: (row) => <span className="font-medium text-charcoal-900">{row.name}</span> },
    { key: 'profile', header: 'Type', sortable: true, accessor: (row) => PROFILE_LABEL[row.profile] },
    {
      key: 'relationship',
      header: 'Relationship',
      sortable: true,
      accessor: (row) => (isMain(row) ? 'Main institution' : RELATIONSHIP_LABEL[typeOf(row)]),
      cell: (row) => (isMain(row) ? <Badge tone="brand">Main institution</Badge> : <span>{RELATIONSHIP_LABEL[typeOf(row)]}</span>),
    },
    {
      key: 'sees',
      header: 'What the organization sees',
      accessor: (row) => (isMain(row) ? 'Everything' : isExternal(row) ? `${sharedDomainCount(world, row)} of ${SHARE_DOMAINS.length} areas shared` : 'Everything'),
      cell: (row) =>
        isExternal(row) ? (
          <Link to={path('data-sharing')} className="text-primary-700 hover:underline">
            {sharedDomainCount(world, row)} of {SHARE_DOMAINS.length} areas shared
          </Link>
        ) : (
          'Everything'
        ),
    },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status} /> },
  ];

  const options = (inst: Institution) =>
    allowed
      .filter((type) => type !== typeOf(inst))
      .map((type) => {
        const problem = relationshipProblem(org, inst, type);
        return { value: type, label: problem ? `${RELATIONSHIP_LABEL[type]} (not possible)` : RELATIONSHIP_LABEL[type], disabled: problem !== null };
      });

  return (
    <PageContainer>
      <PageHeader
        title="Relationships"
        eyebrow="ORG-08"
        description={`How each institution relates to ${org.name}. The relationship decides who runs the institution and what the organization may see.`}
        breadcrumbs={[{ label: org.name, to: path() }, { label: 'Relationships' }]}
        actions={
          canInvite && allowed.length > 0 ? (
            <Link to={`${path('link-requests')}?new=1`} className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} aria-hidden="true" />
              Invite an institution
            </Link>
          ) : undefined
        }
      />
      {actionError && (
        <Alert tone="danger" className="mb-4">
          {actionError}
        </Alert>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card !p-0 overflow-hidden xl:col-span-2">
          <DataTable
            caption="Institutions and their relationship"
            rows={members}
            columns={columns}
            rowKey={(row) => row.id}
            searchText={(row) => `${row.name} ${RELATIONSHIP_LABEL[typeOf(row)]}`}
            searchPlaceholder="Search institutions"
            initialSort={{ key: 'name', direction: 'asc' }}
            rowActions={(row) =>
              isMain(row) ? (
                <span className="text-sm text-charcoal-600">Fixed</span>
              ) : (
                <div className="flex flex-wrap justify-end gap-2">
                  {allowed.length > 1 && (
                    <Button size="sm" disabled={!canEdit} onClick={() => { setChangeError(''); setChanging({ inst: row, type: '', reason: '' }); }} aria-label={`Change relationship of ${row.shortName}`}>
                      Change
                    </Button>
                  )}
                  <Button size="sm" icon={<Unlink size={14} aria-hidden="true" />} disabled={!canEnd} onClick={() => { setActionError(''); setEnding(row); }} aria-label={`End relationship with ${row.shortName}`}>
                    End
                  </Button>
                </div>
              )
            }
          />
        </div>
        <Card title="What each relationship means">
          {allowed.length === 0 ? (
            <p className="text-sm text-charcoal-600">This organization cannot take other institutions.</p>
          ) : (
            <dl className="space-y-4 text-sm">
              {allowed.map((type) => (
                <div key={type}>
                  <dt className="font-medium text-charcoal-900">{RELATIONSHIP_LABEL[type]}</dt>
                  <dd className="text-charcoal-700">{RELATIONSHIP_HELP[type].summary}</dd>
                  <dd className="text-charcoal-600">{RELATIONSHIP_HELP[type].sees}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>

      <Dialog
        open={changing !== null}
        onClose={() => setChanging(null)}
        title={`Change relationship of ${changing?.inst.shortName ?? ''}`}
        footer={
          <>
            <Button onClick={() => setChanging(null)}>Cancel</Button>
            <Button variant="primary" onClick={submitChange}>
              Change relationship
            </Button>
          </>
        }
      >
        {changing && (
          <form onSubmit={(event) => { event.preventDefault(); submitChange(); }} noValidate className="space-y-4">
            {changeError && <Alert tone="danger">{changeError}</Alert>}
            <p className="text-sm text-charcoal-700">Now: {RELATIONSHIP_LABEL[typeOf(changing.inst)]}.</p>
            <SelectField label="New relationship" required placeholder="Choose" options={options(changing.inst)} value={changing.type} onChange={(value) => setChanging({ ...changing, type: value })} />
            {changing.type && isExternal(changing.inst) !== (changing.type !== 'member' && changing.type !== 'constituent' && changing.type !== 'owned_campus') && (
              <Alert tone="warning" title="This changes what the organization can see">
                {isExternal(changing.inst) ? 'The organization will see everything. The data sharing agreements are removed.' : 'The organization will see nothing until the institution agrees to share.'}
              </Alert>
            )}
            <TextareaField label="Reason" required rows={3} value={changing.reason} onChange={(value) => setChanging({ ...changing, reason: value })} hint="Written to the change history." />
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={ending !== null}
        onClose={() => setEnding(null)}
        onConfirm={(reason) => {
          if (!ending) return;
          const result = apply((snap, now, actor) => endRelationship(snap, ending.id, actor, now, reason), `${ending.shortName} is now independent.`);
          setActionError(result.ok ? '' : result.error);
        }}
        title="End the relationship"
        message="The institution leaves the organization and becomes independent with its own account. Its records go with it. People who only hold a role in the organization lose access to it. The history stays."
        itemName={ending?.name}
        confirmLabel="End relationship"
        requireReason
      />
    </PageContainer>
  );
}
