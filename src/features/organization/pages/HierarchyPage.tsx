import { useState } from 'react';
import type { ReactNode } from 'react';
import { Archive, Pencil, Plus } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { UNIT_KIND_LABEL } from '../../../core/org/model';
import type { OrgUnit, UnitKind } from '../../../core/org/model';
import { archiveUnit, saveUnit, unitDescendantIds } from '../../../core/org/ops';
import { RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Institution } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { CheckboxField, SelectField, TextField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useOrgData, useWorld } from '../hooks';

interface UnitForm {
  id?: string;
  name: string;
  kind: UnitKind;
  parentId: string;
  instIds: string[];
}

/** ORG-07. Units group institutions. An institution can sit in more than one unit, so this is not a plain tree of institutions. */
export default function HierarchyPage() {
  const { org, can, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const [tab, setTab] = useState('structure');
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<UnitForm | null>(null);
  const [formError, setFormError] = useState('');
  const [archiving, setArchiving] = useState<OrgUnit | null>(null);
  const [actionError, setActionError] = useState('');

  const members = institutions.filter((inst) => inst.orgId === org.id);
  const units = world.units.filter((unit) => unit.orgId === org.id);
  const active = units.filter((unit) => !unit.archived);
  const canCreate = can('org.hierarchy.create').allowed;
  const canEdit = can('org.hierarchy.edit').allowed;
  const canArchive = can('org.hierarchy.archive').allowed;
  const instName = (id: string) => members.find((inst) => inst.id === id)?.shortName ?? id;
  const unplaced = members.filter((inst) => !active.some((unit) => unit.instIds.includes(inst.id)));

  const label = (unit: OrgUnit): string => {
    const parent = units.find((item) => item.id === unit.parentId);
    return parent ? `${label(parent)} / ${unit.name}` : unit.name;
  };
  const blocked = form?.id ? [form.id, ...unitDescendantIds(units, form.id)] : [];
  const parentOptions = active.filter((unit) => !blocked.includes(unit.id)).map((unit) => ({ value: unit.id, label: label(unit) }));

  const open = (value: Partial<UnitForm> & { id?: string }) => {
    setForm({ name: '', kind: 'cluster', parentId: '', instIds: [], ...value });
    setFormError('');
  };

  const submit = () => {
    if (!form) return;
    const result = apply(
      (snap, now, actor) => saveUnit(snap, { id: form.id, orgId: org.id, name: form.name, kind: form.kind, parentId: form.parentId || null, instIds: form.instIds }, actor, now),
      form.id ? 'Unit saved.' : 'Unit added.',
    );
    if (result.ok) setForm(null);
    else setFormError(result.error);
  };

  const renderNode = (unit: OrgUnit, depth: number): ReactNode => {
    const children = units.filter((item) => item.parentId === unit.id && (showArchived || !item.archived));
    return (
      <li key={unit.id} className={depth === 0 ? '' : 'border-l border-warm-200 pl-4'}>
        <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-warm-200 bg-white p-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-medium text-charcoal-900">
              {unit.name}
              <Badge>{UNIT_KIND_LABEL[unit.kind]}</Badge>
              {unit.archived && <Badge tone="warning">Archived</Badge>}
            </p>
            <p className="mt-1 text-sm text-charcoal-600">{unit.instIds.length === 0 ? 'No institutions placed here' : unit.instIds.map(instName).join(', ')}</p>
          </div>
          {!unit.archived && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<Plus size={14} aria-hidden="true" />} disabled={!canCreate} onClick={() => open({ parentId: unit.id })} aria-label={`Add a unit inside ${unit.name}`}>
                Add inside
              </Button>
              <Button size="sm" icon={<Pencil size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => open({ id: unit.id, name: unit.name, kind: unit.kind, parentId: unit.parentId ?? '', instIds: unit.instIds })} aria-label={`Edit ${unit.name}`}>
                Edit
              </Button>
              <Button size="sm" icon={<Archive size={14} aria-hidden="true" />} disabled={!canArchive} onClick={() => { setActionError(''); setArchiving(unit); }} aria-label={`Archive ${unit.name}`}>
                Archive
              </Button>
            </div>
          )}
        </div>
        {children.length > 0 && <ul className="mt-2 space-y-2">{children.map((child) => renderNode(child, depth + 1))}</ul>}
      </li>
    );
  };

  const roots = units.filter((unit) => unit.parentId === null && (showArchived || !unit.archived));

  const columns: Column<Institution>[] = [
    { key: 'name', header: 'Institution', sortable: true, accessor: (row) => row.name },
    { key: 'relationship', header: 'Relationship', sortable: true, accessor: (row) => RELATIONSHIP_LABEL[row.relationship?.type ?? 'member'] },
    {
      key: 'units',
      header: 'Units',
      accessor: (row) => active.filter((unit) => unit.instIds.includes(row.id)).map((unit) => unit.name).join('; '),
      cell: (row) => {
        const names = active.filter((unit) => unit.instIds.includes(row.id)).map((unit) => unit.name);
        return names.length === 0 ? <Badge tone="warning">Not placed</Badge> : names.join(', ');
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Hierarchy"
        eyebrow="ORG-07"
        description={`How ${org.name} groups its institutions: regions, zones, faculties or councils. An institution may be in several units.`}
        breadcrumbs={[{ label: org.name, to: path() }, { label: 'Hierarchy' }]}
        actions={
          <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => open({})} disabled={!canCreate} title={canCreate ? undefined : 'Your role cannot add units'}>
            Add top-level unit
          </Button>
        }
      />
      {actionError && (
        <Alert tone="danger" className="mb-4">
          {actionError}
        </Alert>
      )}
      {active.length > 0 && unplaced.length > 0 && (
        <Alert tone="warning" title="Institutions not in any unit" className="mb-4">
          {unplaced.map((inst) => inst.shortName).join(', ')}. Edit a unit to place them.
        </Alert>
      )}

      <Tabs
        label="Hierarchy views"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'structure', label: 'Structure', badge: active.length },
          { id: 'institutions', label: 'By institution', badge: members.length },
        ]}
      />
      <TabPanel id="structure" value={tab}>
        <div className="mb-4 flex justify-end">
          <CheckboxField label="Show archived units" checked={showArchived} onChange={setShowArchived} />
        </div>
        {roots.length === 0 ? (
          <EmptyState title="No units yet" description="Add a region, zone, faculty or any group to organize the institutions." action={<Button variant="primary" onClick={() => open({})} disabled={!canCreate}>Add top-level unit</Button>} />
        ) : (
          <ul className="space-y-2">{roots.map((unit) => renderNode(unit, 0))}</ul>
        )}
      </TabPanel>
      <TabPanel id="institutions" value={tab}>
        <Card padded={false}>
          <DataTable caption="Institutions and their units" rows={members} columns={columns} rowKey={(row) => row.id} searchText={(row) => row.name} searchPlaceholder="Search institutions" initialSort={{ key: 'name', direction: 'asc' }} />
        </Card>
      </TabPanel>

      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit unit' : 'Add unit'}
        footer={
          <>
            <Button onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>
              {form?.id ? 'Save changes' : 'Add unit'}
            </Button>
          </>
        }
      >
        {form && (
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="space-y-4">
            {formError && <Alert tone="danger">{formError}</Alert>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Name" required autoFocus value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
              <SelectField label="Kind" options={Object.entries(UNIT_KIND_LABEL).map(([value, label]) => ({ value, label }))} value={form.kind} onChange={(value) => setForm({ ...form, kind: value as UnitKind })} />
              <SelectField className="sm:col-span-2" label="Inside" placeholder="Top level" hint="Move a unit by choosing another parent." options={parentOptions} value={form.parentId} onChange={(value) => setForm({ ...form, parentId: value })} />
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-charcoal-800">Institutions in this unit</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {members.map((inst) => (
                  <CheckboxField key={inst.id} label={inst.shortName} checked={form.instIds.includes(inst.id)} onChange={(checked) => setForm({ ...form, instIds: checked ? [...form.instIds, inst.id] : form.instIds.filter((id) => id !== inst.id) })} />
                ))}
              </div>
            </fieldset>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={(reason) => {
          if (!archiving) return;
          const result = apply((snap, now, actor) => archiveUnit(snap, archiving.id, actor, now, reason), `${archiving.name} archived.`);
          setActionError(result.ok ? '' : result.error);
        }}
        title="Archive unit"
        message="The unit is hidden from the structure. The institutions in it are not changed."
        itemName={archiving?.name}
        confirmLabel="Archive"
        requireReason
      />
    </PageContainer>
  );
}
