import { inboxStore } from '../../core/api/inboxStore';
import { useStore } from '../../core/api/persistedStore';
import { usePortal } from '../../core/context/portalContext';
import { isExternal } from '../../core/org/rules';
import { NAV_GROUPS, ROUTES } from '../../core/routing/registry';
import type { RouteDef } from '../../core/routing/registry';

/** Screens this person can open here, from the registry. Same rules as the route gate. */
export function useNavigation(): Array<{ group: string; items: RouteDef[] }> {
  const portal = usePortal();
  const { scope, feature, can } = portal;
  const visible = ROUTES.filter(
    (def) => def.nav && (def.scope === 'both' || def.scope === scope) && feature(def.feature).available && can(`${def.feature}.view`).allowed && (!def.visible || def.visible(portal)),
  );
  return NAV_GROUPS.map((group) => ({ group, items: visible.filter((def) => def.group === group) })).filter((entry) => entry.items.length > 0);
}

/** Ids of the institutions the current page covers: one institution, or all institutions of the organization. */
export function useCoveredInstitutionIds(): string[] {
  const { scope, inst, org, institutions } = usePortal();
  return scope === 'inst' && inst ? [inst.id] : institutions.filter((candidate) => candidate.orgId === org.id && !isExternal(candidate)).map((candidate) => candidate.id);
}

export function useUnreadCount(): number {
  const inbox = useStore(inboxStore);
  const ids = useCoveredInstitutionIds();
  return inbox.filter((item) => ids.includes(item.instId) && item.kind === 'notification' && item.status === 'unread').length;
}
