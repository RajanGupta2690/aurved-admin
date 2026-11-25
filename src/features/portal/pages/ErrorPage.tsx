import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { ErrorState } from '../../../shared/ui/Feedback';
import BrandLogo from '../../../shared/components/BrandLogo';

/** Shown when a page crashes or a file fails to load. The details go to the console, not to the screen. */
export default function ErrorPage() {
  const error = useRouteError();
  useEffect(() => {
    console.error('Portal error:', error);
    // A file that no longer exists after a new release: one fresh reload fixes it.
    const message = error instanceof Error ? error.message : String(error);
    if (/dynamically imported module|importing a module script failed|failed to fetch/i.test(message)) {
      (window as unknown as { __aurvedReload?: () => boolean }).__aurvedReload?.();
    }
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-app p-6">
      <BrandLogo size={56} decorative />
      <div className="w-full max-w-xl">
        <ErrorState
          title="This page could not be shown"
          description="Nothing you entered was lost on the server, because nothing is saved there yet. Reload the page. If it keeps happening, tell your administrator."
          onRetry={() => window.location.reload()}
        />
        <p className="mt-4 text-center text-sm">
          <a href={import.meta.env.BASE_URL} className="text-primary-700 hover:underline">
            Go to start
          </a>
        </p>
      </div>
    </main>
  );
}
