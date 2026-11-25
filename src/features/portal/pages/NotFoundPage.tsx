import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../../../shared/ui/Feedback';
import BrandLogo from '../../../shared/components/BrandLogo';

/** 404. Inside the shell it keeps the menu, standalone it is a full page. */
export default function NotFoundPage({ standalone = false }: { standalone?: boolean }) {
  const body = (
    <EmptyState
      icon={<Compass size={36} />}
      title="This page does not exist"
      asPageTitle
      description="The address may be old or mistyped. Go back to the start and use the menu."
      action={
        <Link to="/" className="btn-primary">
          Go to start
        </Link>
      }
    />
  );
  if (!standalone) return <div className="mx-auto max-w-xl py-12">{body}</div>;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-app p-6">
      <BrandLogo size={56} decorative />
      <div className="w-full max-w-xl">{body}</div>
    </main>
  );
}
