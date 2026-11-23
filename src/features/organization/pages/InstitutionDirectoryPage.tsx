import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { SHARE_DOMAINS, SHARE_LEVEL_LABEL } from '../../../core/org/model';
import { setInstitutionStatus } from '../../../core/org/ops';
import { formatDate, isExternal, shareLevelFor } from '../../../core/org/rules';
import { PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Institution } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { DescriptionList, PageHeader } from '../../../shared/ui/Layout';
import { Drawer } from '../../../shared/ui/Overlay';
import { useApply, useOrgData, useWorld } from '../hooks';

type StatusAction = { inst: Institution; status: Institution['status']; label: string; needsReason: boolean };

/** ORG-03 */
export default function InstitutionDirectoryPage() {
  const { org, can, canIn, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const members = institutions.filter((inst) => inst.orgId === org.id);
  const [profile, setProfile] = useState('');
  const [relationship, setRelationship] = useState('');
  const [status, setStatus] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [action, setAction] = useState<StatusAction | null>(null);
  const [error, setError] = useState('');

  const rows = useMemo(
    () =>
      members.filter(
        (inst) =>
          (!profile || inst.profile === profile) &&
          (!relationship || (inst.relationship?.type ?? 'member') === relationship) &&
          (!status || inst.status === status),
      ),
    [members, profile, relationship, status],
  );
  const detail = members.find((inst) => inst.id === detailId) ?? null;
  const unitNames = (inst: Institution) => world.units.filter((unit) => !unit.archived && unit.instIds.includes(inst.id)).map((unit) => unit.name);
  const board = (inst: Institution) => world.curricula.find((item) => item.instId === inst.id)?.board ?? '';
  const activeCampuses = (inst: Institution) => inst.campuses.filter((campus) => (campus.status ?? 'active') === 'active').length;
  const mayApprove = can('org.institutions.approve').allowed;
  const relationshipOptions = Array.from(new Set(members.map((inst) => inst.relationship?.type ?? 'member'))).map((value) => ({ value, label: RELATIONSHIP_LABEL[value] }));

  const runAction = (reason: string) => {
    if (!action) return;
    const result = apply((snap, now, actor) => setInstitutionStatus(snap, action.inst.id, action.status, actor, now, reason), `${action.inst.shortName}: done.`);
    if (!result.ok) setError(result.error);
    else setError('');
  };

  const statusButtons = (inst: Institution) => {
    if (!mayApprove) return null;
    const buttons: StatusAction[] = [];
    if (inst.status === 'pending') buttons.push({ inst, status: 'active', label: 'Approve', needsReason: false });
    if (inst.status === 'active') buttons.push({ inst, status: 'suspended', label: 'Suspend', needsReason: true });
    if (inst.status === 'suspended') buttons.push({ inst, status: 'active', label: 'Reactivate', needsReason: false });
    if (inst.status !== 'archived') buttons.push({ inst, status: 'archived', label: 'Archive', needsReason: true });
    else buttons.push({ inst, status: 'active', label: 'Restore', needsReason: false });
    return buttons;
  };

  const columns: Column<Institution>[] = [
    {
      key: 'name',
      header: 'Institution',
      sortable: true,
      accessor: (row) => row.name,
      cell: (row) => (
        <button type="button" onClick={() => setDetailId(row.id)} className="text-left font-medium text-primary-700 hover:underline">
          {row.name}
        </button>
      ),
    },
    { key: 'profile', header: 'Type', sortable: true, accessor: (row) => PROFILE_LABEL[row.profile] },
    {
      key: 'relationship',
      header: 'Relationship',
      sortable: true,
      accessor: (row) => RELATIONSHIP_LABEL[row.relationship?.type ?? 'member'],
      cell: (row) => (
        <span className="inline-flex flex-wrap items-center gap-2">
          {RELATIONSHIP_LABEL[row.relationship?.type ?? 'member']}
          {isExternal(row) && <Badge tone="info">Independent</Badge>}
        </span>
      ),
    },
    { key: 'city', header: 'City', sortable: true, accessor: (row) => row.city },
    { key: 'campuses', header: 'Campuses', sortable: true, align: 'right', accessor: (row) => activeCampuses(row) },
    { key: 'board', header: 'Board', sortable: true, accessor: (row) => board(row), defaultHidden: true },
    { key: 'units', header: 'Units', accessor: (row) => unitNames(row).join('; '), defaultHidden: true },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Institutions"
        eyebrow="ORG-03"
        description={`All institutions of ${org.name}. Open the details to see structure, status and what an independent institution shares.`}
        breadcrumbs={[{ label: org.name, to: `/org/${org.id}` }, { label: 'Institutions' }]}
        actions={
          can('org.institutions.create').allowed ? (
            <Link to={path('institutions/new')} className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} aria-hidden="true" />
              Add institution
            </Link>
          ) : undefined
        }
      />
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Institutions"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => `${row.name} ${row.shortName} ${row.city} ${board(row)}`}
          searchPlaceholder="Search by name, city or board"
          exportName={can('org.institutions.export').allowed ? `${org.id}-institutions` : undefined}
          initialSort={{ key: 'name', direction: 'asc' }}
          filters={
            <div className="flex flex-wrap items-end gap-3">
              <SelectField label="Type" hideLabel placeholder="All types" value={profile} onChange={setProfile} options={Object.entries(PROFILE_LABEL).map(([value, label]) => ({ value, label }))} />
              <SelectField label="Relationship" hideLabel placeholder="All relationships" value={relationship} onChange={setRelationship} options={relationshipOptions} />
              <SelectField label="Status" hideLabel placeholder="All statuses" value={status} onChange={setStatus} options={['active', 'pending', 'suspended', 'archived'].map((value) => ({ value, label: value }))} />
            </div>
          }
          rowActions={(row) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" icon={<Eye size={14} aria-hidden="true" />} onClick={() => setDetailId(row.id)} aria-label={`Details of ${row.shortName}`}>
                Details
              </Button>
              {row.status === 'pending' && mayApprove && (
                <Button size="sm" variant="primary" onClick={() => setAction({ inst: row, status: 'active', label: 'Approve', needsReason: false })} aria-label={`Approve ${row.shortName}`}>
                  Approve
                </Button>
              )}
            </div>
          )}
          emptyTitle="No institution matches"
          emptyDescription="Change the filters or search."
        />
      </div>

      <Drawer
        open={detail !== null}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? ''}
        description={detail ? `${PROFILE_LABEL[detail.profile]}, ${detail.city}` : undefined}
        footer={
          detail ? (
            <>
              {!isExternal(detail) && canIn('institution.profile.view', detail.id).allowed && (
                <Link to={`/inst/${detail.id}`} className="btn-secondary">
                  Open institution
                </Link>
              )}
              {(statusButtons(detail) ?? []).map((item) => (
                <Button
                  key={item.label}
                  variant={item.status === 'active' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setAction(item);
                    setDetailId(null);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-6">
            <DescriptionList
              columns={1}
              items={[
                { label: 'Status', value: <StatusBadge status={detail.status} /> },
                { label: 'Relationship', value: RELATIONSHIP_LABEL[detail.relationship?.type ?? 'member'] },
                { label: 'Board or regulator', value: board(detail) || undefined },
                { label: 'Active campuses', value: activeCampuses(detail) },
                { label: 'Units', value: unitNames(detail).join(', ') || 'Not in a unit' },
                { label: 'Head of institution', value: detail.headName },
                { label: 'Registration number', value: detail.registrationNo },
                { label: 'Affiliation', value: detail.affiliation },
                { label: 'Current session', value: (() => { const current = world.sessions.find((item) => item.instId === detail.id && item.status === 'current'); return current ? `${current.label} (${formatDate(current.start)} to ${formatDate(current.end)})` : undefined; })() },
              ]}
            />
            {isExternal(detail) ? (
              <section aria-labelledby="share-heading">
                <h3 id="share-heading" className="mb-2 font-semibold text-charcoal-950">
                  What this institution shares with {org.name}
                </h3>
                <p className="mb-3 text-sm text-charcoal-600">It runs independently. Nothing else about its records is visible here.</p>
                <ul className="divide-y divide-warm-200 rounded-xl border border-warm-200">
                  {SHARE_DOMAINS.map((domain) => {
                    const level = shareLevelFor(world, detail, domain.key);
                    return (
                      <li key={domain.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span>{domain.label}</span>
                        <Badge tone={level === 'none' ? 'neutral' : level === 'summary' ? 'info' : 'success'}>{SHARE_LEVEL_LABEL[level]}</Badge>
                      </li>
                    );
                  })}
                </ul>
                <Link to={path('data-sharing')} className="mt-3 inline-block text-sm font-medium text-primary-700 hover:underline">
                  Open data sharing
                </Link>
              </section>
            ) : (
              <p className="text-sm text-charcoal-600">This institution is run by the organization, so the organization sees all of its data.</p>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={runAction}
        title={`${action?.label ?? ''} ${action?.inst.shortName ?? ''}`}
        message={
          action?.status === 'suspended'
            ? 'People of this institution can no longer sign in to it until it is reactivated. Its records stay.'
            : action?.status === 'archived'
              ? 'The institution is hidden from lists. Its records are kept and it can be restored.'
              : action?.inst.status === 'pending'
                ? 'The institution becomes active and can be used.'
                : 'The institution becomes active again.'
        }
        itemName={action?.inst.name}
        confirmLabel={action?.label ?? 'Confirm'}
        tone={action?.status === 'active' ? 'primary' : 'danger'}
        requireReason={action?.needsReason}
      />
    </PageContainer>
  );
}
