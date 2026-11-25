import { useState } from 'react';
import { useStore } from '../../../core/api/persistedStore';
import { accessStore } from '../../../core/api/stores';
import { usePortal } from '../../../core/context/portalContext';
import { roleScopeFor, SCOPE_LABEL, SCOPE_ORDER } from '../../../core/access/engine';
import type { RoleDef, ScopeKind } from '../../../core/access/engine';
import { MODULES } from '../../../core/features/registry';
import { rolesOf, setRoleScope } from '../../../core/org/accessOps';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply } from '../../organization/hooks';
import SectionNav from '../components/SectionNav';
import { ROLE_PAGES } from '../sections';

const SCOPE_OPTIONS = SCOPE_ORDER.map((value) => ({ value, label: SCOPE_LABEL[value] }));
const MODULE_OPTIONS = MODULES.filter((module) => !['home', 'help', 'profile', 'access', 'org', 'institution'].includes(module.key));

/** ACC-11. How much data a role reaches inside each module. */
export default function DataScopePage() {
  const { scope, org, inst, can, path } = usePortal();
  const { roles } = useStore(accessStore);
  const apply = useApply();
  const [editing, setEditing] = useState<{ role: RoleDef; scope: { default: ScopeKind; byModule: Record<string, string> } } | null>(null);
  const [error, setError] = useState('');
  const canEdit = can('access.scope.edit').allowed;
  const rows = rolesOf(roles, org.id).filter((role) => scope === 'org' || role.level === 'inst');

  const open = (role: RoleDef) => {
    setError('');
    setEditing({ role, scope: { default: roleScopeFor(role, ''), byModule: { ...(role.scope?.byModule ?? {}) } } });
  };
  const save = () => {
    if (!editing) return;
    const byModule = Object.fromEntries(Object.entries(editing.scope.byModule).filter(([, value]) => value)) as Record<string, ScopeKind>;
    const result = apply((snap, now, actor) => setRoleScope(snap, editing.role.id, { default: editing.scope.default, byModule: Object.keys(byModule).length ? byModule : undefined }, actor, now), 'Data scope saved.');
    if (result.ok) setEditing(null);
    else setError(result.error);
  };

  const columns: Column<RoleDef>[] = [
    { key: 'name', header: 'Role', sortable: true, accessor: (row) => row.name, cell: (row) => <span className="font-medium text-charcoal-900">{row.name}</span> },
    { key: 'kind', header: 'Kind', accessor: (row) => (row.system ? 'System' : 'Custom'), cell: (row) => <Badge tone={row.system ? 'neutral' : 'brand'}>{row.system ? 'System' : 'Custom'}</Badge> },
    { key: 'default', header: 'Reaches', sortable: true, accessor: (row) => SCOPE_LABEL[roleScopeFor(row, '')] },
    {
      key: 'exceptions',
      header: 'Exceptions',
      accessor: (row) => Object.entries(row.scope?.byModule ?? {}).map(([module, value]) => `${MODULES.find((item) => item.key === module)?.label ?? module}: ${SCOPE_LABEL[value]}`).join('; '),
      cell: (row) => {
        const entries = Object.entries(row.scope?.byModule ?? {});
        return entries.length === 0 ? <span className="text-charcoal-500">None</span> : <span>{entries.map(([module, value]) => `${MODULES.find((item) => item.key === module)?.label ?? module}: ${SCOPE_LABEL[value].toLowerCase()}`).join('; ')}</span>;
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Data scope"
        eyebrow="ACC-11"
        description="A permission says what a person may do. Scope says on whose data: only their own, their assigned classes, one campus, the whole institution, or the whole organization."
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Data scope' }]}
      />
      <SectionNav label="Role pages" items={ROLE_PAGES} />
      <Alert tone="info" className="mb-4" title="Where scope is used">
        Screens apply scope as they are rebuilt, starting with staff. The access explainer already shows the scope of every person today.
      </Alert>
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Data scope of roles"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          searchText={(row) => row.name}
          searchPlaceholder="Search roles"
          initialSort={{ key: 'name', direction: 'asc' }}
          rowActions={(row) => (
            <Button size="sm" onClick={() => open(row)} disabled={row.system ? false : !canEdit} aria-label={`${row.system ? 'View' : 'Edit'} the scope of ${row.name}`}>
              {row.system ? 'View' : 'Edit'}
            </Button>
          )}
        />
      </div>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Scope of ${editing.role.name}` : ''}
        description={editing?.role.system ? 'System roles are the same everywhere. Duplicate the role to choose your own scope.' : 'Choose a default and, where needed, a different scope for one module.'}
        size="md"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>{editing?.role.system ? 'Close' : 'Cancel'}</Button>
            {!editing?.role.system && (
              <Button variant="primary" onClick={save}>
                Save scope
              </Button>
            )}
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <SelectField label="Default scope" options={SCOPE_OPTIONS} value={editing.scope.default} onChange={(value) => setEditing({ ...editing, scope: { ...editing.scope, default: value as ScopeKind } })} disabled={editing.role.system} />
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-charcoal-800">Exceptions by module</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODULE_OPTIONS.map((module) => (
                  <SelectField
                    key={module.key}
                    label={module.label}
                    placeholder="Same as default"
                    options={SCOPE_OPTIONS}
                    value={editing.scope.byModule[module.key] ?? ''}
                    onChange={(value) => setEditing({ ...editing, scope: { ...editing.scope, byModule: { ...editing.scope.byModule, [module.key]: value } } })}
                    disabled={editing.role.system}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </Dialog>
    </PageContainer>
  );
}
