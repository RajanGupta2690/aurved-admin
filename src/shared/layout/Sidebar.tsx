import { NavLink } from 'react-router-dom';
import { useStore } from '../../core/api/persistedStore';
import { inboxStore, pendingCount } from '../../core/api/inboxStore';
import { usePortal } from '../../core/context/portalContext';
import BrandLogo from '../components/BrandLogo';
import { cn } from '../ui/cn';
import { useCoveredInstitutionIds, useNavigation } from './hooks';

export default function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { org, inst, path, scope } = usePortal();
  const groups = useNavigation();
  const inbox = useStore(inboxStore);
  const pending = useCoveredInstitutionIds().reduce((sum, id) => sum + pendingCount(inbox, id), 0);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-warm-200 p-5">
        <div className="flex items-center gap-3">
          <BrandLogo size={44} decorative className="shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight text-charcoal-950">AURVED</p>
            <p className="truncate text-xs text-charcoal-600">{scope === 'org' ? 'Organization' : 'Institution portal'}</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-warm-200 bg-warm-50 p-3">
          <p className="truncate text-sm font-semibold text-charcoal-900" title={inst?.name ?? org.name}>
            {inst?.name ?? org.name}
          </p>
          <p className="truncate text-xs text-charcoal-600">{inst ? (org.implicit ? inst.city : org.name) : 'All institutions'}</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto p-4">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">{group}</p>
            <ul className="space-y-0.5">
              {items.map((def) => {
                const Icon = def.icon;
                const to = path(def.path.replace(/\/?\*$/, ''));
                return (
                  <li key={def.id}>
                    <NavLink to={to} end={def.path === ''} onClick={onNavigate} className={({ isActive }) => cn('sidebar-item', isActive && 'sidebar-item-active')}>
                      <Icon size={20} aria-hidden="true" />
                      <span className="flex-1">{def.title}</span>
                      {def.id === 'inbox' && pending > 0 && (
                        <span className="rounded-full bg-primary-700 px-2 py-0.5 text-xs font-semibold text-white">
                          <span className="sr-only">{pending} waiting: </span>
                          <span aria-hidden="true">{pending}</span>
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
