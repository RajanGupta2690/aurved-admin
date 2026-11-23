import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { EmptyState } from '../../../shared/ui/Feedback';
import { Badge } from '../../../shared/ui/Badge';

const CODE_LABEL: Record<string, string> = {
  not_applicable: 'Not for this type of institution',
  not_in_plan: 'Not in the plan',
  locked_by_policy: 'Locked by the parent organization',
  disabled_locally: 'Switched off here',
  dependency_missing: 'Needs another feature',
  no_membership: 'No role in this place',
  external_institution: 'Runs independently',
  no_grant: 'Your role does not include it',
  explicit_deny: 'Denied on purpose',
  unknown_feature: 'Unknown feature',
};

interface AccessDeniedPageProps {
  reason: string;
  code?: string;
}

/** 403. Always says why. The same rule will be enforced by the server later, hiding the link is not security. */
export default function AccessDeniedPage({ reason, code }: AccessDeniedPageProps) {
  const { persona, path, org, inst, roles, personas, place } = usePortal();

  const admins = personas.filter((person) =>
    person.memberships.some((membership) => {
      const covers = membership.scope.type === 'org' ? membership.scope.id === place.orgId : membership.scope.id === place.instId;
      return covers && membership.roleIds.some((id) => roles.find((role) => role.id === id)?.permissions.includes('*'));
    }),
  );

  return (
    <div className="mx-auto max-w-xl py-10">
      <EmptyState
        icon={<ShieldAlert size={36} />}
        title="You cannot open this page"
        description={reason}
        action={
          <Link to={path()} className="btn-primary">
            Go to Home
          </Link>
        }
      />
      <dl className="mt-6 space-y-2 rounded-xl border border-warm-200 bg-white p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-charcoal-500">Signed in as</dt>
          <dd className="font-medium text-charcoal-900">
            {persona.name}, {persona.title}
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-charcoal-500">Place</dt>
          <dd className="font-medium text-charcoal-900">{inst?.name ?? org.name}</dd>
        </div>
        {code && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-charcoal-500">Reason</dt>
            <dd>
              <Badge tone="warning">{CODE_LABEL[code] ?? code}</Badge>
            </dd>
          </div>
        )}
        {admins.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-charcoal-500">Ask</dt>
            <dd className="font-medium text-charcoal-900">{admins.map((person) => person.name).join(', ')}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
