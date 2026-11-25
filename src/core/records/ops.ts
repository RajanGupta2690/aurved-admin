import { evaluate } from '../access/engine';
import type { Actor, Snapshot } from '../org/model';
import { record } from '../org/ops';
import type { Res } from '../org/ops';
import { isExternal, nextId, normalizeName } from '../org/rules';
import { isExited } from '../staff/model';
import type { CollectionDef, FieldDef, RecordRow, RuleContext } from './types';
import { currentRegion } from '../i18n/format';

/** Saving, changing status of, and archiving records of any collection. Pure, like the other ops. */
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export const featureKeyOf = (def: Pick<CollectionDef, 'module' | 'key'>) => `${def.module}.${def.key}`;

export function rowsOf(snap: Pick<Snapshot, 'records'>, def: Pick<CollectionDef, 'key'>, scopeId: string, includeArchived = false): RecordRow[] {
  return (snap.records[def.key] ?? []).filter((row) => row.scopeId === scopeId && (includeArchived || !row.archived));
}

const isDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
const isBlank = (value: unknown) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

function hidden(field: FieldDef, data: Record<string, unknown>): boolean {
  return Boolean(field.showWhen && String(data[field.showWhen.key] ?? 'false') !== field.showWhen.equals);
}

/** Context for the rules: the other records, current staff, and related collections of the same scope. */
export function ruleContext(snap: Snapshot, def: CollectionDef, scopeId: string, now: string, ignoreId?: string, status?: string): RuleContext {
  const related: Record<string, RecordRow[]> = {};
  Object.keys(snap.records).forEach((key) => {
    related[key] = (snap.records[key] ?? []).filter((row) => row.scopeId === scopeId && !row.archived);
  });
  return {
    scopeId,
    others: rowsOf(snap, def, scopeId).filter((row) => row.id !== ignoreId),
    staff: snap.staff.members.filter((member) => member.instId === scopeId && !isExited(member.employment.status)),
    institutions: snap.orgs.institutions.filter((inst) => inst.id === scopeId || inst.orgId === scopeId),
    today: now.slice(0, 10),
    related,
    isNew: !ignoreId,
    status,
  };
}

/** Field by field messages, and a message for the whole record when a rule fails. */
export function validateData(def: CollectionDef, data: Record<string, unknown>, ctx: RuleContext): { errors: Record<string, string>; form?: string } {
  const errors: Record<string, string> = {};
  for (const field of def.fields) {
    if (field.computed || hidden(field, data)) continue;
    const value = data[field.key];
    if (isBlank(value)) {
      if (field.required) errors[field.key] = `${field.label} is required.`;
      continue;
    }
    const text = String(value).trim();
    switch (field.type) {
      case 'number': {
        const n = Number(value);
        if (Number.isNaN(n)) errors[field.key] = `${field.label} must be a number.`;
        else if (field.min !== undefined && n < field.min) errors[field.key] = `${field.label} must be ${field.min} or more.`;
        else if (field.max !== undefined && n > field.max) errors[field.key] = `${field.label} must be ${field.max} or less.`;
        break;
      }
      case 'date':
        if (!isDate(text)) errors[field.key] = `${field.label} must be a date.`;
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) errors[field.key] = 'Enter a valid email address.';
        break;
      case 'phone':
        if (!/^\+?\d{7,15}$/.test(text.replace(/[\s().-]/g, ''))) errors[field.key] = 'Enter 7 to 15 digits.';
        break;
      case 'select':
        if (!field.options?.some((option) => option.value === text)) errors[field.key] = `Choose one of the options for ${field.label}.`;
        break;
      case 'staff':
        if (!ctx.staff.some((member) => member.id === text)) errors[field.key] = `${field.label} must be a current staff member of this institution.`;
        break;
      case 'institution':
        if (!ctx.institutions.some((inst) => inst.id === text)) errors[field.key] = `${field.label} must be an institution of this organization.`;
        break;
      case 'text':
      case 'longtext':
        if (text.length > (field.type === 'text' ? 200 : 4000)) errors[field.key] = `${field.label} is too long.`;
        break;
      default:
        break;
    }
    if (!errors[field.key] && field.unique && ctx.others.some((row) => normalizeName(String(row.data[field.key] ?? '')) === normalizeName(text))) errors[field.key] = `${field.label} "${text}" is already used.`;
  }
  if (Object.keys(errors).length > 0) return { errors };
  for (const rule of def.uniqueTogether ?? []) {
    const clash = ctx.others.find((row) => rule.keys.every((key) => String(row.data[key] ?? '') === String(data[key] ?? '')));
    if (clash) return { errors, form: rule.message };
  }
  const message = def.rules?.(data, ctx) ?? null;
  return message ? { errors, form: message } : { errors };
}

