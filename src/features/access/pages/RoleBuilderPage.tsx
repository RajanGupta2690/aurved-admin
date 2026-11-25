import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Minus, X } from 'lucide-react';
import { useStore } from '../../../core/api/persistedStore';
import { accessStore } from '../../../core/api/stores';
import { usePortal } from '../../../core/context/portalContext';
import { cellKey, matrixCounts, matrixOf, patternsFrom, permissionRows } from '../../../core/access/matrix';
import type { CellState, Matrix } from '../../../core/access/matrix';
import { ACTIONS } from '../../../core/access/match';
import type { Action } from '../../../core/access/match';
import { ROLE_TEMPLATES } from '../../../core/access/templates';
import { rolesOf, saveRole } from '../../../core/org/accessOps';
import { ROUTES } from '../../../core/routing/registry';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import { SelectField, TextareaField, TextField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { useApply } from '../../organization/hooks';

const NEXT: Record<CellState, CellState> = { none: 'allow', allow: 'deny', deny: 'none' };
const WORD: Record<CellState, string> = { none: 'not given', allow: 'allowed', deny: 'denied' };

/** ACC-08 (role builder) and ACC-09 (permission builder). One page: who the role is, and what it can do. */
export default function RoleBuilderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { roles } = useStore(accessStore);
  const { org, path } = usePortal();
  const isNew = id === 'new';
  const role = isNew ? undefined : roles.find((item) => item.id === id);
  const source = isNew ? roles.find((item) => item.id === params.get('from')) : undefined;
  const template = isNew ? ROLE_TEMPLATES.find((item) => item.id === params.get('template')) : undefined;
  const visible = role ? rolesOf(roles, org.id, true).some((item) => item.id === role.id) : true;

  if (!isNew && (!role || !visible)) {
    return (
      <PageContainer>
        <EmptyState title="Role not found" description="It does not exist, or it belongs to another organization." action={<Link to={path('roles')} className="btn-secondary">Back to roles</Link>} />
      </PageContainer>
    );
  }
  // Starting again when the role or the starting point changes keeps the form simple.
  return <Builder key={`${id}:${params.get('from')}:${params.get('template')}`} roleId={role?.id} name={role?.name ?? (source ? `Copy of ${source.name}` : template?.name ?? '')} description={role?.description ?? source?.description ?? template?.description ?? ''} level={role?.level ?? source?.level ?? template?.level ?? 'inst'} permissions={role?.permissions ?? source?.permissions ?? template?.permissions ?? ['home.*', 'help.*', 'profile.*']} system={role?.system ?? false} startedFrom={source?.name ?? template?.name} />;
}

interface BuilderProps {
  roleId?: string;
  name: string;
  description: string;
  level: 'inst' | 'org';
  permissions: string[];
  system: boolean;
  startedFrom?: string;
}

