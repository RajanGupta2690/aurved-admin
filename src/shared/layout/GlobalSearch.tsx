import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { students as demoStudents } from '../../data/mockData';
import { useStore } from '../../core/api/persistedStore';
import { inboxStore } from '../../core/api/inboxStore';
import { usePortal } from '../../core/context/portalContext';
import { reachableContexts } from '../../core/context/paths';
import { ROUTES } from '../../core/routing/registry';
import { Dialog } from '../ui/Overlay';
import { cn } from '../ui/cn';

interface Result {
  id: string;
  group: 'Screens' | 'Institutions' | 'Students' | 'Tasks and approvals';
  label: string;
  hint?: string;
  to: string;
}

/** Search over what this person may open. Ctrl or Cmd plus K opens it from anywhere. */
export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scope, inst, org, feature, can, path, persona, organizations, institutions } = usePortal();
  const inbox = useStore(inboxStore);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo<Result[]>(() => {
    const text = query.trim().toLowerCase();
    if (text.length < 1) return [];
    const found: Result[] = [];
    ROUTES.filter((def) => (def.scope === 'both' || def.scope === scope) && !def.path.includes(':') && feature(def.feature).available && can(`${def.feature}.view`).allowed)
      .filter((def) => def.title.toLowerCase().includes(text))
      .forEach((def) => found.push({ id: `s-${def.id}`, group: 'Screens', label: def.title, hint: def.group, to: path(def.path.replace(/\/?\*$/, '')) }));

    reachableContexts(persona, organizations, institutions)
      .institutions.filter((candidate) => `${candidate.name} ${candidate.city}`.toLowerCase().includes(text))
      .slice(0, 5)
      .forEach((candidate) => found.push({ id: `i-${candidate.id}`, group: 'Institutions', label: candidate.name, hint: candidate.city, to: `/inst/${candidate.id}` }));

    if (inst && feature('students.directory').available && can('students.directory.view').allowed) {
      demoStudents
        .filter((student) => `${student.fullName} ${student.admissionNumber}`.toLowerCase().includes(text))
        .slice(0, 5)
        .forEach((student) => found.push({ id: `st-${student.id}`, group: 'Students', label: student.fullName, hint: student.admissionNumber, to: path(`students/${student.id}`) }));
    }

    const covered = scope === 'inst' && inst ? [inst.id] : institutions.filter((candidate) => candidate.orgId === org.id).map((candidate) => candidate.id);
    inbox
      .filter((item) => covered.includes(item.instId) && item.kind !== 'notification' && `${item.title} ${item.detail}`.toLowerCase().includes(text))
      .slice(0, 4)
      .forEach((item) => found.push({ id: `t-${item.id}`, group: 'Tasks and approvals', label: item.title, hint: item.status, to: `/inst/${item.instId}/inbox` }));
    return found.slice(0, 14);
  }, [query, scope, inst, org.id, feature, can, path, persona, organizations, institutions, inbox]);

  const close = () => {
    setQuery('');
    setActive(0);
    onClose();
  };
  const choose = (result: Result) => {
    close();
    navigate(result.to);
  };
  const current = Math.min(active, Math.max(0, results.length - 1));

  return (
    <Dialog open={open} onClose={close} title="Search" size="md" closeOnBackdrop>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="global-search" className="sr-only">
            Search screens, institutions, students and tasks
          </label>
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="global-search-results"
            aria-activedescendant={results.length > 0 ? `gs-${results[current].id}` : undefined}
            autoComplete="off"
            data-autofocus="true"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && results.length) {
                event.preventDefault();
                setActive((current + 1) % results.length);
              } else if (event.key === 'ArrowUp' && results.length) {
                event.preventDefault();
                setActive((current - 1 + results.length) % results.length);
              } else if (event.key === 'Enter' && results[current]) {
                event.preventDefault();
                choose(results[current]);
              }
            }}
            placeholder="Type a screen, student, institution or task"
            className="input pl-10"
          />
        </div>
        <div aria-live="polite" className="text-xs text-charcoal-500">
          {query.trim() === '' ? 'Start typing. Use the arrow keys and Enter.' : results.length === 0 ? 'No match. Only things you may open are searched.' : `${results.length} results`}
        </div>
        <ul id="global-search-results" role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <li key={result.id} id={`gs-${result.id}`} role="option" aria-selected={index === current}>
              <button type="button" onClick={() => choose(result)} onMouseEnter={() => setActive(index)} tabIndex={-1} className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm', index === current ? 'bg-primary-50' : 'hover:bg-warm-50')}>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-charcoal-900">{result.label}</span>
                  {result.hint && <span className="block truncate text-xs text-charcoal-600">{result.hint}</span>}
                </span>
                <span className="shrink-0 rounded bg-warm-100 px-2 py-0.5 text-xs text-charcoal-700">{result.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
