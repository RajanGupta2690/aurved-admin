/**
 * Organization model. Three things are kept apart on purpose:
 * - the organization type (who governs: a trust, a university, a single school)
 * - the education profile (what an institution teaches: school, college, university, institute)
 * - the relationship between institutions (affiliated, constituent, ...)
 * A School Group is an organization type. It is never a University.
 */

export type ProfileKind = 'school' | 'college' | 'university' | 'institute';

export type OrgType =
  | 'single_school'
  | 'school_group'
  | 'school_trust'
  | 'school_chain'
  | 'single_college'
  | 'college_group'
  | 'university'
  | 'university_group'
  | 'multi_campus'
  | 'multi_institution'
  | 'other';

export type RelationshipType = 'member' | 'constituent' | 'affiliated' | 'autonomous' | 'partner' | 'owned_campus';

export type GovernanceModel = 'centralized' | 'federated' | 'autonomous';

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  country: string;
  governance?: GovernanceModel;
  legalName?: string;
  registrationNo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  foundedYear?: number;
  /** An independent school or college has a hidden organization of its own. The UI does not show it. */
  implicit: boolean;
}

export type CampusKind = 'main' | 'branch' | 'satellite' | 'hostel' | 'online';

export interface Campus {
  id: string;
  name: string;
  city: string;
  address?: string;
  code?: string;
  kind?: CampusKind;
  /** Missing means active. Campuses are archived, never deleted, because records point to them. */
  status?: 'active' | 'archived';
}

export interface InstitutionRelationship {
  type: RelationshipType;
  parentInstId: string;
}

export interface Institution {
  id: string;
  orgId: string;
  name: string;
  shortName: string;
  profile: ProfileKind;
  country: string;
  city: string;
  campuses: Campus[];
  relationship?: InstitutionRelationship;
  status: 'active' | 'pending' | 'suspended' | 'archived';
  email?: string;
  phone?: string;
  address?: string;
  headName?: string;
  registrationNo?: string;
  foundedYear?: number;
  /** Examining body or regulator reference, shown on the profile. */
  affiliation?: string;
}

export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  single_school: 'Single school',
  school_group: 'School group',
  school_trust: 'School trust',
  school_chain: 'School chain',
  single_college: 'Single college',
  college_group: 'College group',
  university: 'University',
  university_group: 'University group',
  multi_campus: 'Multi-campus institution',
  multi_institution: 'Multi-institution organization',
  other: 'Other organization',
};

export const PROFILE_LABEL: Record<ProfileKind, string> = {
  school: 'School',
  college: 'College',
  university: 'University',
  institute: 'Institute',
};

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  member: 'Group member',
  constituent: 'Constituent college',
  affiliated: 'Affiliated college',
  autonomous: 'Autonomous college',
  partner: 'Partner institution',
  owned_campus: 'University-owned campus',
};

export const CAMPUS_KIND_LABEL: Record<CampusKind, string> = {
  main: 'Main campus',
  branch: 'Branch campus',
  satellite: 'Satellite campus',
  hostel: 'Hostel or residential',
  online: 'Online',
};

/** Hidden organizations belong to one institution only, so the selector for organizations is not needed. */
export function isGroupOrg(org: Organization): boolean {
  return !org.implicit;
}