function clean(def: CollectionDef, data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  def.fields.forEach((field) => {
    if (hidden(field, data)) return;
    const value = data[field.key];
    if (isBlank(value)) return;
    if (field.type === 'number') out[field.key] = Number(value);
    else if (field.type === 'boolean') out[field.key] = value === true || value === 'true';
    else out[field.key] = typeof value === 'string' ? value.trim() : value;
  });
  return out;
}

export function mayDo(snap: Snapshot, actorId: string, def: CollectionDef, action: string, scopeId: string): boolean {
  const person = snap.access.personas.find((item) => item.id === actorId);
  if (!person) return false;
  const inst = snap.orgs.institutions.find((item) => item.id === scopeId);
  const place = inst ? { orgId: inst.orgId, instId: inst.id, external: isExternal(inst) } : { orgId: scopeId };
  return evaluate(person, snap.access.roles, `${featureKeyOf(def)}.${action}`, place).allowed;
}

const labelOf = (def: CollectionDef, data: Record<string, unknown>) => String(data[def.titleField] ?? def.singular);

function put(snap: Snapshot, def: CollectionDef, row: RecordRow): Snapshot {
  const list = snap.records[def.key] ?? [];
  const exists = list.some((item) => item.id === row.id);
  return { ...snap, records: { ...snap.records, [def.key]: exists ? list.map((item) => (item.id === row.id ? row : item)) : [...list, row] } };
}

export function saveRecord(snap: Snapshot, def: CollectionDef, input: { id?: string; scopeId: string; data: Record<string, unknown> }, actor: Actor, now: string): Res<{ recordId: string }> {
  const existing = input.id ? (snap.records[def.key] ?? []).find((row) => row.id === input.id) : undefined;
  if (input.id && !existing) return fail('This record does not exist.');
  if (existing && existing.scopeId !== input.scopeId) return fail('This record belongs to another place.');
  if (existing?.archived) return fail('An archived record cannot be changed. Restore it first.');
  const statusDef = def.statuses?.find((item) => item.value === existing?.status);
  if (existing && statusDef?.final) return fail(`A record that is "${statusDef.label}" cannot be changed.`);
  if (!mayDo(snap, actor.id, def, existing ? 'edit' : 'create', input.scopeId)) return fail('Your role cannot do this.');
  const data = { ...clean(def, input.data) };
  // Fixed fields keep the value they were created with.
  if (existing) def.fields.filter((field) => field.fixed).forEach((field) => { if (existing.data[field.key] !== undefined) data[field.key] = existing.data[field.key]; });
  const ctx = ruleContext(snap, def, input.scopeId, now, existing?.id, existing?.status);
  const result = validateData(def, data, ctx);
  if (Object.keys(result.errors).length > 0) return fail(Object.values(result.errors)[0]);
  if (result.form) return fail(result.form);
  const derived = { ...data, ...(def.derive?.(data, ctx) ?? {}) };
  const id = existing?.id ?? nextId(`rec-${def.key}`, (snap.records[def.key] ?? []).map((row) => row.id));
  const row: RecordRow = existing
    ? { ...existing, data: derived, updatedAt: now, history: [...existing.history, { at: now, by: actor.name, summary: 'Changed the details.' }] }
    : { id, collection: def.key, scopeId: input.scopeId, data: derived, status: def.initialStatus, createdAt: now, createdBy: actor.name, updatedAt: now, history: [{ at: now, by: actor.name, summary: `Created the ${def.singular.toLowerCase()}.` }] };
  const saved = put(snap, def, row);
  return { ok: true, snap: !existing && def.after ? def.after(saved, row) : saved, recordId: id };
}

