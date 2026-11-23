import { createContext, useContext } from 'react';
import type { AccessResult, Persona, Place, RoleDef } from '../access/engine';
import type { FeatureConfig, FeatureResolution } from '../features/resolve';
import type { Institution, Organization } from '../org/types';

export interface PortalContextValue {
  scope: 'inst' | 'org';
  org: Organization;
  /** Set when scope is inst. */
  inst: Institution | null;
  place: Place;
  persona: Persona;
  personas: Persona[];
  roles: RoleDef[];
  organizations: Organization[];
  institutions: Institution[];
  /** Layers 1 to 3 for the current institution. Null at organization level. */
  featureConfig: FeatureConfig | null;
  feature: (featureKey: string) => FeatureResolution;
  /** Layer 4. permission is module.feature.action. */
  can: (permission: string) => AccessResult;
  /** Layer 4 for another institution of this organization, for example a row in a table. */
  canIn: (permission: string, instId: string) => AccessResult;
  /** Path inside the current context, for example path('students') gives /inst/inst-sunrise/students. */
  path: (sub?: string) => string;
  campusId: string;
  setCampus: (campusId: string) => void;
  sessionId: string;
  setSession: (sessionId: string) => void;
  switchPersona: (personaId: string) => void;
}

export const PortalContext = createContext<PortalContextValue | null>(null);

export function usePortal(): PortalContextValue {
  const value = useContext(PortalContext);
  if (!value) throw new Error('usePortal must be used inside a portal layout');
  return value;
}

/** Institution-level hook for pages that only exist inside an institution. */
export function useInstitution(): Institution {
  const { inst } = usePortal();
  if (!inst) throw new Error('This page needs an institution context');
  return inst;
}
