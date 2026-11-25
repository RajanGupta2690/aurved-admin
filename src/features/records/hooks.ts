import { useStore } from '../../core/api/persistedStore';
import { recordsStore } from '../../core/api/stores';
import { usePortal } from '../../core/context/portalContext';
import { RECORD_MODULES } from '../../core/records/registry';
import type { CollectionDef, ModuleGroup, RecordRow } from '../../core/records/types';
import { useStaff } from '../staff/hooks';

/** Records live in a place: an institution, or the organization for university level collections. */
export function useScopeId(module: ModuleGroup): string {
  const { inst, org } = usePortal();
  return module.scope === 'org' ? org.id : inst?.id ?? org.id;
}

export function useRows(def: CollectionDef, scopeId: string, includeArchived = false): RecordRow[] {
  const state = useStore(recordsStore);
  return (state[def.key] ?? []).filter((row) => row.scopeId === scopeId && (includeArchived || !row.archived));
}

export function useModule(key: string): ModuleGroup | undefined {
  return RECORD_MODULES.find((module) => module.key === key);
}

/** Names for staff and institution ids, for tables and forms. */
export function useNames() {
  const { institutions } = usePortal();
  const state = useStaff();
  return {
    staffName: (id: string) => state.members.find((member) => member.id === id)?.person.fullName ?? id,
    instName: (id: string) => institutions.find((inst) => inst.id === id)?.shortName ?? id,
  };
}
