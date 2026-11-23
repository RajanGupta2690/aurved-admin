import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { change } from '../../../core/api/worldStore';
import { GRADING_SCHEMES, BOARDS, SCHOOL_STAGES, SESSION_SYSTEM_LABEL, UNIT_KIND_LABEL } from '../../../core/org/model';
import type { Actor, GradingScheme, SessionSystem } from '../../../core/org/model';
import { createInstitution, generateTerms, validateSession } from '../../../core/org/ops';
import type { NewInstitutionInput } from '../../../core/org/ops';
import { ALLOWED_RELATIONSHIPS, RELATIONSHIP_HELP, findDuplicates, formatDate, policyFor, relationshipProblem } from '../../../core/org/rules';
import { ORG_TYPE_LABEL, PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Organization, ProfileKind, RelationshipType } from '../../../core/org/types';
import Button from '../../../shared/ui/Button';
import { CheckboxField, SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, DescriptionList, Stepper } from '../../../shared/ui/Layout';
import { useToast } from '../../../shared/ui/toastContext';
import { useForm } from '../../../shared/ui/useForm';
import { firstError, required } from '../../../shared/ui/validators';
import type { Validator } from '../../../shared/ui/validators';
import { useOrgData, useWorld } from '../hooks';

const STEPS = ['Basics', 'Curriculum', 'Campuses', 'Calendar', 'Review'];

interface Values extends Record<string, unknown> {
  profile: string;
  name: string;
  shortName: string;
  country: string;
  city: string;
  registrationNo: string;
  relationship: string;
  unitIds: string[];
  board: string;
  gradingScheme: string;
  medium: string;
  stages: string[];
  sessionLabel: string;
  sessionStart: string;
  sessionEnd: string;
  sessionSystem: string;
}

interface CampusRow {
  name: string;
  city: string;
  address: string;
}

const STEP_FIELDS: Array<Array<keyof Values>> = [
  ['profile', 'name', 'shortName', 'country', 'city', 'relationship'],
  ['board', 'gradingScheme', 'stages'],
  [],
  ['sessionLabel', 'sessionStart', 'sessionEnd'],
  [],
];

const pad = (value: number) => String(value).padStart(2, '0');

/** First day and last day of the session that is running now, for a school (April) or a college (July). */
function defaultSession(profile: string, month?: number) {
  const today = new Date();
  const startMonth = month ?? (profile === 'school' ? 4 : 7);
  const startYear = today.getMonth() + 1 >= startMonth ? today.getFullYear() : today.getFullYear() - 1;
  const day = month || profile === 'school' ? 1 : 15;
  const start = `${startYear}-${pad(startMonth)}-${pad(day)}`;
  const end = new Date(Date.UTC(startYear + 1, startMonth - 1, day) - 86_400_000).toISOString().slice(0, 10);
  return { start, end, label: `${startYear}-${startYear + 1}` };
}

interface WizardProps {
  mode: 'independent' | 'in_org';
  /** The organization to add to, when mode is in_org. */
  org?: Organization;
  actor: Actor;
  onCancel: () => void;
  onCreated: (result: { instId: string; orgId: string }) => void;
}

/**
 * ORG-05 (add to an organization) and ORG-15 (create an independent institution).
 * Five steps. Each step is checked before the next. The rules of the organization apply and are explained on the step.
 */
