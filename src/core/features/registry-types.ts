import type { Action } from '../access/match';
import type { ProfileKind } from '../org/types';

export interface FeatureDef {
  key: string;
  label: string;
  description: string;
  /** Other features that must be available first. */
  dependsOn?: string[];
  /** Cannot be switched off by an institution (the platform needs it). */
  required?: boolean;
  /** Actions a role can be given on this feature. Default: view, create, edit, archive, export. */
  actions?: Action[];
}

export const DEFAULT_ACTIONS: Action[] = ['view', 'create', 'edit', 'archive', 'export'];
export function actionsOf(feature: FeatureDef): Action[] {
  return feature.actions ?? DEFAULT_ACTIONS;
}

export interface ModuleDef {
  key: string;
  label: string;
  description: string;
  /** Profiles this module applies to. */
  profiles: ProfileKind[] | 'all';
  features: FeatureDef[];
}

