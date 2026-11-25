import { Suspense, useEffect } from 'react';
import { usePortal } from '../core/context/portalContext';
import type { RouteDef } from '../core/routing/registry';
import AccessDeniedPage from '../features/portal/pages/AccessDeniedPage';
import { Alert, EmptyState, PageSkeleton } from '../shared/ui/Feedback';

/** Screens that stay open when an institution is suspended or archived, so its administrators can see why and who to ask. */
const ALWAYS_OPEN = ['home', 'inbox', 'calendar', 'help', 'profile', 'institution'];

/**
 * Every screen goes through here. A screen opens only when its feature is available
 * (plan, parent policy, local switch, dependencies) and the person may view it.
 * This is for a clear experience. The server must repeat the same checks later.
 */
export default function RouteGate({ def }: { def: RouteDef }) {
  const portal = usePortal();
  const { feature, can, inst, org } = portal;
  const resolution = feature(def.feature);
  const access = can(`${def.feature}.view`);

  useEffect(() => {
    document.title = `${def.title} | ${inst?.shortName ?? org.name} | AURVED`;
  }, [def.title, inst, org]);

  if (!resolution.available) return <AccessDeniedPage reason={resolution.detail ?? 'This page is not available.'} code={resolution.reason} />;
  if (!access.allowed) return <AccessDeniedPage reason={access.detail} code={access.reason} />;

  const stopped = inst && (inst.status === 'suspended' || inst.status === 'archived') && !ALWAYS_OPEN.includes(def.feature.split('.')[0]);
  if (stopped) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <EmptyState asPageTitle title={`${inst.shortName} is ${inst.status}`} description={`Working screens are closed while an institution is ${inst.status}. Its records are kept. ${org.implicit ? '' : `Ask the administrators of ${org.name} to reactivate it.`}`} />
      </div>
    );
  }

  const blockedBy = def.requires?.(portal);
  if (blockedBy) return <AccessDeniedPage reason={blockedBy} code="not_applicable" />;

  const Page = def.component;
  // Old screens read one sample school. Say so when the person is somewhere else.
  const sample = def.legacy && inst && inst.id !== 'inst-sunrise';
  return (
    <>
      {sample && (
        <div className="px-4 pt-4 md:px-6 lg:px-8">
          <Alert tone="warning" title="Sample data">
            This screen still shows the sample records of Sunrise International School. It does not show records of {inst.name}.
          </Alert>
        </div>
      )}
      <Suspense fallback={<PageSkeleton />}>
        <Page />
      </Suspense>
    </>
  );
}
