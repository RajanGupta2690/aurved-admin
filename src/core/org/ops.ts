import {
  GRADING_SCHEMES,
  OPEN_LINK_STATUSES,
  PLAN_NAMES,
  POLICY_CATALOG,
  SESSION_SYSTEM_PARTS,
  SESSION_TERM_WORD,
  SHARE_DOMAINS,
  SHARE_LEVEL_RANK,
} from './model';
import type {
  AcademicSession,
  Actor,
  Agreement,
  CurriculumConfig,
  GradingScheme,
  HistoryEntry,
  HistoryKind,
  LinkEvent,
  LinkRequest,
  OrgUnit,
  PolicySetting,
  SessionSystem,
  ShareLevel,
  Snapshot,
  Term,
  UnitKind,
  World,
} from './model';
import {
  ALLOWED_RELATIONSHIPS,
  checklistFor,
  findDuplicates,
  isExternal,
  isIndependent,
  nextId,
  policyFor,
  relationshipProblem,
  slugify,
} from './rules';
import type { Campus, CampusKind, Institution, Organization, ProfileKind, RelationshipType } from './types';

/**
 * Every change to organizations, institutions and the data around them.
 * Pure functions: they take a snapshot and return a new one, or an error sentence.
 * The interface checks fields first. These functions check the business rules again,
 * because the server must do the same later.
 */
export type Res<E extends object = object> = ({ ok: true; snap: Snapshot } & E) | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

// ---------- helpers
function record(snap: Snapshot, entry: { orgId: string; instId?: string; kind: HistoryKind; summary: string; reason?: string }, actor: Actor, now: string): Snapshot {
  const id = nextId(
    'hist',
    snap.world.history.map((item) => item.id),
  );
  const item: HistoryEntry = { id, at: now, byName: actor.name, ...entry };
  return { ...snap, world: { ...snap.world, history: [item, ...snap.world.history] } };
}

const orgOf = (snap: Snapshot, id: string) => snap.orgs.organizations.find((org) => org.id === id);
const instOf = (snap: Snapshot, id: string) => snap.orgs.institutions.find((inst) => inst.id === id);

function replaceInst(snap: Snapshot, next: Institution): Snapshot {
  return { ...snap, orgs: { ...snap.orgs, institutions: snap.orgs.institutions.map((inst) => (inst.id === next.id ? next : inst)) } };
}

function replaceOrg(snap: Snapshot, next: Organization): Snapshot {
  return { ...snap, orgs: { ...snap.orgs, organizations: snap.orgs.organizations.map((org) => (org.id === next.id ? next : org)) } };
}

function patchWorld(snap: Snapshot, patch: Partial<World>): Snapshot {
  return { ...snap, world: { ...snap.world, ...patch } };
}

/** The institution that carries the name of a university organization, used as the parent of its colleges. */
export function parentInstitutionOf(institutions: Institution[], orgId: string): Institution | undefined {
  return institutions.find((inst) => inst.orgId === orgId && inst.profile === 'university' && !inst.relationship);
}

function relationshipFor(snap: Snapshot, orgId: string, type: RelationshipType): Institution['relationship'] {
  if (type === 'member') return undefined;
  const parent = parentInstitutionOf(snap.orgs.institutions, orgId);
  return parent ? { type, parentInstId: parent.id } : undefined;
}

function changedFields(before: Record<string, unknown>, after: Record<string, unknown>, labels: Record<string, string>): string[] {
  return Object.keys(labels).filter((key) => String(before[key] ?? '') !== String(after[key] ?? '')).map((key) => labels[key]);
}

function defaultShareLevel(snap: Snapshot, orgId: string): ShareLevel {
  const setting = policyFor(snap.world, orgId, 'sharing.default');
  return setting?.value === 'summary' ? 'summary' : 'none';
}

function freshAgreements(snap: Snapshot, instId: string, orgId: string, actor: Actor, now: string): Agreement[] {
  const level = defaultShareLevel(snap, orgId);
  return SHARE_DOMAINS.map((domain) => ({ instId, domain: domain.key, level, updatedAt: now, updatedByName: actor.name }));
}

// ---------- dates
const DAY = 86_400_000;
const toTime = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);

export function generateTerms(start: string, end: string, system: SessionSystem): Term[] {
  const parts = SESSION_SYSTEM_PARTS[system];
  const from = toTime(start);
  const to = toTime(end);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return [];
  const days = Math.round((to - from) / DAY) + 1;
  if (parts === 1) return [{ id: 'term-1', name: 'Full year', start, end }];
  return Array.from({ length: parts }, (_, index) => {
    const first = from + Math.floor((days * index) / parts) * DAY;
    const last = index === parts - 1 ? to : from + (Math.floor((days * (index + 1)) / parts) - 1) * DAY;
    return { id: `term-${index + 1}`, name: `${SESSION_TERM_WORD[system]} ${index + 1}`, start: toIso(first), end: toIso(last) };
  });
}

export interface SessionDraft {
  label: string;
  start: string;
  end: string;
  system: SessionSystem;
  terms: Term[];
}

export type SessionErrors = Partial<Record<'label' | 'start' | 'end' | 'terms', string>>;

/** Rules for one academic session. others are the other sessions of the same institution. */
export function validateSession(draft: SessionDraft, others: AcademicSession[], startMonth?: number): SessionErrors {
  const errors: SessionErrors = {};
  if (!draft.label.trim()) errors.label = 'Enter a name for the session.';
  else if (others.some((item) => item.label.trim().toLowerCase() === draft.label.trim().toLowerCase())) errors.label = 'Another session already has this name.';
  if (!draft.start) errors.start = 'Choose the first day.';
  if (!draft.end) errors.end = 'Choose the last day.';
  if (draft.start && draft.end) {
    const days = (toTime(draft.end) - toTime(draft.start)) / DAY + 1;
    if (days <= 0) errors.end = 'The last day must be after the first day.';
    else if (days < 28) errors.end = 'A session must last at least 4 weeks.';
    else if (days > 400) errors.end = 'A session cannot be longer than about 13 months.';
    else {
      const clash = others.find((item) => draft.start <= item.end && draft.end >= item.start);
      if (clash) errors.start = `These dates overlap "${clash.label}".`;
    }
  }
  if (startMonth && draft.start && Number(draft.start.slice(5, 7)) !== startMonth) {
    errors.start = `The organization requires sessions to start in month ${startMonth}.`;
  }
  if (!errors.start && !errors.end) {
    const sorted = [...draft.terms].sort((a, b) => a.start.localeCompare(b.start));
    for (let index = 0; index < sorted.length; index++) {
      const term = sorted[index];
      if (!term.name.trim()) {
        errors.terms = 'Every term needs a name.';
        break;
      }
      if (!term.start || !term.end || term.end < term.start) {
        errors.terms = `"${term.name}" ends before it starts.`;
        break;
      }
      if (term.start < draft.start || term.end > draft.end) {
        errors.terms = `"${term.name}" is outside the session dates.`;
        break;
      }
      if (index > 0 && term.start <= sorted[index - 1].end) {
        errors.terms = `"${term.name}" overlaps "${sorted[index - 1].name}".`;
        break;
      }
    }
  }
  return errors;
}

