import type { Persona } from '../access/engine';
import { isExternal } from '../org/rules';
import type { Institution, Organization } from '../org/types';

/** Where a person lands first. Organization level for group and university admins, else their institution. */
export function defaultPathFor(persona: Persona, organizations: Organization[], institutions: Institution[]): string {
  for (const membership of persona.memberships) {
    if (membership.scope.type === 'org') {
      const org = organizations.find((candidate) => candidate.id === membership.scope.id);
      if (org && !org.implicit) return `/org/${org.id}`;
      const first = institutions.find((inst) => inst.orgId === membership.scope.id);
      if (first) return `/inst/${first.id}`;
    } else if (institutions.some((inst) => inst.id === membership.scope.id)) {
      return `/inst/${membership.scope.id}`;
    }
  }
  return '/';
}

/** Institutions and organizations a person can open, for the context switcher. */
export function reachableContexts(persona: Persona, organizations: Organization[], institutions: Institution[]) {
  const orgIds = new Set<string>();
  const instIds = new Set<string>();
  persona.memberships.forEach((membership) => {
    if (membership.scope.type === 'org') {
      orgIds.add(membership.scope.id);
      // An organization role does not reach into institutions that run independently.
      institutions.filter((inst) => inst.orgId === membership.scope.id && !isExternal(inst)).forEach((inst) => instIds.add(inst.id));
    } else {
      instIds.add(membership.scope.id);
    }
  });
  return {
    organizations: organizations.filter((org) => orgIds.has(org.id) && !org.implicit),
    institutions: institutions.filter((inst) => instIds.has(inst.id)),
  };
}
