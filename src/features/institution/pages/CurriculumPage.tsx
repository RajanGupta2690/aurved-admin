import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import { useInstitution, usePortal } from '../../../core/context/portalContext';
import { BOARDS, GRADING_SCHEMES, PROGRAMME_LEVELS, SCHOOL_STAGES } from '../../../core/org/model';
import type { CurriculumConfig, Programme, ProgrammeLevel } from '../../../core/org/model';
import { saveCurriculum } from '../../../core/org/ops';
import { policyFor } from '../../../core/org/rules';
import { PROFILE_LABEL } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import { CheckboxField, SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useWorld } from '../../organization/hooks';

/** ORG-14 */
export default function CurriculumPage() {
  const inst = useInstitution();
  const world = useWorld();
  const config = world.curricula.find((item) => item.instId === inst.id) ?? {
    instId: inst.id,
    board: BOARDS[inst.profile][0],
    gradingScheme: 'percentage' as const,
    medium: 'English',
    stages: inst.profile === 'school' ? ['Primary'] : [],
    programmes: [],
  };
  // Starting again from the saved data after every save keeps the form and the store in step.
  return <CurriculumForm key={`${inst.id}:${JSON.stringify(config)}`} config={config} />;
}

function CurriculumForm({ config }: { config: CurriculumConfig }) {
  const inst = useInstitution();
  const { org, can, path } = usePortal();
  const world = useWorld();
  const apply = useApply();
  const [draft, setDraft] = useState<CurriculumConfig>(() => JSON.parse(JSON.stringify(config)) as CurriculumConfig);
  const [error, setError] = useState('');
  const [programme, setProgramme] = useState<{ item: Programme; isNew: boolean } | null>(null);
  const [programmeError, setProgrammeError] = useState('');
  const canEdit = can('institution.curriculum.edit').allowed;
  const gradingPolicy = policyFor(world, org.id, 'grading.common');
  const dirty = JSON.stringify(draft) !== JSON.stringify(config);
  const boards = BOARDS[inst.profile].includes(draft.board) ? BOARDS[inst.profile] : [draft.board, ...BOARDS[inst.profile]];

  const save = () => {
    const payload = gradingPolicy ? { ...draft, gradingScheme: gradingPolicy.value as CurriculumConfig['gradingScheme'] } : draft;
    const result = apply((snap, now, actor) => saveCurriculum(snap, payload, actor, now), 'Curriculum saved.');
    setError(result.ok ? '' : result.error);
  };

  const savePolicyScheme = gradingPolicy?.value ?? draft.gradingScheme;

  const saveProgramme = () => {
    if (!programme) return;
    const item = programme.item;
    if (item.name.trim().length < 2) return setProgrammeError('Enter the programme name.');
    if (!(item.years >= 1 && item.years <= 8)) return setProgrammeError('Duration must be between 1 and 8 years.');
    if (!item.department.trim()) return setProgrammeError('Enter the department.');
    if (draft.programmes.some((other) => other.id !== item.id && other.status === 'active' && other.name.trim().toLowerCase() === item.name.trim().toLowerCase())) return setProgrammeError('A programme with this name is already listed.');
    setDraft((previous) => ({ ...previous, programmes: programme.isNew ? [...previous.programmes, item] : previous.programmes.map((other) => (other.id === item.id ? item : other)) }));
    setProgramme(null);
    setProgrammeError('');
  };

  const columns: Column<Programme>[] = [
    { key: 'name', header: 'Programme', sortable: true, accessor: (row) => row.name, cell: (row) => <span className="font-medium text-charcoal-900">{row.name}</span> },
    { key: 'level', header: 'Level', sortable: true, accessor: (row) => row.level },
    { key: 'years', header: 'Years', sortable: true, align: 'right', accessor: (row) => row.years },
    { key: 'department', header: 'Department', sortable: true, accessor: (row) => row.department },
    { key: 'status', header: 'Status', accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Curriculum"
        eyebrow="ORG-14"
        description={`Board, grading and ${inst.profile === 'school' ? 'stages' : 'programmes'} of ${inst.name}. Changes apply to new records. Saved changes are written to the change history.`}
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Curriculum' }]}
        actions={
          <>
            <Button onClick={() => { setDraft(JSON.parse(JSON.stringify(config)) as CurriculumConfig); setError(''); }} disabled={!dirty}>
              Discard changes
            </Button>
            <Button variant="primary" onClick={save} disabled={!dirty || !canEdit} title={canEdit ? undefined : 'Your role cannot change the curriculum'}>
              Save curriculum
            </Button>
          </>
        }
      />
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {dirty && <p className="mb-4 text-sm font-medium text-warning-800">You have changes that are not saved.</p>}

      <div className="grid gap-6">
        <Card title={inst.profile === 'school' ? 'Board and grading' : 'Regulator and grading'}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField label={inst.profile === 'school' ? 'Board' : 'Regulator or scheme'} options={boards.map((value) => ({ value, label: value }))} value={draft.board} onChange={(value) => setDraft({ ...draft, board: value })} disabled={!canEdit} />
            <SelectField
              label="Grading scheme"
              options={GRADING_SCHEMES.map((item) => ({ value: item.value, label: item.label }))}
              value={savePolicyScheme}
              onChange={(value) => setDraft({ ...draft, gradingScheme: value as CurriculumConfig['gradingScheme'] })}
              disabled={!canEdit || Boolean(gradingPolicy)}
              hint={gradingPolicy ? `Fixed by ${org.name} for all its institutions.` : undefined}
            />
            <TextField label="Medium of instruction" value={draft.medium} onChange={(value) => setDraft({ ...draft, medium: value })} disabled={!canEdit} />
          </div>
        </Card>

        {inst.profile === 'school' ? (
          <Card title="Stages taught" description="Choose every stage the school teaches.">
            <div className="grid gap-2 sm:grid-cols-3">
              {SCHOOL_STAGES.map((stage) => (
                <CheckboxField key={stage} label={stage} checked={draft.stages.includes(stage)} disabled={!canEdit} onChange={(checked) => setDraft({ ...draft, stages: checked ? [...draft.stages, stage] : draft.stages.filter((item) => item !== stage) })} />
              ))}
            </div>
          </Card>
        ) : (
          <Card
            title="Programmes"
            description={`What a ${PROFILE_LABEL[inst.profile].toLowerCase()} offers. Archived programmes keep their students.`}
            padded={false}
            actions={
              <Button size="sm" icon={<Plus size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => { setProgrammeError(''); setProgramme({ isNew: true, item: { id: `prog-${Date.now()}`, name: '', level: 'Undergraduate', years: 3, department: '', status: 'active' } }); }}>
                Add programme
              </Button>
            }
          >
            <DataTable
              caption="Programmes"
              rows={draft.programmes}
              columns={columns}
              rowKey={(row) => row.id}
              searchText={(row) => `${row.name} ${row.department} ${row.level}`}
              searchPlaceholder="Search programmes"
              initialSort={{ key: 'name', direction: 'asc' }}
              rowActions={(row) => (
                <div className="flex justify-end gap-2">
                  <Button size="sm" icon={<Pencil size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => { setProgrammeError(''); setProgramme({ isNew: false, item: { ...row } }); }} aria-label={`Edit ${row.name}`}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    icon={row.status === 'active' ? <Archive size={14} aria-hidden="true" /> : <ArchiveRestore size={14} aria-hidden="true" />}
                    disabled={!canEdit}
                    onClick={() => setDraft({ ...draft, programmes: draft.programmes.map((item) => (item.id === row.id ? { ...item, status: item.status === 'active' ? 'archived' : 'active' } : item)) })}
                    aria-label={`${row.status === 'active' ? 'Archive' : 'Restore'} ${row.name}`}
                  >
                    {row.status === 'active' ? 'Archive' : 'Restore'}
                  </Button>
                </div>
              )}
              emptyTitle="No programmes yet"
              emptyDescription="Add the programmes this institution offers."
            />
          </Card>
        )}
      </div>

      <Dialog
        open={programme !== null}
        onClose={() => setProgramme(null)}
        title={programme?.isNew ? 'Add programme' : 'Edit programme'}
        description="Saved with the rest of the curriculum when you press Save curriculum."
        footer={
          <>
            <Button onClick={() => setProgramme(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveProgramme}>
              {programme?.isNew ? 'Add' : 'Done'}
            </Button>
          </>
        }
      >
        {programme && (
          <form onSubmit={(event) => { event.preventDefault(); saveProgramme(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {programmeError && (
              <div className="sm:col-span-2">
                <Alert tone="danger">{programmeError}</Alert>
              </div>
            )}
            <TextField className="sm:col-span-2" label="Programme name" required autoFocus value={programme.item.name} onChange={(value) => setProgramme({ ...programme, item: { ...programme.item, name: value } })} />
            <SelectField label="Level" options={PROGRAMME_LEVELS.map((value) => ({ value, label: value }))} value={programme.item.level} onChange={(value) => setProgramme({ ...programme, item: { ...programme.item, level: value as ProgrammeLevel } })} />
            <TextField label="Duration in years" type="number" min={1} max={8} value={programme.item.years} onChange={(value) => setProgramme({ ...programme, item: { ...programme.item, years: Number(value) } })} />
            <TextField className="sm:col-span-2" label="Department" required value={programme.item.department} onChange={(value) => setProgramme({ ...programme, item: { ...programme.item, department: value } })} />
          </form>
        )}
      </Dialog>
    </PageContainer>
  );
}
