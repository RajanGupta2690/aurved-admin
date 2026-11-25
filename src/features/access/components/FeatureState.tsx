import { Badge } from '../../../shared/ui/Badge';
import type { FeatureResolution } from '../../../core/features/resolve';
import { stateOf } from '../featureState';

export default function FeatureState({ resolution, required }: { resolution: FeatureResolution; required?: boolean }) {
  const state = stateOf(resolution, required);
  return <Badge tone={state.tone}>{state.text}</Badge>;
}
