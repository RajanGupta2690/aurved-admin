import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { LEGACY_PATHS, ROUTES } from '../core/routing/registry';
import type { RouteDef } from '../core/routing/registry';
import PortalProvider from '../core/context/PortalProvider';
import Shell from '../shared/layout/Shell';
import RouteGate from './RouteGate';
import { LegacyRedirect, RootRedirect } from './redirects';
import ErrorPage from '../features/portal/pages/ErrorPage';
import NotFoundPage from '../features/portal/pages/NotFoundPage';

/** Routes are built from the registry, so a screen cannot exist without its feature and permission. */
function children(scope: 'inst' | 'org'): RouteObject[] {
  const defs = ROUTES.filter((def: RouteDef) => def.scope === scope || def.scope === 'both');
  const mapped: RouteObject[] = defs.map((def) =>
    def.path === '' ? { index: true, element: <RouteGate def={def} /> } : { path: def.path, element: <RouteGate def={def} /> },
  );
  mapped.push({ path: '*', element: <NotFoundPage /> });
  return mapped;
}

export const router = createBrowserRouter(
  [
    { path: '/', element: <RootRedirect />, errorElement: <ErrorPage /> },
    {
      path: '/inst/:instId',
      element: (
        <PortalProvider scope="inst">
          <Shell />
        </PortalProvider>
      ),
      errorElement: <ErrorPage />,
      children: children('inst'),
    },
    {
      path: '/org/:orgId',
      element: (
        <PortalProvider scope="org">
          <Shell />
        </PortalProvider>
      ),
      errorElement: <ErrorPage />,
      children: children('org'),
    },
    {
      path: '/setup/institution',
      lazy: async () => ({ Component: (await import('../features/organization/pages/SetupInstitutionPage')).default }),
      errorElement: <ErrorPage />,
    },
    ...LEGACY_PATHS.map((path): RouteObject => ({ path, element: <LegacyRedirect />, errorElement: <ErrorPage /> })),
    { path: '*', element: <NotFoundPage standalone /> },
  ],
  { basename: '/aurved-admin' },
);