export function sessionIdFor(start: string, end: string): string {
  return `ay-${start.slice(0, 4)}-${end.slice(2, 4)}`;
}

// ---------- organization and institution details
export type OrgPatch = Partial<Pick<Organization, 'name' | 'type' | 'country' | 'governance' | 'legalName' | 'registrationNo' | 'email' | 'phone' | 'website' | 'address' | 'foundedYear'>>;

const ORG_LABELS: Record<string, string> = {
  name: 'name',
  type: 'type',
  country: 'country',
  governance: 'governance model',
  legalName: 'legal name',
  registrationNo: 'registration number',
  email: 'email',
  phone: 'phone',
  website: 'website',
  address: 'address',
  foundedYear: 'founding year',
};

export function updateOrganization(snap: Snapshot, orgId: string, patch: OrgPatch, actor: Actor, now: string): Res {
  const org = orgOf(snap, orgId);
  if (!org) return fail('This organization does not exist.');
  if (patch.name !== undefined && patch.name.trim().length < 2) return fail('The organization needs a name.');
  if (patch.type && patch.type !== org.type) {
    if (org.implicit) return fail('The type of an independent institution follows from what it is.');
    const allowed = ALLOWED_RELATIONSHIPS[patch.type];
    const conflict = snap.orgs.institutions.find((inst) => inst.orgId === orgId && !allowed.includes(inst.relationship?.type ?? 'member'));
    if (conflict) return fail(`${conflict.shortName} is related as "${(conflict.relationship?.type ?? 'member').replace(/_/g, ' ')}". That is not possible for this type. Change the relationship first.`);
    const misfit = snap.orgs.institutions.find((inst) => inst.orgId === orgId && relationshipProblem({ ...org, type: patch.type! }, inst, inst.relationship?.type ?? 'member'));
    if (misfit) return fail(`${misfit.shortName} does not fit a ${patch.type.replace(/_/g, ' ')}.`);
  }
  const next: Organization = { ...org, ...patch, name: (patch.name ?? org.name).trim() };
  const changes = changedFields(org as unknown as Record<string, unknown>, next as unknown as Record<string, unknown>, ORG_LABELS);
  if (changes.length === 0) return fail('Nothing was changed.');
  const updated = record(replaceOrg(snap, next), { orgId, kind: 'organization', summary: `Updated the organization: ${changes.join(', ')}.` }, actor, now);
  return { ok: true, snap: updated };
}

export type InstPatch = Partial<Pick<Institution, 'name' | 'shortName' | 'city' | 'country' | 'email' | 'phone' | 'address' | 'headName' | 'registrationNo' | 'foundedYear' | 'affiliation'>>;

const INST_LABELS: Record<string, string> = {
  name: 'name',
  shortName: 'short name',
  city: 'city',
  country: 'country',
  email: 'email',
  phone: 'phone',
  address: 'address',
  headName: 'head of institution',
  registrationNo: 'registration number',
  foundedYear: 'founding year',
  affiliation: 'affiliation text',
};

/** The prefix rule of the organization, as a sentence, or null when the name is fine. */
export function namePolicyProblem(world: Pick<World, 'policies'>, orgId: string, name: string): string | null {
  const setting = policyFor(world, orgId, 'naming.prefix');
  if (!setting || !setting.value.trim()) return null;
  return name.trim().toLowerCase().startsWith(setting.value.trim().toLowerCase()) ? null : `The organization requires names to start with "${setting.value.trim()}".`;
}

export function updateInstitution(snap: Snapshot, instId: string, patch: InstPatch, actor: Actor, now: string): Res {
  const inst = instOf(snap, instId);
  if (!inst) return fail('This institution does not exist.');
  const next: Institution = { ...inst, ...patch };
  if (!next.name.trim()) return fail('The institution needs a name.');
  if (!next.shortName.trim()) return fail('The institution needs a short name.');
  if (!next.city.trim()) return fail('Enter the city.');
  if (patch.name !== undefined && patch.name.trim() !== inst.name) {
    const problem = namePolicyProblem(snap.world, inst.orgId, patch.name);
    if (problem) return fail(problem);
  }
  const clash = findDuplicates(snap.orgs.institutions, { name: next.name, city: next.city, registrationNo: next.registrationNo }, inst.id);
  if (clash.length > 0) return fail(`"${clash[0].name}" in ${clash[0].city} already exists with the same name or registration number.`);
  const changes = changedFields(inst as unknown as Record<string, unknown>, next as unknown as Record<string, unknown>, INST_LABELS);
  if (changes.length === 0) return fail('Nothing was changed.');
  return { ok: true, snap: record(replaceInst(snap, next), { orgId: inst.orgId, instId, kind: 'institution', summary: `Updated ${inst.shortName}: ${changes.join(', ')}.` }, actor, now) };
}

