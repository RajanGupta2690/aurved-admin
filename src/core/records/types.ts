import type { Action } from '../access/match';
import type { Actor, Snapshot } from '../org/model';
import type { StaffMember } from '../staff/model';
import type { Institution, ProfileKind } from '../org/types';

/**
 * Records engine. A collection is a list of records with fields, rules, and optionally a status workflow.
 * One definition gives the screen, the saved data, the validation, the permissions and the history.
 * Every collection is a feature, so the plan, the organization policy and the switches apply to it.
 */
export type FieldType = 'text' | 'longtext' | 'number' | 'date' | 'select' | 'email' | 'phone' | 'boolean' | 'staff' | 'institution';

export interface Option {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Option[];
  min?: number;
  max?: number;
  hint?: string;
  /** Shown as a column in the table. */
  list?: boolean;
  /** Value must be different in every record of the same institution. Compared without case. */
  unique?: boolean;
  /** Filled by the system, shown, never typed. */
  computed?: boolean;
  /** Cannot change after the record is created. */
  fixed?: boolean;
  /** Shown only when another field has a value. */
  showWhen?: { key: string; equals: string };
  /** Money: shown with thousands separators. */
  money?: boolean;
  default?: string | number | boolean;
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

export interface StatusDef {
  value: string;
  label: string;
  tone: StatusTone;
  /** Nothing can be edited once a record is here. */
  final?: boolean;
  /** Going into this status needs this permission on top of edit, for example approve. */
  needs?: Action;
  /** A reason must be written to go into this status. */
  reason?: boolean;
}

export interface RuleContext {
  scopeId: string;
  /** The other records of the same collection and scope, not counting the one being saved. */
  others: RecordRow[];
  /** Current staff of the institution. Empty at organization level. */
  staff: StaffMember[];
  /** Institutions of the organization, for fields of type institution. */
  institutions: Institution[];
  today: string;
  /** Records of other collections, by collection key, in the same scope. */
  related: Record<string, RecordRow[]>;
  isNew: boolean;
  status?: string;
}

export interface CollectionDef {
  key: string;
  /** Screen id in docs/product/03-screen-register.md. */
  screenId: string;
  module: string;
  title: string;
  singular: string;
  description: string;
  fields: FieldDef[];
  /** Field shown as the name of a record. */
  titleField: string;
  statuses?: StatusDef[];
  initialStatus?: string;
  /** Which statuses may follow which. */
  transitions?: Record<string, string[]>;
  /** Field with a date. A record past it and not final is shown as overdue. */
  dueField?: string;
  /** Extra permission actions beyond view, create, edit, archive and export. */
  actions?: Action[];
  /** A sentence that says why the data is sensitive. Shown on the page. */
  sensitive?: string;
  /** Business rules. Return a sentence, or null when fine. */
  rules?: (data: Record<string, unknown>, ctx: RuleContext) => string | null;
  /** Values the system works out from the others. Runs after the rules pass, on every save. */
  derive?: (data: Record<string, unknown>, ctx: RuleContext) => Record<string, unknown>;
  /** Features (module.collection) that must be available for this one to work. */
  dependsOn?: string[];
  /** After a new record is saved: update other records that depend on it. */
  after?: (snap: Snapshot, row: RecordRow) => Snapshot;
  /** After a record moves to another status: update other records that depend on it. */
  afterStatus?: (snap: Snapshot, row: RecordRow, actor: Actor, now: string) => Snapshot;
  /** Composite uniqueness, such as staff and month. */
  uniqueTogether?: Array<{ keys: string[]; message: string }>;
  /** Demo records. scopeId is an institution or organization id. */
  seeds?: Array<{ scopeId: string; status?: string; data: Record<string, unknown> }>;
}

export interface ModuleGroup {
  key: string;
  label: string;
  description: string;
  profiles: ProfileKind[] | 'all';
  scope: 'inst' | 'org';
  /** Navigation group of the sidebar. */
  nav: string;
  collections: CollectionDef[];
  /** Only for organizations of these types, when scope is org. */
  orgTypes?: string[];
}

export interface RecordEvent {
  at: string;
  by: string;
  summary: string;
  reason?: string;
}

export interface RecordRow {
  id: string;
  collection: string;
  scopeId: string;
  data: Record<string, unknown>;
  status?: string;
  archived?: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  history: RecordEvent[];
}

export type RecordsState = Record<string, RecordRow[]>;