function Builder(props: BuilderProps) {
  const { scope, org, inst, can, path } = usePortal();
  const navigate = useNavigate();
  const apply = useApply();
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [level, setLevel] = useState<'inst' | 'org'>(scope === 'inst' ? 'inst' : props.level);
  const [matrix, setMatrix] = useState<Matrix>(() => matrixOf(props.permissions));
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const readOnly = props.system || !can(props.roleId ? 'access.roles.edit' : 'access.roles.create').allowed;

  const rows = permissionRows();
  const modules = Array.from(new Set(rows.map((row) => row.moduleKey)));
  const actions = ACTIONS.filter((action) => rows.some((row) => row.actions.includes(action)));
  const counts = matrixCounts(matrix);

  const setCells = (keys: string[], state: CellState) => setMatrix((previous) => ({ ...previous, ...Object.fromEntries(keys.map((key) => [key, state])) }));
  const rowKeys = (featureKey: string) => (rows.find((row) => row.featureKey === featureKey)?.actions ?? []).map((action) => cellKey(featureKey, action));
  const moduleKeys = (moduleKey: string) => rows.filter((row) => row.moduleKey === moduleKey).flatMap((row) => rowKeys(row.featureKey));
  const toggleGroup = (keys: string[]) => setCells(keys, keys.every((key) => matrix[key] === 'allow') ? 'none' : 'allow');

  // The menu that the role would show, from the same rules the real menu uses.
  const uniqueMenu = Array.from(
    new Set(ROUTES.filter((def) => def.nav && matrix[cellKey(def.feature, 'view')] === 'allow' && (level === 'org' ? def.scope !== 'inst' : def.scope !== 'org')).map((def) => def.title)),
  );

  const save = () => {
    setNameError(name.trim().length < 3 ? 'Give the role a name of at least 3 characters.' : '');
    if (name.trim().length < 3) return;
    const permissions = patternsFrom(matrix);
    const result = apply((snap, now, actor) => saveRole(snap, { id: props.roleId, name, description, level, permissions, ownerOrgId: org.id }, actor, now), props.roleId ? 'Role saved.' : 'Role created.');
    if (result.ok) navigate(path('roles'));
    else setError(result.error);
  };

  return (
    <PageContainer>
      <PageHeader
        title={props.roleId ? (props.system ? props.name : `Edit ${props.name}`) : 'New role'}
        eyebrow="ACC-08 and ACC-09"
        description={props.startedFrom ? `Started from "${props.startedFrom}". Change anything. The original is not affected.` : 'Name the role and choose what it can do. Nobody can give a permission they do not hold themselves.'}
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Roles', to: path('roles') }, { label: props.roleId ? props.name : 'New role' }]}
        actions={
          <>
            <Button onClick={() => navigate(path('roles'))}>{readOnly ? 'Back' : 'Cancel'}</Button>
            {!readOnly && (
              <Button variant="primary" onClick={save}>
                Save role
              </Button>
            )}
          </>
        }
      />
      {props.system && (
        <Alert tone="info" className="mb-4" title="System role">
          System roles are the same everywhere and cannot be changed.{' '}
          <Link to={`${path('roles/new')}?from=${props.roleId}`} className="font-medium underline">
            Duplicate it
          </Link>{' '}
          to make your own.
        </Alert>
      )}
      {!props.system && readOnly && (
        <Alert tone="info" className="mb-4">
          Your role may read this but not change it.
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Role" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Name" required value={name} onChange={(value) => { setName(value); setNameError(''); }} error={nameError} disabled={readOnly} autoFocus={!readOnly} />
            <SelectField
              label="Works across"
              value={level}
              onChange={(value) => setLevel(value as 'inst' | 'org')}
              disabled={readOnly || scope === 'inst' || org.implicit}
              options={[
                { value: 'inst', label: 'One institution' },
                { value: 'org', label: 'The whole organization' },
              ]}
              hint={scope === 'inst' || org.implicit ? 'Organization-wide roles are made at organization level.' : undefined}
            />
            <TextareaField className="sm:col-span-2" label="What is it for?" rows={2} value={description} onChange={setDescription} disabled={readOnly} />
          </div>
        </Card>
        <Card title="Summary">
          <p className="text-sm text-charcoal-700" aria-live="polite">
            {counts.allowed} permissions allowed, {counts.denied} denied, of {counts.total}.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">Menu this role sees</p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {uniqueMenu.length === 0 ? <span className="text-sm text-charcoal-600">No screen yet.</span> : uniqueMenu.map((title) => <Badge key={title}>{title}</Badge>)}
          </p>
        </Card>
      </div>

      <Card title="Permissions" description="Press a cell to cycle: not given, allowed, denied. A deny beats every allow, also from other roles." padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Permissions by feature and action</caption>
            <thead>
              <tr className="border-b border-warm-200 bg-warm-50">
                <th scope="col" className="sticky left-0 min-w-[14rem] bg-warm-50 px-4 py-3 text-left font-semibold text-charcoal-800">
                  Feature
                </th>
                <th scope="col" className="px-2 py-3 text-center font-semibold text-charcoal-800">
                  All
                </th>
                {actions.map((action) => (
                  <th key={action} scope="col" className="px-2 py-3 text-center font-semibold capitalize text-charcoal-800">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((moduleKey) => {
                const moduleRows = rows.filter((row) => row.moduleKey === moduleKey);
                return (
                  <ModuleBlock
                    key={moduleKey}
                    label={moduleRows[0].moduleLabel}
                    rows={moduleRows}
                    actions={actions}
                    matrix={matrix}
                    readOnly={readOnly}
                    onCell={(featureKey, action) => setCells([cellKey(featureKey, action)], NEXT[matrix[cellKey(featureKey, action)] ?? 'none'])}
                    onRow={(featureKey) => toggleGroup(rowKeys(featureKey))}
                    onModule={() => toggleGroup(moduleKeys(moduleKey))}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}

function ModuleBlock({
  label,
  rows,
  actions,
  matrix,
  readOnly,
  onCell,
  onRow,
  onModule,
}: {
  label: string;
  rows: ReturnType<typeof permissionRows>;
  actions: Action[];
  matrix: Matrix;
  readOnly: boolean;
  onCell: (featureKey: string, action: Action) => void;
  onRow: (featureKey: string) => void;
  onModule: () => void;
}) {
  return (
    <>
      <tr className="border-b border-warm-200 bg-warm-100">
        <th scope="rowgroup" colSpan={2} className="sticky left-0 bg-warm-100 px-4 py-2 text-left font-semibold text-charcoal-900">
          <span className="flex items-center justify-between gap-3">
            {label}
            <Button size="sm" onClick={onModule} disabled={readOnly} aria-label={`Allow or clear everything in ${label}`}>
              Toggle all
            </Button>
          </span>
        </th>
        <td colSpan={actions.length} />
      </tr>
      {rows.map((row) => (
        <tr key={row.featureKey} className="border-b border-warm-100">
          <th scope="row" className="sticky left-0 bg-white px-4 py-1.5 text-left font-medium text-charcoal-900">
            {row.featureLabel}
          </th>
          <td className="px-2 py-1 text-center">
            <Button size="sm" variant="ghost" onClick={() => onRow(row.featureKey)} disabled={readOnly} aria-label={`Allow or clear all of ${row.featureLabel}`}>
              All
            </Button>
          </td>
          {actions.map((action) => {
            if (!row.actions.includes(action)) {
              return (
                <td key={action} className="px-2 py-1 text-center text-charcoal-300" aria-label="not available">
                  <span aria-hidden="true">-</span>
                </td>
              );
            }
            const state = matrix[cellKey(row.featureKey, action)] ?? 'none';
            return (
              <td key={action} className="px-2 py-1 text-center">
                <button
                  type="button"
                  onClick={() => onCell(row.featureKey, action)}
                  disabled={readOnly}
                  aria-label={`${row.featureLabel}, ${action}: ${WORD[state]}`}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${state === 'allow' ? 'border-success-600 bg-success-50 text-success-700' : state === 'deny' ? 'border-danger-600 bg-danger-50 text-danger-700' : 'border-warm-300 bg-white text-charcoal-400'} disabled:opacity-60`}
                >
                  {state === 'allow' ? <Check size={16} aria-hidden="true" /> : state === 'deny' ? <X size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
