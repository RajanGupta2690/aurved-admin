import { Link } from 'react-router-dom';
import { Bell, CalendarDays, ChevronDown, CircleHelp, Inbox, Menu, Search } from 'lucide-react';
import { worldStore } from '../../core/api/worldStore';
import { inboxStore, pendingCount } from '../../core/api/inboxStore';
import { useStore } from '../../core/api/persistedStore';
import { usePortal } from '../../core/context/portalContext';
import Popover from '../ui/Popover';
import { cn } from '../ui/cn';
import ContextSwitcher from './ContextSwitcher';
import ProfileMenu from './ProfileMenu';
import { useCoveredInstitutionIds, useUnreadCount } from './hooks';

interface HeaderProps {
  onMenu: () => void;
  onSearch: () => void;
  onNotifications: () => void;
}

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-700 px-1 text-[11px] font-semibold text-white">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
    </span>
  );
}

const iconButton = 'relative rounded-xl p-2 text-charcoal-700 hover:bg-warm-100';

export default function Header({ onMenu, onSearch, onNotifications }: HeaderProps) {
  const { path, sessionId, setSession, scope, inst } = usePortal();
  const world = useStore(worldStore);
  const inbox = useStore(inboxStore);
  const waiting = useCoveredInstitutionIds().reduce((sum, id) => sum + pendingCount(inbox, id), 0);
  const unread = useUnreadCount();
  const sessions = world.sessions.filter((item) => item.instId === inst?.id).sort((a, b) => b.start.localeCompare(a.start));
  const session = sessions.find((item) => item.id === sessionId) ?? sessions.find((item) => item.status === 'current') ?? sessions[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-1 border-b border-warm-200 bg-white px-2 sm:gap-2 md:gap-3 md:px-6">
      <button type="button" onClick={onMenu} aria-label="Open menu" className={cn(iconButton, 'lg:hidden')}>
        <Menu size={22} aria-hidden="true" />
      </button>

      <ContextSwitcher />

      <button
        type="button"
        onClick={onSearch}
        className="ml-auto flex items-center gap-2 rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm text-charcoal-600 hover:bg-warm-100 md:ml-4 md:w-72 lg:w-96"
      >
        <Search size={18} aria-hidden="true" />
        <span className="hidden flex-1 text-left md:inline">Search</span>
        <kbd className="hidden rounded border border-warm-300 bg-white px-1.5 text-xs text-charcoal-600 lg:inline">Ctrl K</kbd>
        <span className="sr-only md:hidden">Search</span>
      </button>

      {scope === 'inst' && session && (
        <Popover
          label="Choose academic session"
          align="right"
          className="hidden md:block"
          trigger={(props) => (
            <button {...props} type="button" className="flex items-center gap-2 rounded-xl border border-warm-300 bg-white px-3 py-2 text-left text-sm hover:bg-warm-50">
              <span>
                <span className="block text-xs text-charcoal-600">Academic year</span>
                <span className="block font-medium text-charcoal-900">{session.label}</span>
              </span>
              <ChevronDown size={16} className="text-charcoal-500" aria-hidden="true" />
            </button>
          )}
        >
          {(close) => (
            <fieldset className="p-1">
              <legend className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">Academic year</legend>
              {sessions.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-warm-50">
                  <input
                    type="radio"
                    name="session"
                    checked={item.id === session.id}
                    onChange={() => {
                      setSession(item.id);
                      close();
                    }}
                    className="accent-primary-700"
                  />
                  <span>{item.label}</span>
                  {item.status === 'current' && <span className="ml-auto rounded bg-success-50 px-1.5 text-xs text-success-700">Current</span>}
                  {item.status !== 'current' && <span className="ml-auto rounded bg-warm-100 px-1.5 text-xs text-charcoal-700">{item.status === 'planned' ? 'Planned' : 'Closed'}</span>}
                </label>
              ))}
            </fieldset>
          )}
        </Popover>
      )}

      <nav aria-label="Quick links" className="flex items-center">
        <Link to={path('calendar')} aria-label="Calendar" className={cn(iconButton, 'hidden md:block')}>
          <CalendarDays size={20} aria-hidden="true" />
        </Link>
        <Link to={path('inbox')} aria-label="Tasks and approvals" className={iconButton}>
          <Inbox size={20} aria-hidden="true" />
          <CountBadge count={waiting} label="waiting" />
        </Link>
        <button type="button" onClick={onNotifications} aria-label="Notifications" className={iconButton}>
          <Bell size={20} aria-hidden="true" />
          <CountBadge count={unread} label="unread" />
        </button>
        <Link to={path('help')} aria-label="Help" className={cn(iconButton, 'hidden md:block')}>
          <CircleHelp size={20} aria-hidden="true" />
        </Link>
      </nav>

      <ProfileMenu />
    </header>
  );
}
