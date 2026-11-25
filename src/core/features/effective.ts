import { isExternal } from '../org/rules';
import type { Institution, Organization } from '../org/types';
import type { FeatureConfig } from './resolve';

export const OPEN_CONFIG: FeatureConfig = { entitlements: ['*'], policy: {}, local: {} };

/**
 * The configuration that really applies to an institution.
 * Policy of the organization (its default, then what it set for this institution) is added to the plan and the local switches.
 * An institution that runs independently is not bound by the organization policy.
 */
export function effectiveConfig(features: Record<string, FeatureConfig>, organizations: Organization[], inst: Institution): FeatureConfig {
  const own = features[inst.id] ?? OPEN_CONFIG;
  const org = organizations.find((item) => item.id === inst.orgId);
  if (!org || org.implicit || isExternal(inst)) return own;
  const orgDefault = features[org.id]?.policy ?? {};
  // What the organization set for this institution wins over its own default for everyone.
  return { ...own, policy: { ...orgDefault, ...own.policy } };
}
