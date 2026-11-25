import { isExited } from './model';
import type { StaffState } from './model';

export interface Slice {
  label: string;
  value: number;
}

const count = (items: string[]): Slice[] => {
  const map = new Map<string, number>();
  items.forEach((item) => map.set(item, (map.get(item) ?? 0) + 1));
  return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

/** Numbers for one institution (or several). Exited staff count only in the attrition figures. */
export function staffAnalytics(state: StaffState, instIds: string[], year: number) {
  const all = state.members.filter((member) => instIds.includes(member.instId));
  const current = all.filter((member) => !isExited(member.employment.status));
  const name = (list: { id: string; name: string }[], id: string) => list.find((item) => item.id === id)?.name ?? 'Unknown';
  const joinedThisYear = all.filter((member) => member.employment.joinDate.startsWith(String(year))).length;
  const leftThisYear = all.filter((member) => member.employment.exitDate?.startsWith(String(year))).length;
  const average = current.length || 1;
  const sessions = state.assignments.filter((item) => instIds.includes(item.instId) && item.status === 'active');
  const teachers = current.filter((member) => member.employment.category === 'teaching');
  const load = (id: string) => sessions.filter((item) => item.staffId === id).reduce((sum, item) => sum + item.periods, 0);
  return {
    headcount: current.length,
    teaching: teachers.length,
    nonTeaching: current.length - teachers.length,
    byDepartment: count(current.map((member) => name(state.departments, member.employment.departmentId))),
    byDesignation: count(current.map((member) => name(state.designations, member.employment.designationId))),
    byType: count(current.map((member) => member.employment.type.replace('_', ' '))),
    byStatus: count(all.map((member) => member.employment.status.replace('_', ' '))),
    joinedThisYear,
    leftThisYear,
    attritionPercent: Math.round((leftThisYear / (average + leftThisYear)) * 1000) / 10,
    withAccount: current.filter((member) => member.accountId).length,
    averageLoad: teachers.length ? Math.round((teachers.reduce((sum, member) => sum + load(member.id), 0) / teachers.length) * 10) / 10 : 0,
    heaviest: teachers.map((member) => ({ label: member.person.fullName, value: load(member.id) })).sort((a, b) => b.value - a.value).slice(0, 6),
    unassignedTeachers: teachers.filter((member) => load(member.id) === 0).length,
  };
}
