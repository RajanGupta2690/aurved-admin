import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArchiveRestore, Archive, Pencil, Plus } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { saveCampus, setCampusStatus } from '../../../core/org/ops';
import type { CampusDraft } from '../../../core/org/ops';
import { isExternal } from '../../../core/org/rules';
import { CAMPUS_KIND_LABEL } from '../../../core/org/types';
import type { Campus, CampusKind, Institution } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useForm } from '../../../shared/ui/useForm';
import { required } from '../../../shared/ui/validators';
import { useApply, useOrgData } from '../../organization/hooks';

interface Values extends Record<string, unknown> {
  name: string;
  city: string;
  address: string;
  code: string;
  kind: string;
}

interface Row extends Campus {
  inst: Institution;
}

const KIND_OPTIONS = (Object.keys(CAMPUS_KIND_LABEL) as CampusKind[]).map((value) => ({ value, label: CAMPUS_KIND_LABEL[value] }));

/** ORG-06. One institution: manage its campuses. Organization level: see all campuses. */
export default function CampusesPage() {
  const { scope, inst, org, can, path } = usePortal();
  const { institutions } = useOrgData();
  const apply = useApply();
  const [editing, setEditing] = useState<{ row?: Row } | null>(null);
  const [formError, setFormError] = useState('');
  const [archiving, setArchiving] = useState<Row | null>(null);
  const [actionError, setActionError] = useState('');

  const targets = scope === 'inst' && inst ? [inst] : institutions.filter((candidate) => candidate.orgId === org.id);
  const rows: Row[] = targets.flatMap((target) => target.campuses.map((campus) => ({ ...campus, inst: target })));
  const canCreate = scope === 'inst' && can('institution.campuses.create').allowed;
  const canEdit = scope === 'inst' && can('institution.campuses.edit').allowed;
  const canArchive = scope === 'inst' && can('institution.campuses.archive').allowed;

  const form = useForm<Values>({ name: '', city: '', address: '', code: '', kind: 'branch' }, { name: [required('Enter the campus name.')], city: [required('Enter the city.')] });

  const openForm = (row?: Row) => {
    form.reset(row ? { name: row.name, city: row.city, address: row.address ?? '', code: row.code ?? '', kind: row.kind ?? 'branch' } : { name: '', city: inst?.city ?? '', address: '', code: '', kind: 'branch' });
    setFormError('');
    setEditing({ row });
  };

  const save = form.handleSubmit((values) => {
    if (!inst) return;
    const draft: CampusDraft = { id: editing?.row?.id, name: values.name, city: values.city, address: values.address, code: values.code, kind: values.kind as CampusKind };
    const result = apply((snap, now, actor) => saveCampus(snap, inst.id, draft, actor, now), editing?.row ? 'Campus saved.' : 'Campus added.');
    if (result.ok) setEditing(null);
    else setFormError(result.error);
  });

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Campus', sortable: true, accessor: (row) => row.name, cell: (row) => <span className="font-medium text-charcoal-900">{row.name}</span> },
    ...(scope === 'org'
      ? [
          {
            key: 'inst',
            header: 'Institution',
            sortable: true,
            accessor: (row: Row) => row.inst.shortName,
            cell: (row: Row) => (
              <span className="inline-flex flex-wrap items-center gap-2">
                {isExternal(row.inst) ? (
                  row.inst.shortName
                ) : (
                  <Link to={`/inst/${row.inst.id}/campuses`} className="text-primary-700 hover:underline">
                    {row.inst.shortName}
                  </Link>
                )}
                {isExternal(row.inst) && <Badge tone="info">Independent</Badge>}
              </span>
            ),
          } as Column<Row>,
        ]
      : []),
    { key: 'kind', header: 'Kind', sortable: true, accessor: (row) => CAMPUS_KIND_LABEL[row.kind ?? 'branch'] },
    { key: 'city', header: 'City', sortable: true, accessor: (row) => row.city },
    { key: 'code', header: 'Code', accessor: (row) => row.code ?? '', defaultHidden: scope === 'org' },
    { key: 'address', header: 'Address', accessor: (row) => row.address ?? '', defaultHidden: true },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status ?? 'active', cell: (row) => <StatusBadge status={row.status ?? 'active'} /> },
  ];

  const title = scope === 'inst' ? 'Campuses' : 'All campuses';
  return (
    <PageContainer>
      <PageHeader
        title={title}
        eyebrow="ORG-06"
        description={scope === 'inst' ? `Campuses and branches of ${inst?.name}. A campus with records is archived, not removed.` : `Campuses of every institution in ${org.name}. Open an institution to change its campuses.`}
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Campuses' }]}
        actions={
          scope === 'inst' ? (
            <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => openForm()} disabled={!canCreate} title={canCreate ? undefined : 'Your role cannot add campuses'}>
              Add campus
            </Button>
          ) : undefined
        }
      />
      {actionError && (
        <Alert tone="danger" className="mb-4">
          {actionError}
        </Alert>
      )}
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Campuses"
          rows={rows}
          columns={columns}
          rowKey={(row) => `${row.inst.id}:${row.id}`}
          searchText={(row) => `${row.name} ${row.city} ${row.inst.shortName} ${row.code ?? ''}`}
          searchPlaceholder="Search campuses"
          exportName={can('institution.campuses.export').allowed ? `${(inst ?? org).id}-campuses` : undefined}
          initialSort={{ key: 'name', direction: 'asc' }}
          rowActions={
            scope === 'inst'
              ? (row) => (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" icon={<Pencil size={14} aria-hidden="true" />} onClick={() => openForm(row)} disabled={!canEdit} aria-label={`Edit ${row.name}`}>
                      Edit
                    </Button>
                    {(row.status ?? 'active') === 'active' ? (
                      <Button size="sm" icon={<Archive size={14} aria-hidden="true" />} onClick={() => { setActionError(''); setArchiving(row); }} disabled={!canArchive} aria-label={`Archive ${row.name}`}>
                        Archive
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        icon={<ArchiveRestore size={14} aria-hidden="true" />}
                        disabled={!canArchive}
                        onClick={() => {
                          const result = apply((snap, now, actor) => setCampusStatus(snap, row.inst.id, row.id, 'active', actor, now), `${row.name} restored.`);
                          setActionError(result.ok ? '' : result.error);
                        }}
                        aria-label={`Restore ${row.name}`}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                )
              : undefined
          }
          emptyTitle="No campus"
          emptyDescription="Every institution needs at least one campus."
        />
      </div>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.row ? 'Edit campus' : 'Add campus'}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" type="submit" form="campus-form">
              {editing?.row ? 'Save changes' : 'Add campus'}
            </Button>
          </>
        }
      >
        <form id="campus-form" onSubmit={save} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formError && (
            <div className="sm:col-span-2">
              <Alert tone="danger">{formError}</Alert>
            </div>
          )}
          <TextField label="Campus name" required autoFocus {...form.bind('name')} />
          <SelectField label="Kind" options={KIND_OPTIONS} {...form.bind('kind')} />
          <TextField label="City" required {...form.bind('city')} />
          <TextField label="Code" hint="Short code used in reports." {...form.bind('code')} />
          <TextField className="sm:col-span-2" label="Address" {...form.bind('address')} />
        </form>
      </Dialog>

      <ConfirmDialog
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={(reason) => {
          if (!archiving) return;
          const result = apply((snap, now, actor) => setCampusStatus(snap, archiving.inst.id, archiving.id, 'archived', actor, now, reason), `${archiving.name} archived.`);
          setActionError(result.ok ? '' : result.error);
        }}
        title="Archive campus"
        message="The campus disappears from the campus switcher and from new records. Records that already point to it keep the link."
        itemName={archiving?.name}
        confirmLabel="Archive"
        requireReason
        note="You can restore it later."
      />
    </PageContainer>
  );
}
