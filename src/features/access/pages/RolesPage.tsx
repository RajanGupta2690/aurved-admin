import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Plus } from 'lucide-react';
import { useStore } from '../../../core/api/persistedStore';
import { accessStore } from '../../../core/api/stores';
import { usePortal } from '../../../core/context/portalContext';
import { roleScopeFor, SCOPE_LABEL } from '../../../core/access/engine';
import type { RoleDef } from '../../../core/access/engine';
import { matrixCounts, matrixOf } from '../../../core/access/matrix';
import { peopleWithRole, rolesOf, setRoleArchived } from '../../../core/org/accessOps';
import { snapshot } from '../../../core/api/worldStore';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { CheckboxField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { useApply } from '../../organization/hooks';
import SectionNav from '../components/SectionNav';
import { ROLE_PAGES } from '../sections';

/** ACC-07 */
export default function RolesPage() {
  const { scope, org, inst, can, path } = usePortal();
  const { roles } = useStore(accessStore);
  const apply = useApply();
  const [archived, setArchived] = useState(false);
  const [archiving, setArchiving] = useState<RoleDef | null>(null);
  const [error, setError] = useState('');
  const canCreate = can('access.roles.create').allowed;
  const canArchive = can('access.roles.archive').allowed;

  const rows = rolesOf(roles, org.id, archived).filter((role) => scope === 'org' || role.level === 'inst');
  const people = (role: RoleDef) => peopleWithRole(snapshot(), role.id).length;

  const columns: Column<RoleDef>[] = [
    {
      key: 'name',
      header: 'Role',
      sortable: true,
      accessor: (row) => row.name,
      cell: (row) => (
        <div>
          <Link to={path(`roles/${row.id}`)} className="font-medium text-primary-700 hover:underline">
            {row.name}
          </Link>
          <p className="text-xs text-charcoal-600">{row.description}</p>
        </div>
      ),
    },
    { key: 'kind', header: 'Kind', sortable: true, accessor: (row) => (row.system ? 'System' : 'Custom'), cell: (row) => <Badge tone={row.system ? 'neutral' : 'brand'}>{row.system ? 'System' : 'Custom'}</Badge> },
    { key: 'level', header: 'Works', sortable: true, accessor: (row) => (row.level === 'org' ? 'Whole organization' : 'One institution') },
    { key: 'people', header: 'People', sortable: true, align: 'right', accessor: (row) => people(row) },
    { key: 'allowed', header: 'Permissions', sortable: true, align: 'right', accessor: (row) => matrixCounts(matrixOf(row.permissions)).allowed },
    { key: 'scope', header: 'Data scope', accessor: (row) => SCOPE_LABEL[roleScopeFor(row, '')] },
    { key: 'status', header: 'Status', accessor: (row) => (row.archived ? 'archived' : 'active'), cell: (row) => <StatusBadge status={row.archived ? 'archived' : 'active'} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Roles"
        eyebrow="ACC-07"
        description={`Roles decide what a person can do. System roles come with the platform and cannot be changed. Duplicate one, or build your own, for ${org.implicit ? inst?.shortName : org.name}.`}
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Roles' }]}
        actions={
          <Link to={path('roles/new')} aria-disabled={!canCreate} className={canCreate ? 'btn-primary inline-flex items-center gap-2' : 'btn-primary pointer-events-none inline-flex items-center gap-2 opacity-50'} tabIndex={canCreate ? undefined : -1}>
            <Plus size={18} aria-hidden="true" />
            New role
          </Link>
        }
      />
      <SectionNav label="Role pages" items={ROLE_PAGES} />
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Roles"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => `${row.name} ${row.description}`}
          searchPlaceholder="Search roles"
          initialSort={{ key: 'name', direction: 'asc' }}
          filters={<CheckboxField label="Show archived roles" checked={archived} onChange={setArchived} />}
          rowActions={(row) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Link to={path(`roles/${row.id}`)} className="btn-secondary !px-3 !py-1.5 text-sm" aria-label={`${row.system ? 'View' : 'Edit'} ${row.name}`}>
                {row.system ? 'View' : 'Edit'}
              </Link>
              <Link to={`${path('roles/new')}?from=${row.id}`} className="btn-secondary inline-flex items-center gap-1 !px-3 !py-1.5 text-sm" aria-label={`Duplicate ${row.name}`}>
                <Copy size={14} aria-hidden="true" />
                Duplicate
              </Link>
              {!row.system &&
                (row.archived ? (
                  <Button size="sm" disabled={!canArchive} onClick={() => setError(apply((snap, now, actor) => setRoleArchived(snap, row.id, false, actor, now), `${row.name} restored.`).ok ? '' : 'Could not restore.')} aria-label={`Restore ${row.name}`}>
                    Restore
                  </Button>
                ) : (
                  <Button size="sm" disabled={!canArchive} onClick={() => { setError(''); setArchiving(row); }} aria-label={`Archive ${row.name}`}>
                    Archive
                  </Button>
                ))}
            </div>
          )}
          emptyTitle="No roles"
        />
      </div>

      <ConfirmDialog
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={(reason) => {
          if (!archiving) return;
          const result = apply((snap, now, actor) => setRoleArchived(snap, archiving.id, true, actor, now, reason), `${archiving.name} archived.`);
          setError(result.ok ? '' : result.error);
        }}
        title="Archive role"
        message="The role can no longer be given to anyone. It is kept for the history and can be restored."
        itemName={archiving?.name}
        confirmLabel="Archive"
        requireReason
      />
    </PageContainer>
  );
}
