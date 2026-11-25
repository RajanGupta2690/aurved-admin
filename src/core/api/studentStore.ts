import { students as seedStudents } from '../../data/mockData';
import type { Student } from '../../types';
import { createStore, useStore } from './persistedStore';
import { useMemo } from 'react';

/**
 * Demo store for the Students screens. The seed students come from the sample school.
 * Students added here are kept next to them, removed ones are hidden and changes to any student are kept
 * on top of the seed. Reset demo data brings the seed back.
 */
interface StudentState {
  added: Student[];
  removed: string[];
  /** Changed fields per student id. Older saved data has none. */
  edited?: Record<string, Partial<Student>>;
}

const isState = (value: unknown): value is StudentState => !!value && typeof value === 'object' && Array.isArray((value as StudentState).added) && Array.isArray((value as StudentState).removed);

const store = createStore<StudentState>('students', () => ({ added: [], removed: [], edited: {} }), isState);

export const studentActions = {
  add(student: Student) {
    store.set((previous) => ({ ...previous, added: [...previous.added, student] }));
  },
  /** Changes details of a student. The school student ID and id never change. */
  update(id: string, patch: Partial<Omit<Student, 'id' | 'admissionNumber'>>) {
    store.set((previous) => ({
      ...previous,
      added: previous.added.map((student) => (student.id === id ? { ...student, ...patch } : student)),
      edited: previous.added.some((student) => student.id === id) ? previous.edited : { ...(previous.edited ?? {}), [id]: { ...(previous.edited?.[id] ?? {}), ...patch } },
    }));
  },
  remove(id: string) {
    store.set((previous) => ({ ...previous, added: previous.added.filter((student) => student.id !== id), removed: previous.added.some((student) => student.id === id) ? previous.removed : [...previous.removed, id] }));
  },
};

/** Every student that is not removed: the sample students first, then the ones added in this browser. */
export function useStudents(): Student[] {
  const state = useStore(store);
  return useMemo(() => [...seedStudents.filter((student) => !state.removed.includes(student.id)).map((student) => (state.edited?.[student.id] ? { ...student, ...state.edited[student.id] } : student)), ...state.added], [state]);
}