export function setStatus(snap: Snapshot, def: CollectionDef, recordId: string, status: string, actor: Actor, now: string, reason?: string): Res {
  const row = (snap.records[def.key] ?? []).find((item) => item.id === recordId);
  if (!row) return fail('This record does not exist.');
  if (!def.statuses) return fail('This kind of record has no status.');
  const target = def.statuses.find((item) => item.value === status);
  const current = def.statuses.find((item) => item.value === row.status);
  if (!target || !current) return fail('Unknown status.');
  if (row.archived) return fail('An archived record cannot change status.');
  if (current.final) return fail(`A record that is "${current.label}" is closed.`);
  if (!(def.transitions?.[row.status ?? ''] ?? []).includes(status)) return fail(`A "${current.label}" record cannot become "${target.label}".`);
  if (!mayDo(snap, actor.id, def, target.needs ?? 'edit', row.scopeId)) return fail(`Your role cannot move a record to "${target.label}".`);
  if (target.reason && (reason ?? '').trim().length < 3) return fail('Write a reason.');
  const ctx = ruleContext(snap, def, row.scopeId, now, row.id, status);
  const problem = def.rules?.({ ...row.data, __status: status }, ctx) ?? null;
  if (problem) return fail(problem);
  const next: RecordRow = { ...row, status, updatedAt: now, history: [...row.history, { at: now, by: actor.name, summary: `Status: ${current.label} to ${target.label}.`, reason: reason?.trim() || undefined }] };
  return { ok: true, snap: put(snap, def, next) };
}

export function setArchived(snap: Snapshot, def: CollectionDef, recordId: string, archived: boolean, actor: Actor, now: string, reason?: string): Res {
  const row = (snap.records[def.key] ?? []).find((item) => item.id === recordId);
  if (!row) return fail('This record does not exist.');
  if (!mayDo(snap, actor.id, def, 'archive', row.scopeId)) return fail('Your role cannot do this.');
  if (archived && (reason ?? '').trim().length < 3) return fail('Write a reason.');
  const next: RecordRow = { ...row, archived, updatedAt: now, history: [...row.history, { at: now, by: actor.name, summary: archived ? 'Archived.' : 'Restored.', reason: reason?.trim() || undefined }] };
  const inst = snap.orgs.institutions.find((item) => item.id === row.scopeId);
  const base = put(snap, def, next);
  return { ok: true, snap: inst ? record(base, { orgId: inst.orgId, instId: inst.id, kind: 'record', summary: `${archived ? 'Archived' : 'Restored'} a ${def.singular.toLowerCase()}: ${labelOf(def, row.data)}.`, reason }, actor, now) : base };
}

// ---------- reading
export function isOverdue(def: CollectionDef, row: RecordRow, today: string): boolean {
  if (!def.dueField || row.archived) return false;
  const due = row.data[def.dueField];
  const status = def.statuses?.find((item) => item.value === row.status);
  return typeof due === 'string' && due < today && !status?.final;
}

export function countByStatus(def: CollectionDef, rows: RecordRow[]): Array<{ value: string; label: string; count: number }> {
  return (def.statuses ?? []).map((status) => ({ value: status.value, label: status.label, count: rows.filter((row) => row.status === status.value).length }));
}

export function displayValue(def: CollectionDef, field: FieldDef, data: Record<string, unknown>, staffName: (id: string) => string, instName: (id: string) => string): string {
  const value = data[field.key];
  if (value === undefined || value === null || value === '') return '';
  if (field.type === 'select') return field.options?.find((option) => option.value === value)?.label ?? String(value);
  if (field.type === 'staff') return staffName(String(value));
  if (field.type === 'institution') return instName(String(value));
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'number' && field.money) return Number(value).toLocaleString(currentRegion().locale);
  return String(value);
}
