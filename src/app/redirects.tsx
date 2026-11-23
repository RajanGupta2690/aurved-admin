import { Navigate, useLocation } from 'react-router-dom';
import { accessStore, orgStore, prefsStore } from '../core/api/stores';
import { useStore } from '../core/api/persistedStore';
import { defaultPathFor, reachableContexts } from '../core/context/paths';

function useStartPath(): string {
  const { organizations, institutions } = useStore(orgStore);
  const { personas } = useStore(accessStore);
  const prefs = useStore(prefsStore);
  const persona = personas.find((candidate) => candidate.id === prefs.personaId) ?? personas[0];
  const reachable = reachableContexts(persona, organizations, institutions);
  if (prefs.lastOrgId && reachable.organizations.some((org) => org.id === prefs.lastOrgId) && !reachable.institutions.some((inst) => inst.id === prefs.lastInstId)) {
    return `/org/${prefs.lastOrgId}`;
  }
  if (reachable.institutions.some((inst) => inst.id === prefs.lastInstId)) return `/inst/${prefs.lastInstId}`;
  return defaultPathFor(persona, organizations, institutions);
}

/** The root address. Goes to the last place this person was in. */
export function RootRedirect() {
  return <Navigate to={useStartPath()} replace />;
}

/** Old flat addresses such as /students go to the same page inside the current institution. */
export function LegacyRedirect() {
  const location = useLocation();
  const start = useStartPath();
  const target = start.startsWith('/inst/') ? `${start}${location.pathname}${location.search}` : start;
  return <Navigate to={target} replace />;
}
