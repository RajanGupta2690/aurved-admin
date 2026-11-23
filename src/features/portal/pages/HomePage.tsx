import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import OrgDashboardPage from '../../organization/pages/OrgDashboardPage';
import { CalendarClock, CheckCircle2, Inbox, MapPin, ShieldCheck } from 'lucide-react';
import { inboxStore, pendingCount, unreadCount } from '../../../core/api/inboxStore';
import { calendarStore, EVENT_KIND_LABEL } from '../../../core/api/calendarStore';
import { useStore } from '../../../core/api/persistedStore';
import { usePortal } from '../../../core/context/portalContext';
import { allFeatureKeys } from '../../../core/features/registry';
import { resolveFeature } from '../../../core/features/resolve';
import { ORG_TYPE_LABEL, PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Institution } from '../../../core/org/types';
import { useCoveredInstitutionIds, useNavigation } from '../../../shared/layout/hooks';
import PageContainer from '../../../shared/layout/PageContainer';
import { StatusBadge } from '../../../shared/ui/Badge';
import { MetricCard } from '../../../shared/ui/Charts';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';

const UPDATED = 'Live, from this browser';

function featureCounts(institution: Institution, configs: ReturnType<typeof usePortal>['featureConfig']) {
  if (!configs) return { available: 0, total: 0 };
  let available = 0;
  let total = 0;
  allFeatureKeys().forEach((key) => {
    const result = resolveFeature(configs, institution.profile, key);
    if (result.reason === 'not_applicable') return;
    total += 1;
    if (result.available) available += 1;
  });
  return { available, total };
}

export default function HomePage() {
  const ctx = usePortal();
  const { scope, inst, org, institutions, path, persona, organizations } = ctx;
  const inbox = useStore(inboxStore);
  const events = useStore(calendarStore);
  const ids = useCoveredInstitutionIds();
  const navigation = useNavigation();

  const pending = ids.reduce((sum, id) => sum + pendingCount(inbox, id), 0);
  const unread = ids.reduce((sum, id) => sum + unreadCount(inbox, id), 0);
  const waiting = inbox.filter((item) => ids.includes(item.instId) && item.status === 'pending' && item.kind === 'approval').slice(0, 4);
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10));
  const upcoming = events.filter((event) => ids.includes(event.instId) && event.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const shortcuts = navigation.flatMap((entry) => entry.items).filter((def) => !['home', 'inbox', 'calendar', 'help'].includes(def.id));

  const counts = useMemo(() => featureCounts(inst ?? institutions[0], ctx.featureConfig), [inst, institutions, ctx.featureConfig]);

  if (scope === 'org') return <OrgDashboardPage />;

  const relationship = inst?.relationship;
  const parent = relationship ? institutions.find((candidate) => candidate.id === relationship.parentInstId) : undefined;

  return (
    <PageContainer>
      <PageHeader
        title={inst?.name ?? org.name}
        description={`${PROFILE_LABEL[inst!.profile]}${relationship ? `, ${RELATIONSHIP_LABEL[relationship.type].toLowerCase()} of ${parent?.name ?? 'the university'}` : ''}. ${inst!.city}.`}
        eyebrow="SH-13"
        actions={<StatusBadge status={inst!.status} />}
      />
      {!org.implicit && <p className="-mt-3 mb-5 text-sm text-charcoal-600">Part of {org.name} ({ORG_TYPE_LABEL[org.type].toLowerCase()}).</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Waiting for a decision" value={String(pending)} icon={<Inbox size={18} />} to={path('inbox')} tone={pending > 5 ? 'alert' : 'default'} definition="Approvals and tasks in this inbox that nobody has decided or finished." period="Now" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Unread notifications" value={String(unread)} definition="Notifications nobody has opened yet." period="Now" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Features available" value={`${counts.available} of ${counts.total}`} icon={<ShieldCheck size={18} />} hint="Counts what the plan, the parent organization and local switches allow." definition="Features of the portal that apply to this type of institution and are switched on, out of all that apply." period="Now" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Campuses" value={String(inst!.campuses.length)} icon={<MapPin size={18} />} definition="Campuses registered for this institution." period="Now" updated={UPDATED} coverage="This institution" />
      </div>

      {inst!.profile !== 'school' && (
        <Alert tone="info" title={`Academic modules for a ${PROFILE_LABEL[inst!.profile].toLowerCase()} are not available in this version`} className="mb-6">
          The menu, search, tasks, calendar and access rules work here. Student, exam and finance screens exist for schools only so far.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Needs a decision" description="Oldest first" className="lg:col-span-2">
          {waiting.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={32} />} title="Nothing is waiting" description="New requests appear here and in Tasks and approvals." />
          ) : (
            <ul className="divide-y divide-warm-200">
              {waiting.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal-900">{item.title}</p>
                    <p className="text-sm text-charcoal-600">{item.detail}</p>
                  </div>
                  <Link to={path('inbox')} className="shrink-0 text-sm font-medium text-primary-700 hover:underline">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Coming up" description="From the calendar">
          {upcoming.length === 0 ? (
            <p className="text-sm text-charcoal-600">No dates ahead.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <CalendarClock size={18} className="mt-0.5 text-primary-700" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-charcoal-900">{event.title}</p>
                    <p className="text-xs text-charcoal-600">
                      {event.date} · {EVENT_KIND_LABEL[event.kind]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to={path('calendar')} className="mt-4 inline-block text-sm font-medium text-primary-700 hover:underline">
            Open calendar
          </Link>
        </Card>
      </div>

      {shortcuts.length > 0 && (
        <section aria-labelledby="shortcuts-heading" className="mt-6">
          <h2 id="shortcuts-heading" className="mb-3 font-semibold text-charcoal-950">
            Your modules
          </h2>
          <p className="mb-3 text-sm text-charcoal-600">
            Only what {persona.name} may open here. {organizations.length > 1 ? 'Change the person from the account menu to compare.' : ''}
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {shortcuts.map((def) => {
              const Icon = def.icon;
              return (
                <li key={def.id}>
                  <Link to={path(def.path.replace(/\/?\*$/, ''))} className="card flex h-full items-center gap-3 !p-3 hover:border-primary-300">
                    <Icon size={20} className="shrink-0 text-primary-700" aria-hidden="true" />
                    <span className="text-sm font-medium text-charcoal-900">{def.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </PageContainer>
  );
}
