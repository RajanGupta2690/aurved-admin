import { matchesAny } from '../access/match';
import type { ProfileKind } from '../org/types';
import { getFeature, getModuleOf, moduleAppliesTo } from './registry';

/**
 * Layers 1 to 3 of the control model, for one institution or organization:
 *   1. subscription entitlements (what the plan includes)
 *   2. organization policy (what a parent mandates or locks)
 *   3. local configuration (what the institution switched off)
 * Person access (layer 4) is in core/access.
 */
export type PolicyMode = 'mandatory' | 'locked_off';

export interface FeatureConfig {
  /** Patterns such as * or students.* or finance.fees. */
  entitlements: string[];
  /** Set by a parent organization. */
  policy: Record<string, PolicyMode>;
  /** Set locally. A module key or a feature key mapped to false means switched off. */
  local: Record<string, boolean>;
}

export type UnavailableReason = 'unknown_feature' | 'not_applicable' | 'not_in_plan' | 'locked_by_policy' | 'disabled_locally' | 'dependency_missing';

export interface FeatureResolution {
  available: boolean;
  reason?: UnavailableReason;
  /** Human readable sentence. */
  detail?: string;
  /** True when a parent organization forces it on. */
  mandatory?: boolean;
}

const REASON_TEXT: Record<UnavailableReason, string> = {
  unknown_feature: 'This feature does not exist.',
  not_applicable: 'This feature does not apply to this type of institution.',
  not_in_plan: 'It is not part of the current plan.',
  locked_by_policy: 'The parent organization has turned it off.',
  disabled_locally: 'It has been switched off for this institution.',
  dependency_missing: 'A feature it needs is not available.',
};

function blocked(reason: UnavailableReason, extra?: string): FeatureResolution {
  return { available: false, reason, detail: extra ? `${REASON_TEXT[reason]} ${extra}` : REASON_TEXT[reason] };
}

export function resolveFeature(config: FeatureConfig, profile: ProfileKind | null, key: string, seen: string[] = []): FeatureResolution {
  const feature = getFeature(key);
  const module = getModuleOf(key);
  if (!feature || !module) return blocked('unknown_feature');
  if (profile && !moduleAppliesTo(module, profile)) return blocked('not_applicable');
  if (!feature.required && !matchesAny(config.entitlements, key)) return blocked('not_in_plan');

  const policy = config.policy[key] ?? config.policy[module.key];
  if (policy === 'locked_off') return blocked('locked_by_policy');

  const mandatory = policy === 'mandatory' || feature.required === true;
  if (!mandatory && (config.local[key] === false || config.local[module.key] === false)) return blocked('disabled_locally');

  if (feature.dependsOn && !seen.includes(key)) {
    for (const dependency of feature.dependsOn) {
      const result = resolveFeature(config, profile, dependency, [...seen, key]);
      if (!result.available) {
        return blocked('dependency_missing', `Needs "${getFeature(dependency)?.label ?? dependency}".`);
      }
    }
  }
  return { available: true, mandatory };
}

/** The features of a module with their current state. Used by the feature matrix. */
export function resolveAll(config: FeatureConfig, profile: ProfileKind | null, keys: string[]): Record<string, FeatureResolution> {
  const result: Record<string, FeatureResolution> = {};
  keys.forEach((key) => {
    result[key] = resolveFeature(config, profile, key);
  });
  return result;
}

export interface FeatureStep {
  label: string;
  passed: boolean;
  detail: string;
}

/** The same decision as resolveFeature, layer by layer. */
export function explainFeature(config: FeatureConfig, profile: ProfileKind | null, key: string): { resolution: FeatureResolution; steps: FeatureStep[] } {
  const resolution = resolveFeature(config, profile, key);
  const feature = getFeature(key);
  const module = getModuleOf(key);
  const steps: FeatureStep[] = [];
  if (!feature || !module) return { resolution, steps: [{ label: 'Does the feature exist?', passed: false, detail: REASON_TEXT.unknown_feature }] };
  const applies = !profile || moduleAppliesTo(module, profile);
  steps.push({ label: 'Does it apply to this type of institution?', passed: applies, detail: applies ? 'Yes.' : REASON_TEXT.not_applicable });
  if (!applies) return { resolution, steps };
  const inPlan = feature.required === true || matchesAny(config.entitlements, key);
  steps.push({ label: 'Is it in the plan?', passed: inPlan, detail: inPlan ? (feature.required ? 'Yes. It is part of the platform for everyone.' : 'Yes.') : REASON_TEXT.not_in_plan });
  if (!inPlan) return { resolution, steps };
  const policy = config.policy[key] ?? config.policy[module.key];
  steps.push({
    label: 'Does the organization block it?',
    passed: policy !== 'locked_off',
    detail: policy === 'locked_off' ? REASON_TEXT.locked_by_policy : policy === 'mandatory' ? 'No. The organization requires it.' : 'No.',
  });
  if (policy === 'locked_off') return { resolution, steps };
  const mandatory = policy === 'mandatory' || feature.required === true;
  const off = config.local[key] === false || config.local[module.key] === false;
  steps.push({ label: 'Has the institution switched it off?', passed: mandatory || !off, detail: mandatory ? 'It cannot be switched off.' : off ? REASON_TEXT.disabled_locally : 'No, it is on.' });
  if (!mandatory && off) return { resolution, steps };
  if (feature.dependsOn?.length) {
    const missing = feature.dependsOn.map((dependency) => ({ dependency, result: resolveFeature(config, profile, dependency) })).find((item) => !item.result.available);
    steps.push({
      label: 'Is everything it needs available?',
      passed: !missing,
      detail: missing ? `No. "${getFeature(missing.dependency)?.label ?? missing.dependency}" is not available.` : `Yes: ${feature.dependsOn.map((d) => getFeature(d)?.label ?? d).join(', ')}.`,
    });
  }
  return { resolution, steps };
}
