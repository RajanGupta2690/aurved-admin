import { Link } from 'react-router-dom';
import { ChevronDown, CircleHelp, Settings2 } from 'lucide-react';
import { usePortal } from '../../core/context/portalContext';
import Popover from '../ui/Popover';
import { cn } from '../ui/cn';

function initials(name: string): string {
  return name
    .replace(/^(Dr|Prof)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Account menu. Also holds the demo switch that lets you act as another person. */
export default function ProfileMenu() {
  const { persona, personas, switchPersona, path } = usePortal();

  return (
    <Popover
      label="Account menu"
      align="right"
      panelClassName="w-[min(20rem,calc(100vw-2rem))] !p-0"
      trigger={(props) => (
        <button {...props} type="button" className="flex items-center gap-2 rounded-xl p-1 hover:bg-warm-100 md:pr-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-800" aria-hidden="true">
            {initials(persona.name)}
          </span>
          <span className="hidden text-left md:block">
            <span className="block text-sm font-medium leading-tight text-charcoal-900">{persona.name}</span>
            <span className="block max-w-[10rem] truncate text-xs text-charcoal-600">{persona.title}</span>
          </span>
          <span className="sr-only md:hidden">{persona.name}</span>
          <ChevronDown size={16} className="hidden text-charcoal-500 md:block" aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-[75vh] overflow-y-auto">
          <div className="border-b border-warm-200 p-3">
            <p className="font-semibold text-charcoal-950">{persona.name}</p>
            <p className="text-sm text-charcoal-600">{persona.title}</p>
            <p className="text-xs text-charcoal-500">{persona.email}</p>
          </div>
          <div className="border-b border-warm-200 p-1">
            <Link to={path('profile')} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-warm-50">
              <Settings2 size={16} aria-hidden="true" />
              Profile and preferences
            </Link>
            <Link to={path('help')} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-warm-50">
              <CircleHelp size={16} aria-hidden="true" />
              Help centre
            </Link>
          </div>
          <fieldset className="p-2">
            <legend className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-primary-800">Demo: act as</legend>
            <p className="px-2 pb-2 text-xs text-charcoal-600">Pick a person to see how the menu and pages change. Nothing is signed in for real.</p>
            {personas.map((person) => {
              const active = person.id === persona.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    switchPersona(person.id);
                    close();
                  }}
                  className={cn('flex w-full flex-col rounded-lg px-3 py-1.5 text-left hover:bg-warm-50', active && 'bg-primary-50')}
                >
                  <span className={cn('text-sm', active && 'font-semibold')}>{person.name}</span>
                  <span className="text-xs text-charcoal-600">{person.title}</span>
                </button>
              );
            })}
          </fieldset>
        </div>
      )}
    </Popover>
  );
}
