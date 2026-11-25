import { useStore } from '../../core/api/persistedStore';
import { featureConfigStore } from '../../core/api/stores';
import { usePortal } from '../../core/context/portalContext';
import { effectiveConfig } from '../../core/features/effective';
import type { FeatureConfig } from '../../core/features/resolve';
import type { Institution } from '../../core/org/types';

/** The configuration that applies to an institution, kept up to date when features change. */
export function useEffectiveConfig(inst: Institution | null | undefined): FeatureConfig | null {
  const { organizations } = usePortal();
  const configs = useStore(featureConfigStore);
  return inst ? effectiveConfig(configs, organizations, inst) : null;
}

export function useFeatureConfigs() {
  return useStore(featureConfigStore);
}
