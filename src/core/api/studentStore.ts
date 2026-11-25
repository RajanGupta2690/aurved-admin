import { students as seedStudents } from '../../data/mockData';
import type { Student } from '../../types';
import { createStore, useStore } from './persistedStore';
import { useMemo } from 'react';

/**
 * Demo store for the older Students screens. The seed students come from the sample school.
 * Students added here are kept next to them, and removed ones are hidden. Reset demo data brings the seed back.
 */
interface StudentState {
  added: Student[];
  removed: string[];
}

const isState = (value: unknown): value is StudentState => !!value && typeof value === 'object' && Array.isArray((value as StudentState).added) && Array.isArray((value as StudentState).removed);

const store = createStore<StudentState>('students', () => ({ added: [], removed: [] }), isState);

export const studentActions = {
  add(student: Student) {
    store.set((previous) => ({ ...previous, added: [...previous.added, student] }));
  },
  remove(id: string) {
    store.set((previous) => ({ added: previous.added.filter((student) => student.id !== id), removed: previous.added.some((student) => student.id === id) ? previous.removed : [...previous.removed, id] }));
  },
};

/** Every student that is not removed: the sample students first, then the ones added in this browser. */
export function useStudents(): Student[] {
  const state = useStore(store);
  return useMemo(() => [...seedStudents.filter((student) => !state.removed.includes(student.id)), ...state.added], [state]);
}
