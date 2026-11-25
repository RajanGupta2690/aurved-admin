import { useStore } from '../../core/api/persistedStore';
import { staffStore } from '../../core/api/stores';
import { useInstitution } from '../../core/context/portalContext';
import type { StaffMember, StaffState } from '../../core/staff/model';
import { useWorld } from '../organization/hooks';

export function useStaff(): StaffState {
  return useStore(staffStore);
}

/** Staff of the institution in view, with helper lookups. */
export function useInstStaff() {
  const inst = useInstitution();
  const state = useStaff();
  const members = state.members.filter((member) => member.instId === inst.id);
  const designations = state.designations.filter((item) => item.instId === inst.id);
  const departments = state.departments.filter((item) => item.instId === inst.id);
  return {
    inst,
    state,
    members,
    designations,
    departments,
    designationName: (id: string) => state.designations.find((item) => item.id === id)?.name ?? 'Unknown',
    departmentName: (id: string) => state.departments.find((item) => item.id === id)?.name ?? 'Unknown',
    nameOf: (id: string | null | undefined) => state.members.find((member) => member.id === id)?.person.fullName ?? 'Nobody',
    find: (id: string | undefined): StaffMember | undefined => state.members.find((member) => member.id === id),
  };
}

/** The session that is current now, which assignments and workload are counted in. */
export function useCurrentSessionId(): string {
  const inst = useInstitution();
  const world = useWorld();
  return world.sessions.find((item) => item.instId === inst.id && item.status === 'current')?.id ?? 'ay-2025-26';
}
