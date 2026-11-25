import type { Tone } from '../../shared/ui/Badge';
import type { FeatureResolution } from '../../core/features/resolve';

const LABEL: Record<string, { text: string; tone: Tone }> = {
  not_applicable: { text: 'Not for this type', tone: 'neutral' },
  not_in_plan: { text: 'Not in plan', tone: 'warning' },
  locked_by_policy: { text: 'Locked by organization', tone: 'danger' },
  disabled_locally: { text: 'Switched off', tone: 'neutral' },
  dependency_missing: { text: 'Needs another feature', tone: 'warning' },
  unknown_feature: { text: 'Unknown', tone: 'neutral' },
};

/** The state of a feature in words. Colour is never the only signal. */
export function stateOf(resolution: FeatureResolution, required?: boolean): { text: string; tone: Tone } {
  if (resolution.available) {
    if (required) return { text: 'On, required by the platform', tone: 'success' };
    if (resolution.mandatory) return { text: 'On, required by organization', tone: 'brand' };
    return { text: 'On', tone: 'success' };
  }
  return LABEL[resolution.reason ?? 'unknown_feature'];
}

