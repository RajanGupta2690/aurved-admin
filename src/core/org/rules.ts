import { currentRegion } from '../i18n/format';
import { SHARE_DOMAINS } from './model';
import type { Agreement, ChecklistItem, PolicySetting, ShareLevel, World } from './model';
import type { Institution, OrgType, Organization, RelationshipType } from './types';

/** Relationships where the parent organization runs the institution. Everything else is run independently. */
const GOVERNED: RelationshipType[] = ['member', 'constituent', 'owned_campus'];

/**
 * An affiliated, autonomous or partner institution keeps its own records.
 * The parent sees only what the institution agrees to share (see data sharing).
 */
export function isExternal(inst: Pick<Institution, 'relationship'>): boolean {
  return Boolean(inst.relationship) && !GOVERNED.includes(inst.relationship!.type);
}

export function isGoverned(inst: Pick<Institution, 'relationship'>): boolean {
  return !isExternal(inst);
}

/** Which relationship types an organization of this type may have with an institution. Empty means it cannot take institutions. */
export const ALLOWED_RELATIONSHIPS: Record<OrgType, RelationshipType[]> = {
  single_school: [],
  single_college: [],
  multi_campus: [],
  school_group: ['member'],
  school_trust: ['member'],
  school_chain: ['member'],
  college_group: ['member'],
  university_group: ['member'],
  multi_institution: ['member', 'partner'],
  other: ['member'],
  university: ['constituent', 'affiliated', 'autonomous', 'partner', 'owned_campus'],
};

/** Why an institution cannot take this relationship with this organization, or null when it can. */
export function relationshipProblem(org: Organization, inst: Pick<Institution, 'profile' | 'name'>, relationship: RelationshipType): string | null {
  const allowed = ALLOWED_RELATIONSHIPS[org.type];
  if (allowed.length === 0) return `${org.name} is a single institution and cannot take other institutions.`;
  if (!allowed.includes(relationship)) return `A ${org.type.replace(/_/g, ' ')} cannot have a "${relationship.replace(/_/g, ' ')}" relationship.`;
  const isSchoolGroup = org.type === 'school_group' || org.type === 'school_trust' || org.type === 'school_chain';
  if (isSchoolGroup && inst.profile !== 'school') return 'A school group takes schools only.';
  if (org.type === 'college_group' && inst.profile === 'school') return 'A college group does not take schools.';
  if (org.type === 'university' && inst.profile === 'school' && relationship !== 'partner') return 'A school can be a partner of a university, not a college of it.';
  if (org.type === 'university' && inst.profile === 'university') return 'A university cannot be a college of another university.';
  return null;
}

export const RELATIONSHIP_HELP: Record<RelationshipType, { summary: string; sees: string }> = {
  member: { summary: 'Belongs to a group, trust or chain.', sees: 'The organization manages it and sees everything.' },
  constituent: { summary: 'A college that is part of the university.', sees: 'The university manages it and sees everything.' },
  owned_campus: { summary: 'A campus the university owns and runs.', sees: 'The university manages it and sees everything.' },
  affiliated: { summary: 'An independent college that is affiliated to the university for degrees and exams.', sees: 'The university sees only what the college agrees to share.' },
  autonomous: { summary: 'A college with its own academic freedom under the university.', sees: 'The university sees only what the college agrees to share.' },
  partner: { summary: 'An institution that works with the university by agreement.', sees: 'The university sees only what the institution agrees to share.' },
};

/** Documents to check before a link is approved. */
export function checklistFor(relationship: RelationshipType): Array<Pick<ChecklistItem, 'label'>> {
  const base = [{ label: 'Registration or recognition certificate' }, { label: 'Governing body resolution to link' }, { label: 'Signed terms of the relationship' }];
  switch (relationship) {
    case 'affiliated':
      return [...base, { label: 'Inspection committee report' }, { label: 'Affiliation fee receipt' }];
    case 'autonomous':
      return [...base, { label: 'Autonomy order from the regulator' }];
    case 'partner':
      return [...base, { label: 'Memorandum of understanding' }];
    case 'constituent':
    case 'owned_campus':
      return [...base, { label: 'Transfer of governance documents' }];
    default:
      return [...base, { label: 'Trust deed or group membership letter' }];
  }
}

// ---------- Names and duplicates
export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(the|of|and)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface DuplicateDraft {
  name: string;
  city: string;
  registrationNo?: string;
}

/** Institutions that look like the same one: same registration number, or same name in the same city. */
export function findDuplicates(institutions: Institution[], draft: DuplicateDraft, ignoreId?: string): Institution[] {
  const name = normalizeName(draft.name);
  const city = draft.city.trim().toLowerCase();
  const reg = (draft.registrationNo ?? '').trim().toLowerCase();
  return institutions.filter((candidate) => {
    if (candidate.id === ignoreId) return false;
    if (reg && (candidate.registrationNo ?? '').trim().toLowerCase() === reg) return true;
    return name !== '' && normalizeName(candidate.name) === name && candidate.city.trim().toLowerCase() === city;
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Next id such as "unit-7" that does not clash with an existing id. */
export function nextId(prefix: string, existing: string[]): string {
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  existing.forEach((id) => {
    const match = re.exec(id);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `${prefix}-${max + 1}`;
}

// ---------- Data sharing
export function agreementOf(agreements: Agreement[], instId: string, domain: string): Agreement | undefined {
  return agreements.find((item) => item.instId === instId && item.domain === domain);
}

/**
 * What the parent organization may see of an institution in one data area.
 * Run by the parent: full. Independent (affiliated, autonomous, partner): only what the agreement allows, nothing by default.
 */
export function shareLevelFor(world: Pick<World, 'agreements'>, inst: Institution, domain: string): ShareLevel {
  if (!isExternal(inst)) return 'full';
  return agreementOf(world.agreements, inst.id, domain)?.level ?? 'none';
}

export function sharedDomainCount(world: Pick<World, 'agreements'>, inst: Institution): number {
  return SHARE_DOMAINS.filter((domain) => shareLevelFor(world, inst, domain.key) !== 'none').length;
}

// ---------- Policies
export function policyFor(world: Pick<World, 'policies'>, orgId: string, key: string): PolicySetting | null {
  const setting = world.policies[orgId]?.[key];
  return setting && setting.enforced ? setting : null;
}

export function organizationOf(organizations: Organization[], inst: Institution): Organization | undefined {
  return organizations.find((org) => org.id === inst.orgId);
}

/** Independent: its own hidden organization with no other institution. */
export function isIndependent(organizations: Organization[], institutions: Institution[], inst: Institution): boolean {
  const org = organizationOf(organizations, inst);
  return Boolean(org?.implicit) && institutions.filter((candidate) => candidate.orgId === inst.orgId).length === 1;
}

export { formatDate } from '../i18n/format';

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString(currentRegion().locale, { month: 'long' });
}