export default function InstitutionWizard({ mode, org, actor, onCancel, onCreated }: WizardProps) {
  const toast = useToast();
  const { institutions } = useOrgData();
  const world = useWorld();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [campuses, setCampuses] = useState<CampusRow[]>([{ name: 'Main campus', city: '', address: '' }]);
  const [campusError, setCampusError] = useState('');

  const orgId = org?.id ?? '';
  const prefixPolicy = org ? policyFor(world, org.id, 'naming.prefix') : null;
  const gradingPolicy = org ? policyFor(world, org.id, 'grading.common') : null;
  const monthPolicy = org ? policyFor(world, org.id, 'session.start_month') : null;
  const allowedRelationships: RelationshipType[] = org ? ALLOWED_RELATIONSHIPS[org.type] : [];
  const profiles = (Object.keys(PROFILE_LABEL) as ProfileKind[]).filter((profile) => !org || allowedRelationships.some((relationship) => relationshipProblem(org, { profile, name: '' }, relationship) === null));
  const firstProfile = profiles[0] ?? 'school';
  const initialSession = defaultSession(firstProfile, monthPolicy ? Number(monthPolicy.value) : undefined);

  const form = useForm<Values>(() => ({
    profile: firstProfile,
    name: prefixPolicy ? `${prefixPolicy.value.trim()} ` : '',
    shortName: '',
    country: org?.country ?? 'India',
    city: '',
    registrationNo: '',
    relationship: allowedRelationships[0] ?? 'member',
    unitIds: [],
    board: BOARDS[firstProfile][0],
    gradingScheme: gradingPolicy?.value ?? 'percentage',
    medium: 'English',
    stages: firstProfile === 'school' ? ['Primary', 'Middle', 'Secondary'] : [],
    sessionLabel: initialSession.label,
    sessionStart: initialSession.start,
    sessionEnd: initialSession.end,
    sessionSystem: 'semester',
  }));
  const { values } = form;
  const profile = values.profile as ProfileKind;
  const relationship = values.relationship as RelationshipType;

  const rules: Partial<Record<keyof Values, Validator[]>> = {
    profile: [required('Choose the type of institution.')],
    name: [
      required('Enter the full name.'),
      (value) => (prefixPolicy && !String(value).trim().toLowerCase().startsWith(prefixPolicy.value.trim().toLowerCase()) ? `${org?.name} requires names to start with "${prefixPolicy.value.trim()}".` : undefined),
      (value) => (String(value).trim().length < 3 ? 'Enter the full name.' : undefined),
    ],
    shortName: [required('Enter a short name for menus.')],
    country: [required('Enter the country.')],
    city: [required('Enter the city.')],
    relationship: org ? [(value) => (relationshipProblem(org, { profile, name: '' }, value as RelationshipType) ?? undefined)] : [],
    board: [required('Choose the board or regulator.')],
    gradingScheme: [required('Choose the grading scheme.')],
    stages: profile === 'school' ? [required('Choose at least one stage.')] : [],
    sessionLabel: [required('Name the session.')],
  };

  const duplicates = useMemo(
    () => (values.name.trim().length >= 3 && values.city.trim() ? findDuplicates(institutions, { name: values.name, city: values.city, registrationNo: values.registrationNo }) : []),
    [institutions, values.name, values.city, values.registrationNo],
  );
  const regClash = useMemo(
    () => (values.registrationNo.trim() ? findDuplicates(institutions, { name: '', city: '', registrationNo: values.registrationNo }) : []),
    [institutions, values.registrationNo],
  );

  const terms = useMemo(() => generateTerms(values.sessionStart, values.sessionEnd, values.sessionSystem as SessionSystem), [values.sessionStart, values.sessionEnd, values.sessionSystem]);
  const sessionProblems = validateSession(
    { label: values.sessionLabel, start: values.sessionStart, end: values.sessionEnd, system: values.sessionSystem as SessionSystem, terms },
    [],
    monthPolicy ? Number(monthPolicy.value) : undefined,
  );

  const validateStep = (index: number): boolean => {
    const found: Partial<Record<keyof Values, string>> = {};
    STEP_FIELDS[index].forEach((key) => {
      const message = firstError(values[key], values, rules[key] ?? []);
      if (message) found[key] = message;
    });
    if (index === 0 && !found.name && duplicates.length > 0) found.name = `"${duplicates[0].name}" in ${duplicates[0].city} already exists.`;
    if (index === 0 && regClash.length > 0) found.registrationNo = `This registration number belongs to ${regClash[0].name}.`;
    if (index === 2) {
      const filled = campuses.filter((campus) => campus.name.trim());
      const names = filled.map((campus) => campus.name.trim().toLowerCase());
      if (filled.length === 0) setCampusError('Add at least one campus with a name.');
      else if (new Set(names).size !== names.length) setCampusError('Two campuses have the same name.');
      else setCampusError('');
      if (filled.length === 0 || new Set(names).size !== names.length) return false;
    }
    if (index === 3) {
      if (sessionProblems.start) found.sessionStart = sessionProblems.start;
      if (sessionProblems.end) found.sessionEnd = sessionProblems.end;
      if (sessionProblems.label && !found.sessionLabel) found.sessionLabel = sessionProblems.label;
    }
    form.setErrors(found);
    if (Object.keys(found).length > 0) {
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return false;
    }
    return true;
  };

  const next = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const create = () => {
    const input: NewInstitutionInput = {
      mode,
      orgId: orgId || undefined,
      relationship: mode === 'in_org' ? relationship : undefined,
      unitIds: values.unitIds,
      profile,
      name: values.name,
      shortName: values.shortName,
      country: values.country,
      city: values.city,
      registrationNo: values.registrationNo || undefined,
      board: values.board,
      gradingScheme: (gradingPolicy?.value ?? values.gradingScheme) as GradingScheme,
      medium: values.medium,
      stages: values.stages,
      campuses: campuses.filter((campus) => campus.name.trim()).map((campus) => ({ ...campus, city: campus.city.trim() || values.city })),
      session: { label: values.sessionLabel, start: values.sessionStart, end: values.sessionEnd, system: values.sessionSystem as SessionSystem },
    };
    const result = change((snap, now) => createInstitution(snap, input, actor, now));
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    toast.success(`${values.shortName} created.`);
    onCreated({ instId: result.instId, orgId: result.orgId });
  };

  const changeProfile = (next: string) => {
    const kind = next as ProfileKind;
    form.setValues((previous) => ({
      ...previous,
      profile: next,
      board: BOARDS[kind][0],
      stages: kind === 'school' ? ['Primary', 'Middle', 'Secondary'] : [],
      sessionSystem: kind === 'institute' ? 'trimester' : 'semester',
      ...(monthPolicy ? {} : (() => { const d = defaultSession(kind); return { sessionStart: d.start, sessionEnd: d.end, sessionLabel: d.label }; })()),
    }));
  };

  const updateCampus = (index: number, patch: Partial<CampusRow>) => setCampuses((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const availableUnits = world.units.filter((unit) => unit.orgId === orgId && !unit.archived);

  return (
    <div>
      <div className="mb-6">
        <Stepper steps={STEPS} current={step} />
      </div>

      {mode === 'in_org' && org && (prefixPolicy || gradingPolicy || monthPolicy) && step < 4 && (
        <Alert tone="info" title={`Rules of ${org.name}`} className="mb-4">
          <ul className="list-disc pl-5">
            {prefixPolicy && <li>The name starts with "{prefixPolicy.value.trim()}".</li>}
            {gradingPolicy && <li>The grading scheme is fixed: {GRADING_SCHEMES.find((item) => item.value === gradingPolicy.value)?.label}.</li>}
            {monthPolicy && <li>The session starts in month {monthPolicy.value}.</li>}
          </ul>
        </Alert>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (step < STEPS.length - 1) next();
          else create();
        }}
        noValidate
      >
        {step === 0 && (
          <Card title="Basics" description={mode === 'in_org' ? `This institution will belong to ${org?.name} (${ORG_TYPE_LABEL[org!.type].toLowerCase()}).` : 'It will have its own account and its own administrators. You become its administrator.'}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Type of institution" required options={profiles.map((value) => ({ value, label: PROFILE_LABEL[value] }))} {...form.bind('profile')} onChange={changeProfile} />
              {mode === 'in_org' ? (
                <SelectField
                  label="Relationship"
                  required
                  hint={RELATIONSHIP_HELP[relationship]?.sees}
                  options={allowedRelationships.map((value) => ({ value, label: RELATIONSHIP_LABEL[value], disabled: relationshipProblem(org!, { profile, name: '' }, value) !== null }))}
                  {...form.bind('relationship')}
                />
              ) : (
                <div />
              )}
              <TextField className="sm:col-span-2" label="Full name" required autoFocus {...form.bind('name')} />
              <TextField label="Short name" hint="Shown in menus and tables." required {...form.bind('shortName')} />
              <TextField label="Registration or recognition number" hint="Optional. Used to avoid duplicates." {...form.bind('registrationNo')} />
              <TextField label="City" required {...form.bind('city')} />
              <TextField label="Country" required {...form.bind('country')} />
            </div>
            {duplicates.length > 0 && (
              <Alert tone="warning" title="This institution may already exist" className="mt-4">
                "{duplicates[0].name}" in {duplicates[0].city} has the same name. Open that one instead of creating it again.
              </Alert>
            )}
            {mode === 'in_org' && availableUnits.length > 0 && (
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-medium text-charcoal-800">Place it in units (optional)</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableUnits.map((unit) => (
                    <CheckboxField key={unit.id} label={unit.name} hint={UNIT_KIND_LABEL[unit.kind]} checked={values.unitIds.includes(unit.id)} onChange={(checked) => form.set('unitIds', checked ? [...values.unitIds, unit.id] : values.unitIds.filter((id) => id !== unit.id))} />
                  ))}
                </div>
              </fieldset>
            )}
          </Card>
        )}

        {step === 1 && (
          <Card title="Board and curriculum" description="You can change these later in Curriculum.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label={profile === 'school' ? 'Board' : 'Regulator or scheme'} required options={BOARDS[profile].map((value) => ({ value, label: value }))} {...form.bind('board')} />
              <SelectField
                label="Grading scheme"
                required
                disabled={Boolean(gradingPolicy)}
                hint={gradingPolicy ? `Fixed by ${org?.name}.` : undefined}
                options={GRADING_SCHEMES.map((item) => ({ value: item.value, label: item.label }))}
                {...form.bind('gradingScheme')}
                value={gradingPolicy?.value ?? values.gradingScheme}
              />
              <TextField label="Medium of instruction" {...form.bind('medium')} />
            </div>
            {profile === 'school' ? (
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-medium text-charcoal-800">Stages taught</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {SCHOOL_STAGES.map((stage) => (
                    <CheckboxField key={stage} label={stage} checked={values.stages.includes(stage)} onChange={(checked) => form.set('stages', checked ? [...values.stages, stage] : values.stages.filter((item) => item !== stage))} />
                  ))}
                </div>
                {form.errors.stages && <p className="mt-1 text-xs text-danger-700">{form.errors.stages}</p>}
              </fieldset>
            ) : (
              <p className="mt-6 text-sm text-charcoal-600">Programmes are added in Curriculum after the institution is created.</p>
            )}
          </Card>
        )}

        {step === 2 && (
          <Card title="Campuses" description="Every institution has at least one campus. Add the others now or later.">
            <div className="space-y-4">
              {campuses.map((campus, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-warm-200 p-3 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end">
                  <TextField label={`Campus ${index + 1} name`} required value={campus.name} onChange={(value) => updateCampus(index, { name: value })} />
                  <TextField label="City" placeholder={values.city || 'Same as institution'} value={campus.city} onChange={(value) => updateCampus(index, { city: value })} />
                  <TextField label="Address" value={campus.address} onChange={(value) => updateCampus(index, { address: value })} />
                  <Button variant="ghost" onClick={() => setCampuses((rows) => rows.filter((_, i) => i !== index))} disabled={campuses.length === 1} aria-label={`Remove campus ${index + 1}`} icon={<Trash2 size={16} aria-hidden="true" />} />
                </div>
              ))}
              {campusError && <p className="text-sm text-danger-700">{campusError}</p>}
              <Button icon={<Plus size={16} aria-hidden="true" />} onClick={() => setCampuses((rows) => [...rows, { name: '', city: '', address: '' }])}>
                Add another campus
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card title="Academic calendar" description="The first session. Terms are split evenly and can be adjusted later in Academic sessions.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Session name" required {...form.bind('sessionLabel')} />
              <SelectField label="Terms" options={Object.entries(SESSION_SYSTEM_LABEL).map(([value, label]) => ({ value, label }))} {...form.bind('sessionSystem')} />
              <TextField label="First day" type="date" required {...form.bind('sessionStart')} />
              <TextField label="Last day" type="date" required {...form.bind('sessionEnd')} />
            </div>
            {terms.length > 0 && !sessionProblems.end && (
              <ul className="mt-4 divide-y divide-warm-200 rounded-xl border border-warm-200 text-sm">
                {terms.map((term) => (
                  <li key={term.id} className="flex justify-between gap-3 px-3 py-2">
                    <span className="font-medium text-charcoal-900">{term.name}</span>
                    <span className="text-charcoal-600">
                      {formatDate(term.start)} to {formatDate(term.end)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {step === 4 && (
          <Card title="Review" description="Check everything. Nothing is created until you confirm.">
            <DescriptionList
              items={[
                { label: 'Name', value: values.name },
                { label: 'Short name', value: values.shortName },
                { label: 'Type', value: PROFILE_LABEL[profile] },
                { label: 'Belongs to', value: mode === 'in_org' ? `${org?.name} as ${RELATIONSHIP_LABEL[relationship].toLowerCase()}` : 'Itself (independent)' },
                { label: 'City', value: `${values.city}, ${values.country}` },
                { label: 'Registration number', value: values.registrationNo || undefined },
                { label: 'Board', value: values.board },
                { label: 'Grading scheme', value: GRADING_SCHEMES.find((item) => item.value === (gradingPolicy?.value ?? values.gradingScheme))?.label },
                { label: 'Campuses', value: campuses.filter((campus) => campus.name.trim()).map((campus) => campus.name.trim()).join(', ') },
                { label: 'First session', value: `${values.sessionLabel}, ${formatDate(values.sessionStart)} to ${formatDate(values.sessionEnd)}` },
                ...(mode === 'in_org' ? [{ label: 'Units', value: availableUnits.filter((unit) => values.unitIds.includes(unit.id)).map((unit) => unit.name).join(', ') || 'None' }] : []),
              ]}
            />
            {mode === 'in_org' && relationship !== 'member' && relationship !== 'constituent' && relationship !== 'owned_campus' && (
              <Alert tone="info" title="Runs independently" className="mt-4">
                {org?.name} will see nothing of its records until the institution agrees to share. Data sharing starts at {policyFor(world, orgId, 'sharing.default')?.value === 'summary' ? 'summary only' : 'nothing shared'}.
              </Alert>
            )}
            {mode === 'independent' && (
              <Alert tone="info" className="mt-4">
                You will be its institution administrator. Other people are added later in Staff and access.
              </Alert>
            )}
            {submitError && (
              <Alert tone="danger" className="mt-4">
                {submitError}
              </Alert>
            )}
          </Card>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={step === 0 ? onCancel : () => setStep(step - 1)}>{step === 0 ? 'Cancel' : 'Back'}</Button>
          <Button variant="primary" type="submit">
            {step === STEPS.length - 1 ? 'Create institution' : 'Next'}
          </Button>
        </div>
      </form>
    </div>
  );
}
