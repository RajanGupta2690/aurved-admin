import { useCallback } from 'react';
import { orgStore } from '../../core/api/stores';
import { useStore } from '../../core/api/persistedStore';
import { change, worldStore } from '../../core/api/worldStore';
import { usePortal } from '../../core/context/portalContext';
import type { Actor, OrgState, Snapshot, World } from '../../core/org/model';
import type { Res } from '../../core/org/ops';
import { useToast } from '../../shared/ui/toastContext';

export function useWorld(): World {
  return useStore(worldStore);
}

export function useOrgData(): OrgState {
  return useStore(orgStore);
}

/** The person acting, for history lines. */
export function useActor(): Actor {
  const { persona } = usePortal();
  return { id: persona.id, name: persona.name };
}

/**
 * Runs one change from core/org/ops against the saved data. Shows a toast when it worked.
 * The caller shows the error sentence next to the form when it did not.
 */
export function useApply() {
  const toast = useToast();
  const { persona } = usePortal();
  const actorId = persona.id;
  const actorName = persona.name;
  return useCallback(
    <E extends object>(operation: (snap: Snapshot, now: string, actor: Actor) => Res<E>, success?: string): Res<E> => {
      const result = change((snap, now) => operation(snap, now, { id: actorId, name: actorName }));
      if (result.ok && success) toast.success(success);
      return result;
    },
    [toast, actorId, actorName],
  );
}