const STATUS_MOVES: Record<Institution['status'], Array<Institution['status']>> = {
  pending: ['active', 'archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: ['active'],
};

export function setInstitutionStatus(snap: Snapshot, instId: string, status: Institution['status'], actor: Actor, now: string, reason?: string): Res {
  const inst = instOf(snap, instId);
  if (!inst) return fail('This institution does not exist.');
  if (!STATUS_MOVES[inst.status].includes(status)) return fail(`An institution that is ${inst.status} cannot become ${status}.`);
  if ((status === 'suspended' || status === 'archived') && (reason ?? '').trim().length < 3) return fail('Write a reason.');
  const verb = status === 'active' ? (inst.status === 'pending' ? 'Approved' : 'Reactivated') : status === 'suspended' ? 'Suspended' : 'Archived';
  return { ok: true, snap: record(replaceInst(snap, { ...inst, status }), { orgId: inst.orgId, instId, kind: 'institution', summary: `${verb} ${inst.shortName}.`, reason: reason?.trim() || undefined }, actor, now) };
}

// ---------- creating an institution
export interface NewInstitutionInput {
  mode: 'independent' | 'in_org';
  orgId?: string;
  relationship?: RelationshipType;
  unitIds?: string[];
  profile: ProfileKind;
  name: string;
  shortName: string;
  country: string;
  city: string;
  registrationNo?: string;
  board: string;
  gradingScheme: GradingScheme;
  medium: string;
  stages: string[];
  campuses: Array<{ name: string; city: string; address?: string }>;
  session: { label: string; start: string; end: string; system: SessionSystem };
}

function independentOrgType(input: NewInstitutionInput): Organization['type'] {
  if (input.profile === 'school') return 'single_school';
  if (input.profile === 'university') return 'university';
  return input.campuses.length > 1 ? 'multi_campus' : 'single_college';
}

export function createInstitution(snap: Snapshot, input: NewInstitutionInput, actor: Actor, now: string): Res<{ instId: string; orgId: string }> {
  if (input.name.trim().length < 3) return fail('Enter the full name of the institution.');
  if (!input.shortName.trim()) return fail('Enter a short name.');
  if (!input.city.trim()) return fail('Enter the city.');
  if (input.campuses.length === 0 || input.campuses.some((campus) => !campus.name.trim())) return fail('Add at least one campus with a name.');

  const duplicates = findDuplicates(snap.orgs.institutions, { name: input.name, city: input.city, registrationNo: input.registrationNo });
  if (duplicates.length > 0) return fail(`"${duplicates[0].name}" in ${duplicates[0].city} already exists. Open it instead of creating it again.`);

  let org: Organization | undefined;
  let relationshipType: RelationshipType = 'member';
  let grading = input.gradingScheme;
  let startMonth: number | undefined;
  let organizations = snap.orgs.organizations;

  if (input.mode === 'in_org') {
    org = orgOf(snap, input.orgId ?? '');
    if (!org || org.implicit) return fail('Choose the organization this institution belongs to.');
    relationshipType = input.relationship ?? 'member';
    const problem = relationshipProblem(org, input, relationshipType);
    if (problem) return fail(problem);
    const naming = namePolicyProblem(snap.world, org.id, input.name);
    if (naming) return fail(naming);
    const gradingPolicy = policyFor(snap.world, org.id, 'grading.common');
    if (gradingPolicy) grading = gradingPolicy.value as GradingScheme;
    const monthPolicy = policyFor(snap.world, org.id, 'session.start_month');
    if (monthPolicy) startMonth = Number(monthPolicy.value);
  } else {
    const baseId = `org-${slugify(input.name) || 'new'}`;
    let orgId = baseId;
    let counter = 2;
    while (organizations.some((item) => item.id === orgId)) orgId = `${baseId}-${counter++}`;
    const type = independentOrgType(input);
    org = { id: orgId, name: input.name.trim(), type, country: input.country.trim() || 'India', implicit: type !== 'university' };
    organizations = [...organizations, org];
  }

  const sessionErrors = validateSession(
    { ...input.session, terms: generateTerms(input.session.start, input.session.end, input.session.system) },
    [],
    startMonth,
  );
  if (Object.keys(sessionErrors).length > 0) return fail(Object.values(sessionErrors)[0] as string);

  const baseInstId = `inst-${slugify(input.shortName || input.name) || 'new'}`;
  let instId = baseInstId;
  let counter = 2;
  while (snap.orgs.institutions.some((item) => item.id === instId)) instId = `${baseInstId}-${counter++}`;

  const campusBase = `camp-${instId.replace(/^inst-/, '')}`;
  const campuses: Campus[] = input.campuses.map((campus, index) => ({
    id: `${campusBase}-${index + 1}`,
    name: campus.name.trim(),
    city: campus.city.trim() || input.city.trim(),
    address: campus.address?.trim() || undefined,
    kind: (index === 0 ? 'main' : 'branch') as CampusKind,
    status: 'active',
  }));

  const relationship = input.mode === 'in_org' ? relationshipFor({ ...snap, orgs: { ...snap.orgs, organizations } }, org.id, relationshipType) : undefined;
  const inst: Institution = {
    id: instId,
    orgId: org.id,
    name: input.name.trim(),
    shortName: input.shortName.trim(),
    profile: input.profile,
    country: input.country.trim() || org.country,
    city: input.city.trim(),
    campuses,
    relationship,
    status: 'active',
    registrationNo: input.registrationNo?.trim() || undefined,
  };

  const curriculum: CurriculumConfig = {
    instId,
    board: input.board,
    gradingScheme: grading,
    medium: input.medium.trim() || 'English',
    stages: input.profile === 'school' ? input.stages : [],
    programmes: [],
  };
  const session: AcademicSession = {
    id: sessionIdFor(input.session.start, input.session.end),
    instId,
    label: input.session.label.trim(),
    start: input.session.start,
    end: input.session.end,
    status: 'current',
    system: input.session.system,
    terms: generateTerms(input.session.start, input.session.end, input.session.system),
  };

  let next: Snapshot = { orgs: { organizations, institutions: [...snap.orgs.institutions, inst] }, world: snap.world };
  const unitIds = input.mode === 'in_org' ? input.unitIds ?? [] : [];
  next = patchWorld(next, {
    curricula: [...next.world.curricula, curriculum],
    sessions: [...next.world.sessions, session],
    units: next.world.units.map((unit) => (unitIds.includes(unit.id) && !unit.instIds.includes(instId) ? { ...unit, instIds: [...unit.instIds, instId] } : unit)),
    agreements: isExternal(inst) ? [...next.world.agreements, ...freshAgreements(next, instId, org.id, actor, now)] : next.world.agreements,
  });
  const summary =
    input.mode === 'in_org'
      ? `Added ${inst.shortName} to ${org.name} as ${relationshipType.replace(/_/g, ' ')}.`
      : `Created the independent institution ${inst.shortName}.`;
  next = record(next, { orgId: org.id, instId, kind: 'institution', summary }, actor, now);
  return { ok: true, snap: next, instId, orgId: org.id };
}

// ---------- campuses
export interface CampusDraft {
  id?: string;
  name: string;
  city: string;
  address?: string;
  code?: string;
  kind: CampusKind;
}

export function saveCampus(snap: Snapshot, instId: string, draft: CampusDraft, actor: Actor, now: string): Res {
  const inst = instOf(snap, instId);
  if (!inst) return fail('This institution does not exist.');
  const name = draft.name.trim();
  if (name.length < 2) return fail('Enter the campus name.');
  if (!draft.city.trim()) return fail('Enter the city.');
  const clash = inst.campuses.find((campus) => campus.id !== draft.id && (campus.status ?? 'active') === 'active' && campus.name.trim().toLowerCase() === name.toLowerCase());
  if (clash) return fail(`A campus called "${clash.name}" already exists.`);
  const code = draft.code?.trim() || undefined;
  if (code && inst.campuses.some((campus) => campus.id !== draft.id && campus.code?.toLowerCase() === code.toLowerCase())) return fail(`The code ${code} is used by another campus.`);

  const fields = { name, city: draft.city.trim(), address: draft.address?.trim() || undefined, code, kind: draft.kind };
  let campuses: Campus[];
  let summary: string;
  if (draft.id) {
    if (!inst.campuses.some((campus) => campus.id === draft.id)) return fail('This campus does not exist.');
    campuses = inst.campuses.map((campus) => (campus.id === draft.id ? { ...campus, ...fields } : campus));
    summary = `Updated the campus "${name}" of ${inst.shortName}.`;
  } else {
    const id = nextId(`camp-${instId.replace(/^inst-/, '')}`, inst.campuses.map((campus) => campus.id));
    campuses = [...inst.campuses, { id, ...fields, status: 'active' }];
    summary = `Added the campus "${name}" to ${inst.shortName}.`;
  }
  return { ok: true, snap: record(replaceInst(snap, { ...inst, campuses }), { orgId: inst.orgId, instId, kind: 'campus', summary }, actor, now) };
}

export function setCampusStatus(snap: Snapshot, instId: string, campusId: string, status: 'active' | 'archived', actor: Actor, now: string, reason?: string): Res {
  const inst = instOf(snap, instId);
  const campus = inst?.campuses.find((item) => item.id === campusId);
  if (!inst || !campus) return fail('This campus does not exist.');
  if (status === 'archived') {
    const active = inst.campuses.filter((item) => (item.status ?? 'active') === 'active');
    if (active.length <= 1) return fail('An institution needs at least one active campus.');
    if ((reason ?? '').trim().length < 3) return fail('Write a reason.');
  }
  const campuses = inst.campuses.map((item) => (item.id === campusId ? { ...item, status } : item));
  const summary = `${status === 'archived' ? 'Archived' : 'Restored'} the campus "${campus.name}" of ${inst.shortName}.`;
  return { ok: true, snap: record(replaceInst(snap, { ...inst, campuses }), { orgId: inst.orgId, instId, kind: 'campus', summary, reason: reason?.trim() || undefined }, actor, now) };
}

// ---------- hierarchy
export function unitDescendantIds(units: OrgUnit[], unitId: string): string[] {
  const out: string[] = [];
  const walk = (id: string) =>
    units
      .filter((unit) => unit.parentId === id)
      .forEach((child) => {
        out.push(child.id);
        walk(child.id);
      });
  walk(unitId);
  return out;
}

export interface UnitDraft {
  id?: string;
  orgId: string;
  name: string;
  kind: UnitKind;
  parentId: string | null;
  instIds: string[];
}

export function saveUnit(snap: Snapshot, draft: UnitDraft, actor: Actor, now: string): Res<{ unitId: string }> {
  const org = orgOf(snap, draft.orgId);
  if (!org) return fail('This organization does not exist.');
  const name = draft.name.trim();
  if (name.length < 2) return fail('Enter a name for the unit.');
  const units = snap.world.units;
  const existing = draft.id ? units.find((unit) => unit.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('This unit does not exist.');
  if (draft.parentId) {
    const parent = units.find((unit) => unit.id === draft.parentId);
    if (!parent || parent.orgId !== draft.orgId) return fail('Choose a parent from this organization.');
    if (parent.archived) return fail('An archived unit cannot hold other units.');
    if (draft.id && (draft.parentId === draft.id || unitDescendantIds(units, draft.id).includes(draft.parentId))) return fail('A unit cannot sit inside itself or inside one of its own sub-units.');
  }
  const sibling = units.find((unit) => unit.orgId === draft.orgId && unit.id !== draft.id && !unit.archived && unit.parentId === draft.parentId && unit.name.trim().toLowerCase() === name.toLowerCase());
  if (sibling) return fail(`"${sibling.name}" already exists at this level.`);
  const valid = snap.orgs.institutions.filter((inst) => inst.orgId === draft.orgId).map((inst) => inst.id);
  if (draft.instIds.some((id) => !valid.includes(id))) return fail('An institution does not belong to this organization.');

  let unitId = draft.id ?? '';
  let nextUnits: OrgUnit[];
  let summary: string;
  if (existing) {
    nextUnits = units.map((unit) => (unit.id === existing.id ? { ...unit, name, kind: draft.kind, parentId: draft.parentId, instIds: draft.instIds } : unit));
    summary = `Updated the unit "${name}".`;
  } else {
    unitId = nextId('unit', units.map((unit) => unit.id));
    nextUnits = [...units, { id: unitId, orgId: draft.orgId, name, kind: draft.kind, parentId: draft.parentId, instIds: draft.instIds }];
    summary = `Added the unit "${name}".`;
  }
  const next = record(patchWorld(snap, { units: nextUnits }), { orgId: draft.orgId, kind: 'hierarchy', summary }, actor, now);
  return { ok: true, snap: next, unitId };
}

export function archiveUnit(snap: Snapshot, unitId: string, actor: Actor, now: string, reason: string): Res {
  const unit = snap.world.units.find((item) => item.id === unitId);
  if (!unit) return fail('This unit does not exist.');
  if (snap.world.units.some((item) => item.parentId === unitId && !item.archived)) return fail('Move or archive the sub-units first.');
  if (reason.trim().length < 3) return fail('Write a reason.');
  const units = snap.world.units.map((item) => (item.id === unitId ? { ...item, archived: true } : item));
  return { ok: true, snap: record(patchWorld(snap, { units }), { orgId: unit.orgId, kind: 'hierarchy', summary: `Archived the unit "${unit.name}".`, reason: reason.trim() }, actor, now) };
}

// ---------- relationship
export function changeRelationship(snap: Snapshot, instId: string, type: RelationshipType, actor: Actor, now: string, reason: string): Res {
  const inst = instOf(snap, instId);
  const org = inst ? orgOf(snap, inst.orgId) : undefined;
  if (!inst || !org) return fail('This institution does not exist.');
  const current: RelationshipType = inst.relationship?.type ?? 'member';
  if (current === type) return fail('The institution already has this relationship.');
  if (reason.trim().length < 3) return fail('Write a reason.');
  const problem = relationshipProblem(org, inst, type);
  if (problem) return fail(problem);
  const relationship = relationshipFor(snap, org.id, type);
  if (type !== 'member' && !relationship) return fail('The organization has no main institution to relate to.');
  const updated = { ...inst, relationship };
  let next = replaceInst(snap, updated);
  const becomesExternal = isExternal(updated);
  const wasExternal = isExternal(inst);
  if (becomesExternal && !wasExternal) next = patchWorld(next, { agreements: [...next.world.agreements, ...freshAgreements(next, instId, org.id, actor, now)] });
  if (!becomesExternal && wasExternal) next = patchWorld(next, { agreements: next.world.agreements.filter((item) => item.instId !== instId) });
  next = record(next, { orgId: org.id, instId, kind: 'relationship', summary: `${inst.shortName} changed from ${current.replace(/_/g, ' ')} to ${type.replace(/_/g, ' ')}.`, reason: reason.trim() }, actor, now);
  return { ok: true, snap: next };
}

export function endRelationship(snap: Snapshot, instId: string, actor: Actor, now: string, reason: string): Res<{ newOrgId: string }> {
  const inst = instOf(snap, instId);
  const org = inst ? orgOf(snap, inst.orgId) : undefined;
  if (!inst || !org) return fail('This institution does not exist.');
  if (org.implicit) return fail('This institution is already independent.');
  if (reason.trim().length < 3) return fail('Write a reason.');
  if (inst.profile === 'university' && !inst.relationship && org.type === 'university') return fail('This is the main institution of the organization. It cannot leave.');
  if (snap.orgs.institutions.filter((item) => item.orgId === org.id).length <= 1) return fail('An organization needs at least one institution.');

  const baseId = `org-${slugify(inst.shortName || inst.name) || 'indep'}`;
  let newOrgId = baseId;
  let counter = 2;
  while (snap.orgs.organizations.some((item) => item.id === newOrgId)) newOrgId = `${baseId}-${counter++}`;
  const newOrg: Organization = {
    id: newOrgId,
    name: inst.name,
    type: inst.profile === 'school' ? 'single_school' : 'single_college',
    country: inst.country,
    implicit: true,
  };
  let next: Snapshot = {
    ...snap,
    orgs: {
      organizations: [...snap.orgs.organizations, newOrg],
      institutions: snap.orgs.institutions.map((item) => (item.id === instId ? { ...item, orgId: newOrgId, relationship: undefined } : item)),
    },
  };
  next = patchWorld(next, {
    units: next.world.units.map((unit) => ({ ...unit, instIds: unit.instIds.filter((id) => id !== instId) })),
    agreements: next.world.agreements.filter((item) => item.instId !== instId),
  });
  next = record(next, { orgId: org.id, instId, kind: 'relationship', summary: `${inst.shortName} left ${org.name} and is now independent.`, reason: reason.trim() }, actor, now);
  return { ok: true, snap: next, newOrgId };
}

// ---------- linking
export interface NewLinkInput {
  parentOrgId: string;
  childInstId: string;
  relationship: RelationshipType;
  direction: 'invite' | 'apply';
  note?: string;
}

function event(link: Pick<LinkRequest, 'id' | 'events'>, actor: Actor, now: string, action: string, note?: string): LinkEvent {
  return { id: `${link.id}-e${link.events.length + 1}`, at: now, byName: actor.name, action, note: note?.trim() || undefined };
}

function replaceLink(snap: Snapshot, next: LinkRequest): Snapshot {
  return patchWorld(snap, { links: snap.world.links.map((link) => (link.id === next.id ? next : link)) });
}

export function createLink(snap: Snapshot, input: NewLinkInput, actor: Actor, now: string): Res<{ linkId: string }> {
  const org = orgOf(snap, input.parentOrgId);
  const child = instOf(snap, input.childInstId);
  if (!org || org.implicit) return fail('Choose an organization that can take institutions.');
  if (!child) return fail('Choose the institution to link.');
  if (!isIndependent(snap.orgs.organizations, snap.orgs.institutions, child)) return fail(`${child.shortName} already belongs to an organization. End that relationship first.`);
  if (child.status !== 'active') return fail(`${child.shortName} is ${child.status}. Only active institutions can be linked.`);
  const problem = relationshipProblem(org, child, input.relationship);
  if (problem) return fail(problem);
  const open = snap.world.links.find((link) => link.childInstId === child.id && OPEN_LINK_STATUSES.includes(link.status));
  if (open) return fail(`${child.shortName} already has an open request (${open.id}).`);

  const id = nextId('link', snap.world.links.map((link) => link.id));
  const base = { id, events: [] as LinkEvent[] };
  const first = event(base, actor, now, input.direction === 'invite' ? `Invited ${child.shortName} to join as ${input.relationship.replace(/_/g, ' ')}` : `Applied to join ${org.name} as ${input.relationship.replace(/_/g, ' ')}`, input.note);
  const link: LinkRequest = {
    id,
    parentOrgId: org.id,
    childInstId: child.id,
    relationship: input.relationship,
    direction: input.direction,
    status: input.direction === 'invite' ? 'awaiting_consent' : 'in_verification',
    note: input.note?.trim() || undefined,
    checklist: checklistFor(input.relationship).map((item, index) => ({ id: `chk-${index + 1}`, label: item.label, done: false })),
    events: [first],
    createdAt: now,
    createdByName: actor.name,
  };
  const next = record(patchWorld(snap, { links: [link, ...snap.world.links] }), { orgId: org.id, instId: child.id, kind: 'link', summary: first.action + '.' }, actor, now);
  return { ok: true, snap: next, linkId: id };
}

function findOpen(snap: Snapshot, id: string, allowed: LinkRequest['status'][]): LinkRequest | string {
  const link = snap.world.links.find((item) => item.id === id);
  if (!link) return 'This request does not exist.';
  if (!allowed.includes(link.status)) return 'This request has already moved on.';
  return link;
}

export function consentLink(snap: Snapshot, id: string, accept: boolean, actor: Actor, now: string, note?: string): Res {
  const link = findOpen(snap, id, ['awaiting_consent']);
  if (typeof link === 'string') return fail(link);
  if (!accept && (note ?? '').trim().length < 3) return fail('Write a reason for declining.');
  const child = instOf(snap, link.childInstId);
  const next: LinkRequest = {
    ...link,
    status: accept ? 'in_verification' : 'rejected',
    events: [...link.events, event(link, actor, now, accept ? 'Accepted the invitation' : 'Declined the invitation', note)],
  };
  return { ok: true, snap: record(replaceLink(snap, next), { orgId: link.parentOrgId, instId: link.childInstId, kind: 'link', summary: `${child?.shortName ?? 'The institution'} ${accept ? 'accepted' : 'declined'} the invitation.`, reason: note?.trim() || undefined }, actor, now) };
}

export function setChecklist(snap: Snapshot, id: string, itemId: string, done: boolean, actor: Actor, now: string): Res {
  const link = findOpen(snap, id, ['in_verification', 'awaiting_approval']);
  if (typeof link === 'string') return fail(link);
  const item = link.checklist.find((entry) => entry.id === itemId);
  if (!item) return fail('This check does not exist.');
  const checklist = link.checklist.map((entry) => (entry.id === itemId ? { ...entry, done, doneBy: done ? actor.name : undefined, doneAt: done ? now : undefined } : entry));
  const allDone = checklist.every((entry) => entry.done);
  const next: LinkRequest = {
    ...link,
    checklist,
    status: allDone ? 'awaiting_approval' : 'in_verification',
    events: [...link.events, event(link, actor, now, `${done ? 'Verified' : 'Unmarked'}: ${item.label}`)],
  };
  return { ok: true, snap: replaceLink(snap, next) };
}

export function rejectLink(snap: Snapshot, id: string, actor: Actor, now: string, reason: string): Res {
  const link = findOpen(snap, id, OPEN_LINK_STATUSES);
  if (typeof link === 'string') return fail(link);
  if (reason.trim().length < 3) return fail('Write a reason.');
  const child = instOf(snap, link.childInstId);
  const next: LinkRequest = { ...link, status: 'rejected', events: [...link.events, event(link, actor, now, 'Rejected the request', reason)] };
  return { ok: true, snap: record(replaceLink(snap, next), { orgId: link.parentOrgId, instId: link.childInstId, kind: 'link', summary: `Rejected the link of ${child?.shortName ?? 'an institution'}.`, reason: reason.trim() }, actor, now) };
}

export function withdrawLink(snap: Snapshot, id: string, actor: Actor, now: string, reason: string): Res {
  const link = findOpen(snap, id, OPEN_LINK_STATUSES);
  if (typeof link === 'string') return fail(link);
  if (reason.trim().length < 3) return fail('Write a reason.');
  const child = instOf(snap, link.childInstId);
  const next: LinkRequest = { ...link, status: 'withdrawn', events: [...link.events, event(link, actor, now, 'Withdrew the request', reason)] };
  return { ok: true, snap: record(replaceLink(snap, next), { orgId: link.parentOrgId, instId: link.childInstId, kind: 'link', summary: `Withdrew the link request of ${child?.shortName ?? 'an institution'}.`, reason: reason.trim() }, actor, now) };
}

/** Final step. The institution moves into the organization, its old hidden organization is removed, and data sharing starts from the default. */
export function approveLink(snap: Snapshot, id: string, actor: Actor, now: string): Res {
  const link = findOpen(snap, id, ['awaiting_approval']);
  if (typeof link === 'string') return fail(link);
  if (!link.checklist.every((entry) => entry.done)) return fail('Every document must be verified first.');
  const org = orgOf(snap, link.parentOrgId);
  const child = instOf(snap, link.childInstId);
  if (!org || !child) return fail('The organization or institution no longer exists.');
  if (!isIndependent(snap.orgs.organizations, snap.orgs.institutions, child)) return fail(`${child.shortName} now belongs to another organization.`);
  const problem = relationshipProblem(org, child, link.relationship);
  if (problem) return fail(problem);

  const oldOrgId = child.orgId;
  const relationship = relationshipFor(snap, org.id, link.relationship);
  if (link.relationship !== 'member' && !relationship) return fail('The organization has no main institution to relate to.');
  const moved: Institution = { ...child, orgId: org.id, relationship };
  let next: Snapshot = {
    ...snap,
    orgs: {
      organizations: snap.orgs.organizations.filter((item) => item.id !== oldOrgId),
      institutions: snap.orgs.institutions.map((item) => (item.id === child.id ? moved : item)),
    },
  };
  if (isExternal(moved)) next = patchWorld(next, { agreements: [...next.world.agreements.filter((item) => item.instId !== child.id), ...freshAgreements(next, child.id, org.id, actor, now)] });
  const approved: LinkRequest = { ...link, status: 'approved', previousOrgId: oldOrgId, events: [...link.events, event(link, actor, now, 'Approved. The institution is now linked')] };
  next = replaceLink(next, approved);
  next = record(next, { orgId: org.id, instId: child.id, kind: 'link', summary: `${child.shortName} joined ${org.name} as ${link.relationship.replace(/_/g, ' ')}.` }, actor, now);
  return { ok: true, snap: next };
}

// ---------- data sharing
export function setAgreementLevel(snap: Snapshot, instId: string, domain: string, level: ShareLevel, actor: Actor, now: string): Res {
  const inst = instOf(snap, instId);
  if (!inst) return fail('This institution does not exist.');
  if (!isExternal(inst)) return fail('This institution is run by the organization. Sharing is by structure, not by agreement.');
  const def = SHARE_DOMAINS.find((item) => item.key === domain);
  if (!def) return fail('Unknown data area.');
  const current = snap.world.agreements.find((item) => item.instId === instId && item.domain === domain);
  if ((current?.level ?? 'none') === level) return fail('This level is already set.');
  const satisfied = current?.requested !== undefined && SHARE_LEVEL_RANK[level] >= SHARE_LEVEL_RANK[current.requested];
  const row: Agreement = {
    instId,
    domain,
    level,
    requested: satisfied ? undefined : current?.requested,
    requestedByName: satisfied ? undefined : current?.requestedByName,
    requestedAt: satisfied ? undefined : current?.requestedAt,
    updatedAt: now,
    updatedByName: actor.name,
  };
  const agreements = current ? snap.world.agreements.map((item) => (item === current ? row : item)) : [...snap.world.agreements, row];
  return { ok: true, snap: record(patchWorld(snap, { agreements }), { orgId: inst.orgId, instId, kind: 'agreement', summary: `${inst.shortName} now shares "${def.label}": ${level === 'none' ? 'nothing' : level}.` }, actor, now) };
}

export function requestAgreement(snap: Snapshot, instId: string, requests: Array<{ domain: string; level: ShareLevel }>, actor: Actor, now: string): Res<{ count: number }> {
  const inst = instOf(snap, instId);
  if (!inst) return fail('This institution does not exist.');
  if (!isExternal(inst)) return fail('This institution is run by the organization. It does not need to be asked.');
  let agreements = snap.world.agreements;
  let count = 0;
  const names: string[] = [];
  requests.forEach((request) => {
    const def = SHARE_DOMAINS.find((item) => item.key === request.domain);
    if (!def) return;
    const current = agreements.find((item) => item.instId === instId && item.domain === request.domain);
    if (SHARE_LEVEL_RANK[request.level] <= SHARE_LEVEL_RANK[current?.level ?? 'none']) return;
    const row: Agreement = {
      instId,
      domain: request.domain,
      level: current?.level ?? 'none',
      requested: request.level,
      requestedByName: actor.name,
      requestedAt: now,
      updatedAt: current?.updatedAt ?? now,
      updatedByName: current?.updatedByName ?? actor.name,
    };
    agreements = current ? agreements.map((item) => (item === current ? row : item)) : [...agreements, row];
    names.push(def.label.toLowerCase());
    count += 1;
  });
  if (count === 0) return fail('Choose at least one area where you ask for more than is shared now.');
  return { ok: true, snap: record(patchWorld(snap, { agreements }), { orgId: inst.orgId, instId, kind: 'agreement', summary: `Asked ${inst.shortName} for more access: ${names.join(', ')}.` }, actor, now), count };
}

export function answerAgreementRequest(snap: Snapshot, instId: string, domain: string, accept: boolean, actor: Actor, now: string): Res {
  const inst = instOf(snap, instId);
  const current = snap.world.agreements.find((item) => item.instId === instId && item.domain === domain);
  const def = SHARE_DOMAINS.find((item) => item.key === domain);
  if (!inst || !current || !current.requested || !def) return fail('There is no request to answer.');
  const row: Agreement = {
    ...current,
    level: accept ? current.requested : current.level,
    requested: undefined,
    requestedByName: undefined,
    requestedAt: undefined,
    updatedAt: now,
    updatedByName: actor.name,
  };
  const agreements = snap.world.agreements.map((item) => (item === current ? row : item));
  return { ok: true, snap: record(patchWorld(snap, { agreements }), { orgId: inst.orgId, instId, kind: 'agreement', summary: `${inst.shortName} ${accept ? 'accepted' : 'declined'} the request for "${def.label}".` }, actor, now) };
}

// ---------- sessions
export function saveSession(snap: Snapshot, instId: string, draft: SessionDraft & { id?: string }, actor: Actor, now: string): Res<{ sessionId: string }> {
  const inst = instOf(snap, instId);
  if (!inst) return fail('This institution does not exist.');
  const existing = draft.id ? snap.world.sessions.find((item) => item.instId === instId && item.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('This session does not exist.');
  if (existing?.status === 'closed') return fail('A closed session cannot be changed.');
  const others = snap.world.sessions.filter((item) => item.instId === instId && item.id !== draft.id);
  const monthPolicy = policyFor(snap.world, inst.orgId, 'session.start_month');
  const errors = validateSession(draft, others, monthPolicy ? Number(monthPolicy.value) : undefined);
  const first = Object.values(errors)[0];
  if (first) return fail(first);
  const id = existing ? existing.id : sessionIdFor(draft.start, draft.end);
  if (!existing && others.some((item) => item.id === id)) return fail('A session for these years already exists.');
  const session: AcademicSession = { id, instId, label: draft.label.trim(), start: draft.start, end: draft.end, system: draft.system, terms: draft.terms, status: existing?.status ?? 'planned' };
  const sessions = existing ? snap.world.sessions.map((item) => (item === existing ? session : item)) : [...snap.world.sessions, session];
  return { ok: true, snap: record(patchWorld(snap, { sessions }), { orgId: inst.orgId, instId, kind: 'session', summary: `${existing ? 'Updated' : 'Planned'} the session ${session.label} of ${inst.shortName}.` }, actor, now), sessionId: id };
}

export function setSessionState(snap: Snapshot, instId: string, sessionId: string, action: 'make_current' | 'close', actor: Actor, now: string): Res {
  const inst = instOf(snap, instId);
  const session = snap.world.sessions.find((item) => item.instId === instId && item.id === sessionId);
  if (!inst || !session) return fail('This session does not exist.');
  if (action === 'make_current') {
    if (session.status !== 'planned') return fail('Only a planned session can become the current one.');
    const sessions = snap.world.sessions.map((item) => {
      if (item.instId !== instId) return item;
      if (item.id === sessionId) return { ...item, status: 'current' as const };
      return item.status === 'current' ? { ...item, status: 'closed' as const } : item;
    });
    return { ok: true, snap: record(patchWorld(snap, { sessions }), { orgId: inst.orgId, instId, kind: 'session', summary: `${session.label} is now the current session of ${inst.shortName}. The previous one is closed.` }, actor, now) };
  }
  if (session.status !== 'current') return fail('Only the current session can be closed.');
  const sessions = snap.world.sessions.map((item) => (item.instId === instId && item.id === sessionId ? { ...item, status: 'closed' as const } : item));
  return { ok: true, snap: record(patchWorld(snap, { sessions }), { orgId: inst.orgId, instId, kind: 'session', summary: `Closed the session ${session.label} of ${inst.shortName}.` }, actor, now) };
}

export function removeSession(snap: Snapshot, instId: string, sessionId: string, actor: Actor, now: string): Res {
  const inst = instOf(snap, instId);
  const session = snap.world.sessions.find((item) => item.instId === instId && item.id === sessionId);
  if (!inst || !session) return fail('This session does not exist.');
  if (session.status !== 'planned') return fail('Only a planned session can be removed. Current and closed sessions hold records.');
  const sessions = snap.world.sessions.filter((item) => item !== session);
  return { ok: true, snap: record(patchWorld(snap, { sessions }), { orgId: inst.orgId, instId, kind: 'session', summary: `Removed the planned session ${session.label} of ${inst.shortName}.` }, actor, now) };
}

// ---------- curriculum
export function saveCurriculum(snap: Snapshot, config: CurriculumConfig, actor: Actor, now: string): Res {
  const inst = instOf(snap, config.instId);
  if (!inst) return fail('This institution does not exist.');
  if (!config.board.trim()) return fail('Choose the board or regulator.');
  if (!GRADING_SCHEMES.some((scheme) => scheme.value === config.gradingScheme)) return fail('Choose a grading scheme.');
  const policy = policyFor(snap.world, inst.orgId, 'grading.common');
  if (policy && policy.value !== config.gradingScheme) return fail('The organization requires one common grading scheme. It cannot be changed here.');
  if (inst.profile === 'school' && config.stages.length === 0) return fail('Choose at least one stage the school teaches.');
  const names = new Set<string>();
  for (const programme of config.programmes.filter((item) => item.status === 'active')) {
    if (programme.name.trim().length < 2) return fail('Every programme needs a name.');
    if (programme.years < 1 || programme.years > 8) return fail(`"${programme.name}" must last between 1 and 8 years.`);
    const key = programme.name.trim().toLowerCase();
    if (names.has(key)) return fail(`"${programme.name}" is listed twice.`);
    names.add(key);
  }
  const exists = snap.world.curricula.some((item) => item.instId === config.instId);
  const curricula = exists ? snap.world.curricula.map((item) => (item.instId === config.instId ? config : item)) : [...snap.world.curricula, config];
  return { ok: true, snap: record(patchWorld(snap, { curricula }), { orgId: inst.orgId, instId: inst.id, kind: 'curriculum', summary: `Saved the curriculum settings of ${inst.shortName}.` }, actor, now) };
}

// ---------- policies
export function policyValueProblem(key: string, setting: PolicySetting): string | null {
  const def = POLICY_CATALOG.find((item) => item.key === key);
  if (!def) return 'Unknown policy.';
  if (!setting.enforced) return null;
  if (def.input === 'text' && setting.value.trim().length < 2) return 'Enter the text institutions must start with.';
  if (def.input === 'grading' && !GRADING_SCHEMES.some((scheme) => scheme.value === setting.value)) return 'Choose a grading scheme.';
  if (def.input === 'month' && !(Number(setting.value) >= 1 && Number(setting.value) <= 12)) return 'Choose a month.';
  if (def.input === 'sharing' && setting.value !== 'none' && setting.value !== 'summary') return 'Choose the starting level.';
  return null;
}

/** Institutions that do not meet a rule today. They are not changed. They meet the rule when they next edit. */
export function policyConflicts(snap: Snapshot, orgId: string, key: string, setting: PolicySetting): Institution[] {
  if (!setting.enforced) return [];
  const members = snap.orgs.institutions.filter((inst) => inst.orgId === orgId);
  if (key === 'naming.prefix') return members.filter((inst) => namePolicyProblem({ policies: { [orgId]: { [key]: setting } } }, orgId, inst.name) !== null);
  if (key === 'grading.common') return members.filter((inst) => snap.world.curricula.find((item) => item.instId === inst.id)?.gradingScheme !== setting.value);
  if (key === 'session.start_month')
    return members.filter((inst) => snap.world.sessions.some((item) => item.instId === inst.id && item.status !== 'closed' && Number(item.start.slice(5, 7)) !== Number(setting.value)));
  return [];
}

export function savePolicy(snap: Snapshot, orgId: string, key: string, setting: PolicySetting, actor: Actor, now: string): Res {
  const org = orgOf(snap, orgId);
  const def = POLICY_CATALOG.find((item) => item.key === key);
  if (!org || !def) return fail('Unknown policy.');
  const problem = policyValueProblem(key, setting);
  if (problem) return fail(problem);
  const before = snap.world.policies[orgId]?.[key];
  if (before && before.enforced === setting.enforced && before.value === setting.value) return fail('Nothing was changed.');
  const policies = { ...snap.world.policies, [orgId]: { ...(snap.world.policies[orgId] ?? {}), [key]: setting } };
  const summary = setting.enforced ? `Enforced "${def.label}"${def.input === 'none' ? '' : ` (${setting.value})`}.` : `Stopped enforcing "${def.label}".`;
  return { ok: true, snap: record(patchWorld(snap, { policies }), { orgId, kind: 'policy', summary }, actor, now) };
}

// ---------- billing
export function requestUpgrade(snap: Snapshot, orgId: string, plan: string, reason: string, actor: Actor, now: string): Res {
  const billing = snap.world.billing[orgId];
  if (!billing) return fail('There is no subscription for this organization.');
  if (!(PLAN_NAMES as readonly string[]).includes(plan)) return fail('Choose a plan.');
  if (plan === billing.plan) return fail('This is already the current plan.');
  if (reason.trim().length < 3) return fail('Write why you need it.');
  if (billing.upgradeRequests.some((item) => item.toPlan === plan)) return fail(`A request for ${plan} is already sent.`);
  const request = { id: nextId('upg', billing.upgradeRequests.map((item) => item.id)), at: now, byName: actor.name, toPlan: plan, reason: reason.trim() };
  const next = patchWorld(snap, { billing: { ...snap.world.billing, [orgId]: { ...billing, upgradeRequests: [request, ...billing.upgradeRequests] } } });
  return { ok: true, snap: record(next, { orgId, kind: 'billing', summary: `Asked to move from ${billing.plan} to ${plan}.`, reason: reason.trim() }, actor, now) };
}
