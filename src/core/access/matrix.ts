import { actionsOf, MODULES } from '../features/registry';
import { matchesAny } from './match';
import type { Action } from './match';

/** One row of the permission builder: a feature and the actions a role can have on it. */
export interface PermRow {
  moduleKey: string;
  moduleLabel: string;
  featureKey: string;
  featureLabel: string;
  actions: Action[];
}

export function permissionRows(): PermRow[] {
  return MODULES.flatMap((module) =>
    module.features.map((feature) => ({ moduleKey: module.key, moduleLabel: module.label, featureKey: feature.key, featureLabel: feature.label, actions: actionsOf(feature) })),
  );
}

export type CellState = 'none' | 'allow' | 'deny';
export type Matrix = Record<string, CellState>;
export const cellKey = (featureKey: string, action: Action) => `${featureKey}.${action}`;

/** What a list of permission patterns means for every feature and action that exists today. */
export function matrixOf(patterns: string[]): Matrix {
  const allows = patterns.filter((pattern) => !pattern.startsWith('!'));
  const denies = patterns.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1));
  const matrix: Matrix = {};
  permissionRows().forEach((row) =>
    row.actions.forEach((action) => {
      const key = cellKey(row.featureKey, action);
      matrix[key] = matchesAny(denies, key) ? 'deny' : matchesAny(allows, key) ? 'allow' : 'none';
    }),
  );
  return matrix;
}

/** Back to short patterns. A full feature becomes feature.*, a full module becomes module.*, everything becomes *. */
export function patternsFrom(matrix: Matrix): string[] {
  const rows = permissionRows();
  const compress = (wanted: (state: CellState) => boolean): string[] => {
    const out: string[] = [];
    let everything = true;
    MODULES.forEach((module) => {
      const moduleRows = rows.filter((row) => row.moduleKey === module.key);
      const full = moduleRows.every((row) => row.actions.every((action) => wanted(matrix[cellKey(row.featureKey, action)] ?? 'none')));
      if (full && moduleRows.length > 0) {
        out.push(`${module.key}.*`);
        return;
      }
      everything = false;
      moduleRows.forEach((row) => {
        const picked = row.actions.filter((action) => wanted(matrix[cellKey(row.featureKey, action)] ?? 'none'));
        if (picked.length === row.actions.length) out.push(`${row.featureKey}.*`);
        else picked.forEach((action) => out.push(cellKey(row.featureKey, action)));
      });
    });
    return everything ? ['*'] : out;
  };
  // A denied cell is also listed as allowed, so that "everything except organization pages" stays "*" plus one deny.
  const allow = compress((state) => state !== 'none');
  const deny = compress((state) => state === 'deny');
  const denyList = deny.length === 1 && deny[0] === '*' ? ['*'] : deny;
  return [...allow, ...denyList.filter(Boolean).map((pattern) => `!${pattern}`)].filter((pattern) => pattern !== '!');
}

/** Number of allowed and denied cells, for summaries. */
export function matrixCounts(matrix: Matrix) {
  const values = Object.values(matrix);
  return { allowed: values.filter((state) => state === 'allow').length, denied: values.filter((state) => state === 'deny').length, total: values.length };
}

/** Every permission key that a list of patterns allows today (denies removed). */
export function allowedKeys(patterns: string[]): string[] {
  const matrix = matrixOf(patterns);
  return Object.entries(matrix).filter(([, state]) => state === 'allow').map(([key]) => key);
}
