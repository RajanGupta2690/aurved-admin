import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accessStore, featureConfigStore, orgStore, prefsStore } from '../api/stores';
import { useStore } from '../api/persistedStore';
import { evaluate } from '../access/engine';
import { isExternal } from '../org/rules';
import { resolveFeature } from '../features/resolve';
import type { FeatureConfig } from '../features/resolve';
import { PortalContext } from './portalContext';
import type { PortalContextValue } from './portalContext';
import { defaultPathFor } from './paths';
import NotFoundPage from '../../features/portal/pages/NotFoundPage';

const ORG_LEVEL_CONFIG: FeatureConfig = { entitlements: ['*'], policy: {}, local: {} };

/** Reads the organization or institution from the URL and offers it, with the person and the rules, to every page below. */
export default function PortalProvider({ scope, children }: { scope: 'inst' | 'org'; children: ReactNode }) {
  const params = useParams();
  const navigate = useNavigate();
  const { organizations, institutions } = useStore(orgStore);
  const configs = useStore(featureConfigStore);
  const { roles, personas } = useStore(accessStore);
  const prefs = useStore(prefsStore);

  const inst = scope === 'inst' ? institutions.find((candidate) => candidate.id === params.instId) ?? null : null;
  const org = scope === 'inst' ? organizations.find((candidate) => candidate.id === inst?.orgId) : organizations.find((candidate) => candidate.id === params.orgId);
  const persona = personas.find((candidate) => candidate.id === prefs.personaId) ?? personas[0];

  // Remember the last place, so old links and the root address come back here.
  const currentInstId = inst?.id;
  const currentOrgId = org?.id;
  useEffect(() => {
    if (currentInstId && prefs.lastInstId !== currentInstId) prefsStore.set((previous) => ({ ...previous, lastInstId: currentInstId, lastOrgId: currentOrgId ?? null }));
    else if (!currentInstId && currentOrgId && prefs.lastOrgId !== currentOrgId) prefsStore.set((previous) => ({ ...previous, lastOrgId: currentOrgId }));
  }, [currentInstId, currentOrgId, prefs.lastInstId, prefs.lastOrgId]);

  const value = useMemo<PortalContextValue | null>(() => {
    if (!org || (scope === 'inst' && !inst)) return null;
    const config = inst ? configs[inst.id] ?? null : null;
    const place = { orgId: org.id, instId: inst?.id, external: inst ? isExternal(inst) : undefined };
    const base = scope === 'inst' ? `/inst/${inst?.id}` : `/org/${org.id}`;
    return {
      scope,
      org,
      inst,
      place,
      persona,
      personas,
      roles,
      organizations,
      institutions,
      featureConfig: config,
      feature: (key) => resolveFeature(config ?? ORG_LEVEL_CONFIG, inst?.profile ?? null, key),
      can: (permission) => evaluate(persona, roles, permission, place),
      canIn: (permission, instId) => {
        const target = institutions.find((candidate) => candidate.id === instId);
        if (!target) return { allowed: false, reason: 'no_membership', detail: 'This institution does not exist.' };
        return evaluate(persona, roles, permission, { orgId: target.orgId, instId: target.id, external: isExternal(target) });
      },
      path: (sub) => (sub ? `${base}/${sub.replace(/^\//, '')}` : base),
      campusId: inst ? prefs.campusByInst[inst.id] ?? 'all' : 'all',
      setCampus: (campusId) => {
        if (inst) prefsStore.set((previous) => ({ ...previous, campusByInst: { ...previous.campusByInst, [inst.id]: campusId } }));
      },
      sessionId: prefs.sessionId,
      setSession: (sessionId) => prefsStore.set((previous) => ({ ...previous, sessionId })),
      switchPersona: (personaId) => {
        const next = personas.find((candidate) => candidate.id === personaId);
        if (!next) return;
        prefsStore.set((previous) => ({ ...previous, personaId }));
        navigate(defaultPathFor(next, organizations, institutions));
      },
    };
  }, [scope, org, inst, persona, personas, roles, organizations, institutions, configs, prefs.campusByInst, prefs.sessionId, navigate]);

  if (!value) return <NotFoundPage standalone />;
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}
