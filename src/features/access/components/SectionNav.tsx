import { NavLink } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { cn } from '../../../shared/ui/cn';

/** Links between the pages of one topic, shown above the page. The current page is marked for screen readers. */
export default function SectionNav({ label, items }: { label: string; items: Array<{ path: string; label: string; feature: string }> }) {
  const { path, feature, can } = usePortal();
  const shown = items.filter((item) => feature(item.feature).available && can(`${item.feature}.view`).allowed);
  if (shown.length < 2) return null;
  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-2">
      {shown.map((item) => (
        <NavLink
          key={item.path}
          to={path(item.path)}
          end
          className={({ isActive }) => cn('rounded-full border px-3 py-1.5 text-sm font-medium', isActive ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-warm-300 bg-white text-charcoal-700 hover:bg-warm-50')}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
