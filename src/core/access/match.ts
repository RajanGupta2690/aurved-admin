/**
 * Permission keys look like  module.feature.action  (for example students.directory.view).
 * Patterns may use * for one part, or as the last part for "everything below".
 *   *                      everything
 *   students.*             everything in students
 *   students.*.view        view on every students feature
 *   students.directory.*   every action on one feature
 */
export function matches(pattern: string, key: string): boolean {
  if (pattern === '*') return true;
  const p = pattern.split('.');
  const k = key.split('.');
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '*') {
      if (i === p.length - 1) return true; // trailing * covers the rest
      if (i >= k.length) return false;
      continue;
    }
    if (i >= k.length || p[i] !== k[i]) return false;
  }
  return p.length === k.length;
}

export function matchesAny(patterns: readonly string[], key: string): boolean {
  return patterns.some((pattern) => matches(pattern, key));
}

export const ACTIONS = ['view', 'create', 'edit', 'archive', 'approve', 'reject', 'publish', 'export', 'import', 'assign', 'configure'] as const;
export type Action = (typeof ACTIONS)[number];

export function permissionKey(featureKey: string, action: Action): string {
  return `${featureKey}.${action}`;
}
