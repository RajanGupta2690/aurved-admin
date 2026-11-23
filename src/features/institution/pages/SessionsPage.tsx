import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { SESSION_SYSTEM_LABEL } from '../../../core/org/model';
import type { AcademicSession, Actor, SessionSystem, Snapshot, Term } from '../../../core/org/model';
import { generateTerms, removeSession, saveSession, setSessionState, validateSession } from '../../../core/org/ops';
import type { SessionErrors } from '../../../core/org/ops';
import { formatDate, isExternal, monthName, policyFor } from '../../../core/org/rules';
import type { Institution } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { CheckboxField, SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useOrgData, useWorld } from '../../organization/hooks';

const SYSTEMS = Object.entries(SESSION_SYSTEM_LABEL).map(([value, label]) => ({ value, label }));
const iso = (date: Date) => date.toISOString().slice(0, 10);

/** Dates of the next session after the last one, or the running one when there is none. */
function suggestDates(sessions: AcademicSession[], inst: Institution | undefined, month?: number) {
  const last = [...sessions].sort((a, b) => b.end.localeCompare(a.end))[0];
  if (last) {
    const start = new Date(`${last.end}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() + 1);
    const end = new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), start.getUTCDate()) - 86_400_000);
    return { start: iso(start), end: iso(end) };
  }
  const startMonth = month ?? (inst?.profile === 'school' ? 4 : 7);
  const year = new Date().getFullYear();
  return { start: `${year}-${String(startMonth).padStart(2, '0')}-01`, end: iso(new Date(Date.UTC(year + 1, startMonth - 1, 1) - 86_400_000)) };
}

const labelFor = (start: string, end: string) => `${start.slice(0, 4)}-${end.slice(0, 4)}`;

interface DraftState {
  id?: string;
  label: string;
  start: string;
  end: string;
  system: SessionSystem;
  terms: Term[];
}

/** ORG-13. One institution: manage its sessions. Organization level: overview and planning for many. */
export default function SessionsPage() {
  const { scope, inst, org, can, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [errors, setErrors] = useState<SessionErrors>({});
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState<{ kind: 'close' | 'remove' | 'current'; session: AcademicSession } | null>(null);
  const [actionError, setActionError] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const canCreate = scope === 'inst' && can('institution.sessions.create').allowed;
  const canEdit = scope === 'inst' && can('institution.sessions.edit').allowed;
  const monthSetting = policyFor(world, inst?.orgId ?? org.id, 'session.start_month');
  const mine = useMemo(() => world.sessions.filter((item) => item.instId === inst?.id).sort((a, b) => b.start.localeCompare(a.start)), [world.sessions, inst?.id]);

  const openDraft = (session?: AcademicSession) => {
    if (session) setDraft({ id: session.id, label: session.label, start: session.start, end: session.end, system: session.system, terms: session.terms.map((term) => ({ ...term })) });
    else {
      const dates = suggestDates(mine, inst ?? undefined, monthSetting ? Number(monthSetting.value) : undefined);
      const system: SessionSystem = inst?.profile === 'institute' ? 'trimester' : 'semester';
      setDraft({ label: labelFor(dates.start, dates.end), ...dates, system, terms: generateTerms(dates.start, dates.end, system) });
    }
    setErrors({});
    setFormError('');
  };

  const patch = (changes: Partial<DraftState>) => setDraft((previous) => (previous ? { ...previous, ...changes } : previous));
  const split = (next: Partial<DraftState> = {}) =>
    setDraft((previous) => {
      if (!previous) return previous;
      const merged = { ...previous, ...next };
      return { ...merged, terms: generateTerms(merged.start, merged.end, merged.system) };
    });

  const submit = () => {
    if (!draft || !inst) return;
    const others = mine.filter((item) => item.id !== draft.id);
    const found = validateSession(draft, others, monthSetting ? Number(monthSetting.value) : undefined);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const result = apply((snap, now, actor) => saveSession(snap, inst.id, draft, actor, now), draft.id ? 'Session saved.' : 'Session planned.');
    if (result.ok) setDraft(null);
    else setFormError(result.error);
  };

  const runConfirm = (action: NonNullable<typeof confirm>) => {
    if (!inst) return;
    const operation = (snap: Snapshot, now: string, actor: Actor) =>
      action.kind === 'remove' ? removeSession(snap, inst.id, action.session.id, actor, now) : setSessionState(snap, inst.id, action.session.id, action.kind === 'close' ? 'close' : 'make_current', actor, now);
    const done = action.kind === 'remove' ? 'Session removed.' : action.kind === 'close' ? 'Session closed.' : `${action.session.label} is now the current session.`;
    const result = apply(operation, done);
    setActionError(result.ok ? '' : result.error);
  };

  const columns: Column<AcademicSession>[] = [
    { key: 'label', header: 'Session', sortable: true, accessor: (row) => row.label, cell: (row) => <span className="font-medium text-charcoal-900">{row.label}</span> },
    { key: 'start', header: 'First day', sortable: true, accessor: (row) => row.start, cell: (row) => formatDate(row.start) },
    { key: 'end', header: 'Last day', sortable: true, accessor: (row) => row.end, cell: (row) => formatDate(row.end) },
    { key: 'system', header: 'Terms', accessor: (row) => `${SESSION_SYSTEM_LABEL[row.system]} (${row.terms.length})` },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status === 'current' ? 'active' : row.status === 'planned' ? 'scheduled' : 'closed'} label={row.status} /> },
  ];

  if (scope === 'org') {
    const children = institutions.filter((candidate) => candidate.orgId === org.id);
    const governed = children.filter((candidate) => !isExternal(candidate));
    const rows = children.map((child) => ({
      inst: child,
      current: world.sessions.find((item) => item.instId === child.id && item.status === 'current'),
      planned: world.sessions.filter((item) => item.instId === child.id && item.status === 'planned').sort((a, b) => a.start.localeCompare(b.start))[0],
    }));
    const overviewColumns: Column<(typeof rows)[number]>[] = [
      {
        key: 'inst',
        header: 'Institution',
        sortable: true,
        accessor: (row) => row.inst.shortName,
        cell: (row) =>
          isExternal(row.inst) ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              {row.inst.shortName}
              <Badge tone="info">Independent</Badge>
            </span>
          ) : (
            <Link to={`/inst/${row.inst.id}/sessions`} className="font-medium text-primary-700 hover:underline">
              {row.inst.shortName}
            </Link>
          ),
      },
      { key: 'current', header: 'Current session', sortable: true, accessor: (row) => row.current?.label ?? 'None' },
      { key: 'dates', header: 'Dates', accessor: (row) => (row.current ? `${formatDate(row.current.start)} to ${formatDate(row.current.end)}` : '') },
      { key: 'system', header: 'Terms', accessor: (row) => (row.current ? SESSION_SYSTEM_LABEL[row.current.system] : '') },
      { key: 'planned', header: 'Next planned', accessor: (row) => row.planned?.label ?? 'Nothing planned' },
    ];
    return (
      <PageContainer>
        <PageHeader
          title="Academic sessions"
          eyebrow="ORG-13"
          description={`Sessions of every institution in ${org.name}. Plan one session for several institutions at once.`}
          breadcrumbs={[{ label: org.name, to: path() }, { label: 'Academic sessions' }]}
          actions={
            <Button variant="primary" icon={<CalendarPlus size={16} aria-hidden="true" />} onClick={() => setBulkOpen(true)} disabled={!can('institution.sessions.create').allowed || governed.length === 0}>
              Plan for several institutions
            </Button>
          }
        />
        {monthSetting && (
          <Alert tone="info" className="mb-4" title="Common start month">
            {org.name} requires sessions to start in {monthName(Number(monthSetting.value))}.
          </Alert>
        )}
        <div className="card !p-0 overflow-hidden">
          <DataTable caption="Sessions by institution" rows={rows} columns={overviewColumns} rowKey={(row) => row.inst.id} searchText={(row) => row.inst.name} searchPlaceholder="Search institutions" initialSort={{ key: 'inst', direction: 'asc' }} />
        </div>
        <BulkDialog open={bulkOpen} onClose={() => setBulkOpen(false)} institutions={governed} monthSetting={monthSetting ? Number(monthSetting.value) : undefined} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Academic sessions"
        eyebrow="ORG-13"
        description={`Sessions and terms of ${inst?.name}. Exactly one session is current. Closed sessions keep their records and cannot be changed.`}
        breadcrumbs={[{ label: inst?.shortName ?? '', to: path() }, { label: 'Academic sessions' }]}
        actions={
          <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => openDraft()} disabled={!canCreate} title={canCreate ? undefined : 'Your role cannot plan sessions'}>
            Plan a session
          </Button>
        }
      />
      {monthSetting && (
        <Alert tone="info" className="mb-4" title="Common start month">
          {org.name} requires sessions to start in {monthName(Number(monthSetting.value))}.
        </Alert>
      )}
      {actionError && (
        <Alert tone="danger" className="mb-4">
          {actionError}
        </Alert>
      )}
      <div className="card !p-0 overflow-hidden">
        <DataTable
          caption="Academic sessions"
          rows={mine}
          columns={columns}
          rowKey={(row) => row.id}
          rowActions={(row) => (
            <div className="flex flex-wrap justify-end gap-2">
              {row.status !== 'closed' && (
                <Button size="sm" onClick={() => openDraft(row)} disabled={!canEdit} aria-label={`Edit ${row.label}`}>
                  Edit
                </Button>
              )}
              {row.status === 'planned' && (
                <Button size="sm" variant="primary" onClick={() => { setActionError(''); setConfirm({ kind: 'current', session: row }); }} disabled={!canEdit} aria-label={`Make ${row.label} current`}>
                  Make current
                </Button>
              )}
              {row.status === 'current' && (
                <Button size="sm" onClick={() => { setActionError(''); setConfirm({ kind: 'close', session: row }); }} disabled={!canEdit} aria-label={`Close ${row.label}`}>
                  Close
                </Button>
              )}
              {row.status === 'planned' && (
                <Button size="sm" variant="ghost" icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => { setActionError(''); setConfirm({ kind: 'remove', session: row }); }} disabled={!canEdit} aria-label={`Remove ${row.label}`}>
                  Remove
                </Button>
              )}
            </div>
          )}
          emptyTitle="No session yet"
          emptyDescription="Plan the first session to start working with dates."
        />
      </div>

      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit session' : 'Plan a session'}
        size="lg"
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>
              {draft?.id ? 'Save changes' : 'Plan session'}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-5">
            {formError && <Alert tone="danger">{formError}</Alert>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Session name" required value={draft.label} onChange={(value) => patch({ label: value })} error={errors.label} />
              <SelectField label="Terms" options={SYSTEMS} value={draft.system} onChange={(value) => split({ system: value as SessionSystem })} hint="Changing this splits the terms again." />
              <TextField label="First day" type="date" required value={draft.start} onChange={(value) => split({ start: value })} error={errors.start} />
              <TextField label="Last day" type="date" required value={draft.end} onChange={(value) => split({ end: value })} error={errors.end} />
            </div>
            <fieldset>
              <legend className="mb-2 flex w-full items-center justify-between gap-3 text-sm font-medium text-charcoal-800">
                <span>Terms</span>
                <span className="flex gap-2">
                  <Button size="sm" onClick={() => split()}>
                    Split evenly
                  </Button>
                  <Button size="sm" icon={<Plus size={14} aria-hidden="true" />} onClick={() => patch({ terms: [...draft.terms, { id: `term-${draft.terms.length + 1}-${Date.now()}`, name: '', start: draft.start, end: draft.end }] })}>
                    Add term
                  </Button>
                </span>
              </legend>
              <div className="space-y-3">
                {draft.terms.map((term, index) => (
                  <div key={term.id} className="grid grid-cols-1 gap-3 rounded-xl border border-warm-200 p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
                    <TextField label={`Term ${index + 1} name`} value={term.name} onChange={(value) => patch({ terms: draft.terms.map((item) => (item.id === term.id ? { ...item, name: value } : item)) })} />
                    <TextField label="Starts" type="date" value={term.start} onChange={(value) => patch({ terms: draft.terms.map((item) => (item.id === term.id ? { ...item, start: value } : item)) })} />
                    <TextField label="Ends" type="date" value={term.end} onChange={(value) => patch({ terms: draft.terms.map((item) => (item.id === term.id ? { ...item, end: value } : item)) })} />
                    <Button variant="ghost" onClick={() => patch({ terms: draft.terms.filter((item) => item.id !== term.id) })} aria-label={`Remove term ${index + 1}`} icon={<Trash2 size={16} aria-hidden="true" />} />
                  </div>
                ))}
                {draft.terms.length === 0 && <p className="text-sm text-charcoal-600">No terms. The session runs as one block.</p>}
              </div>
              {errors.terms && <p className="mt-2 text-sm text-danger-700">{errors.terms}</p>}
            </fieldset>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runConfirm(confirm)}
        title={confirm?.kind === 'remove' ? 'Remove planned session' : confirm?.kind === 'close' ? 'Close session' : 'Make this the current session'}
        message={
          confirm?.kind === 'remove'
            ? 'The planned session and its terms are removed. Nothing has been recorded against it.'
            : confirm?.kind === 'close'
              ? 'A closed session cannot be changed again. Its records stay available.'
              : 'The session that is current now will be closed. Closed sessions cannot be reopened.'
        }
        itemName={confirm?.session.label}
        confirmLabel={confirm?.kind === 'remove' ? 'Remove' : confirm?.kind === 'close' ? 'Close session' : 'Make current'}
        tone={confirm?.kind === 'current' ? 'primary' : 'danger'}
      />
    </PageContainer>
  );
}

function BulkDialog({ open, onClose, institutions, monthSetting }: { open: boolean; onClose: () => void; institutions: Institution[]; monthSetting?: number }) {
  const world = useWorld();
  const apply = useApply();
  const first = institutions[0];
  const initial = useMemo(() => {
    const dates = suggestDates(world.sessions.filter((item) => item.instId === first?.id), first, monthSetting);
    return { label: labelFor(dates.start, dates.end), ...dates };
  }, [world.sessions, first, monthSetting]);
  const [values, setValues] = useState<{ label: string; start: string; end: string; system: SessionSystem } | null>(null);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [report, setReport] = useState<string[]>([]);
  const form = values ?? { ...initial, system: 'semester' as SessionSystem };
  const chosen = selected ?? institutions.map((item) => item.id);

  const close = () => {
    setValues(null);
    setSelected(null);
    setReport([]);
    onClose();
  };

  const submit = () => {
    const problems: string[] = [];
    const failed: string[] = [];
    chosen.forEach((id) => {
      const target = institutions.find((item) => item.id === id);
      const result = apply((snap, now, actor) => saveSession(snap, id, { ...form, terms: generateTerms(form.start, form.end, form.system) }, actor, now));
      if (!result.ok) {
        failed.push(id);
        problems.push(`${target?.shortName ?? id}: ${result.error}`);
      }
    });
    setReport(problems);
    if (failed.length === 0) close();
    else setSelected(failed);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Plan a session for several institutions"
      description="Terms are split evenly. Each institution can adjust them afterwards."
      size="md"
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={chosen.length === 0}>
            Plan for {chosen.length} {chosen.length === 1 ? 'institution' : 'institutions'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {report.length > 0 && (
          <Alert tone="warning" title="Some institutions were not changed">
            <ul className="list-disc pl-5">
              {report.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Session name" required value={form.label} onChange={(value) => setValues({ ...form, label: value })} />
          <SelectField label="Terms" options={SYSTEMS} value={form.system} onChange={(value) => setValues({ ...form, system: value as SessionSystem })} />
          <TextField label="First day" type="date" required value={form.start} onChange={(value) => setValues({ ...form, start: value })} />
          <TextField label="Last day" type="date" required value={form.end} onChange={(value) => setValues({ ...form, end: value })} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-charcoal-800">Institutions</legend>
          <p className="mb-2 text-xs text-charcoal-600">Institutions that run independently plan their own sessions and are not listed.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {institutions.map((item) => (
              <CheckboxField key={item.id} label={item.shortName} checked={chosen.includes(item.id)} onChange={(checked) => setSelected(checked ? [...chosen, item.id] : chosen.filter((id) => id !== item.id))} />
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}
