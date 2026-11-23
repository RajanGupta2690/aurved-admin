import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Check, ChevronDown, Landmark, Plus } from 'lucide-react';
import { usePortal } from '../../core/context/portalContext';
import { reachableContexts } from '../../core/context/paths';
import { PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../core/org/types';
import Popover from '../ui/Popover';
import { cn } from '../ui/cn';

/** Header control for organization, institution and campus. The organization part is hidden for independent institutions. */
export default function ContextSwitcher() {
  const { org, inst, persona, organizations, institutions, campusId, setCampus } = usePortal();
  const location = useLocation();
  const [filter, setFilter] = useState('');

  const reachable = reachableContexts(persona, organizations, institutions);
  const visibleInstitutions = reachable.institutions.filter((candidate) => `${candidate.name} ${candidate.city}`.toLowerCase().includes(filter.trim().toLowerCase()));
  // Keep the same page when moving to another institution, for pages without an id in the address.
  const segment = location.pathname.split('/')[4] ?? '';
  const keep = location.pathname.startsWith('/inst/') ? segment : '';
  const activeCampuses = (inst?.campuses ?? []).filter((candidate) => (candidate.status ?? 'active') === 'active');
  const campus = activeCampuses.find((candidate) => candidate.id === campusId);
  const showOrg = !org.implicit;
  const label = inst ? inst.shortName : `${org.name}`;
  const single = reachable.institutions.length <= 1 && reachable.organizations.length === 0 && activeCampuses.length <= 1;

  if (single) {
    return (
      <div className="flex min-w-0 max-w-[8rem] items-center gap-2 text-sm font-medium text-charcoal-800 sm:max-w-xs" aria-label="Current institution">
        <Landmark size={18} className="text-primary-700" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
    );
  }

  return (
    <Popover
      label="Choose organization, institution and campus"
      panelClassName="w-[min(22rem,calc(100vw-2rem))] !p-0"
      trigger={(props) => (
        <button {...props} type="button" className="flex min-w-0 max-w-[7.5rem] items-center gap-1 rounded-xl border border-warm-300 bg-white px-2 py-2 text-left text-sm hover:bg-warm-50 sm:max-w-xs sm:gap-2 sm:px-3 md:max-w-sm">
          <Landmark size={18} className="shrink-0 text-primary-700" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-charcoal-900">{label}</span>
            <span className="block truncate text-xs text-charcoal-600">
              {showOrg ? `${org.name}` : inst ? inst.city : 'Organization overview'}
              {activeCampuses.length > 1 ? ` · ${campus ? campus.name : 'All campuses'}` : ''}
            </span>
          </span>
          <ChevronDown size={16} className="shrink-0 text-charcoal-500" aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-[70vh] overflow-y-auto">
          {reachable.organizations.length > 0 && (
            <section aria-label="Organizations" className="border-b border-warm-200 p-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">Organizations</p>
              {reachable.organizations.map((candidate) => (
                <Link key={candidate.id} to={`/org/${candidate.id}`} onClick={close} className={cn('flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-warm-50', !inst && candidate.id === org.id && 'bg-primary-50 font-semibold')}>
                  <Building2 size={16} className="text-charcoal-500" aria-hidden="true" />
                  <span className="flex-1 truncate">{candidate.name}</span>
                  {!inst && candidate.id === org.id && <Check size={16} className="text-primary-700" aria-label="Current" />}
                </Link>
              ))}
            </section>
          )}

          <section aria-label="Institutions" className="p-2">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">Institutions</p>
            {reachable.institutions.length > 6 && (
              <div className="px-2 pb-2">
                <label htmlFor="ctx-filter" className="sr-only">
                  Find an institution
                </label>
                <input id="ctx-filter" type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find an institution" className="input !py-1.5 text-sm" />
              </div>
            )}
            {visibleInstitutions.length === 0 && <p className="px-2 py-2 text-sm text-charcoal-500">No institution matches.</p>}
            {visibleInstitutions.map((candidate) => {
              const current = candidate.id === inst?.id;
              const parent = organizations.find((item) => item.id === candidate.orgId);
              return (
                <Link
                  key={candidate.id}
                  to={`/inst/${candidate.id}${keep ? `/${keep}` : ''}`}
                  onClick={close}
                  aria-current={current ? 'true' : undefined}
                  className={cn('flex items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-warm-50', current && 'bg-primary-50')}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate', current && 'font-semibold')}>{candidate.name}</span>
                    <span className="block truncate text-xs text-charcoal-600">
                      {PROFILE_LABEL[candidate.profile]}
                      {candidate.relationship ? ` · ${RELATIONSHIP_LABEL[candidate.relationship.type]}` : ''}
                      {parent && !parent.implicit ? ` · ${parent.name}` : ''}
                    </span>
                  </span>
                  {current && <Check size={16} className="mt-0.5 text-primary-700" aria-label="Current" />}
                </Link>
              );
            })}
          </section>

          <div className="border-t border-warm-200 p-2">
            <Link to="/setup/institution" onClick={close} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-primary-700 hover:bg-warm-50">
              <Plus size={16} aria-hidden="true" />
              Create an independent institution
            </Link>
          </div>

          {inst && activeCampuses.length > 1 && (
            <fieldset className="border-t border-warm-200 p-2">
              <legend className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">Campus</legend>
              {[{ id: 'all', name: 'All campuses' }, ...activeCampuses].map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-warm-50">
                  <input type="radio" name="campus" checked={campusId === item.id} onChange={() => setCampus(item.id)} className="accent-primary-700" />
                  {item.name}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      )}
    </Popover>
  );
}
