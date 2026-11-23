import { useSyncExternalStore } from 'react';

/**
 * Demo storage. Every store keeps its value in memory and saves it to localStorage.
 * It stands in for an API. Change DEMO_DATA_VERSION whenever seed data changes shape,
 * so old saved data is not mixed with new seeds.
 */
export const DEMO_DATA_VERSION = 'v3';
const PREFIX = `aurved.demo.${DEMO_DATA_VERSION}.`;

export interface Store<T> {
  get: () => T;
  set: (next: T | ((previous: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** Back to the seed. */
  reset: () => void;
}

const registry: Array<Store<unknown>> = [];

export function createStore<T>(name: string, seed: () => T, isValid?: (value: unknown) => value is T): Store<T> {
  const key = PREFIX + name;
  const listeners = new Set<() => void>();

  const load = (): T => {
    try {
      const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!isValid || isValid(parsed)) return parsed as T;
      }
    } catch {
      // Unreadable data: use the seed.
    }
    return seed();
  };

  let current = load();
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(current));
    } catch {
      // Storage blocked or full. The demo keeps working in memory.
    }
    listeners.forEach((listener) => listener());
  };

  const store: Store<T> = {
    get: () => current,
    set: (next) => {
      const value = typeof next === 'function' ? (next as (previous: T) => T)(current) : next;
      if (value === current) return;
      current = value;
      save();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset: () => {
      current = seed();
      save();
    },
  };
  registry.push(store as Store<unknown>);
  return store;
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Puts every demo store back to its seed. */
export function resetAllDemoData() {
  registry.forEach((store) => store.reset());
  // Also clear saved data of other versions and the older family store.
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('aurved.demo.') && !key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}
