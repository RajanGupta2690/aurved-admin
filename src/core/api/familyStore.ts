import { parents as seedParents, students as seedStudents } from '../../data/mockData';
import type { Parent } from '../../types';
import { createStore, useStore } from './persistedStore';
import { createParentForStudent, isFamilyState, linkStudent, removeParent, seedFamilyState, unlinkStudent, updateParent } from './familyLogic';
import type { FamilyState, ParentFields } from './familyLogic';

/**
 * Demo store for parent records and student links. Saved in the browser through the shared demo store,
 * so "Reset demo data" in the Help centre resets it too. It will be replaced by an API-backed service.
 * Components only use useFamily().
 */
const store = createStore<FamilyState>('family', () => seedFamilyState(seedParents, seedStudents), isFamilyState);

export const familyActions = {
  /** Creates a parent record and links the student to it. Any older link of that student is replaced. */
  createAndLink(studentId: string, fields: ParentFields): Parent {
    const result = createParentForStudent(store.get(), studentId, fields);
    store.set(result.state);
    return result.parent;
  },
  /** Links the student to an existing parent record. Any older link of that student is replaced. */
  link(studentId: string, parentId: string) {
    store.set(linkStudent(store.get(), studentId, parentId));
  },
  /** Removes the link only. The parent record and its other children stay. */
  unlink(studentId: string) {
    store.set(unlinkStudent(store.get(), studentId));
  },
  /** Deletes a parent record that has no children linked. Does nothing if any child is still linked. */
  remove(parentId: string) {
    store.set(removeParent(store.get(), parentId));
  },
  /** Edits the parent record. Every child linked to it sees the change. */
  update(parentId: string, fields: ParentFields) {
    store.set(updateParent(store.get(), parentId, fields));
  },
};

export function useFamily() {
  const family = useStore(store);
  return { family, actions: familyActions };
}
