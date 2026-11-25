import { Link } from 'react-router-dom';
import { Building2, GraduationCap, Inbox, Link2, Plus, School } from 'lucide-react';
import { inboxStore, pendingCount } from '../../../core/api/inboxStore';
import { useStore } from '../../../core/api/persistedStore';
import { usePortal } from '../../../core/context/portalContext';
import { OPEN_LINK_STATUSES } from '../../../core/org/model';
import { formatDate, isExternal, shareLevelFor } from '../../../core/org/rules';
import { ORG_TYPE_LABEL, PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Institution } from '../../../core/org/types';
import { DEMO_STATS } from '../../../data/demo/orgData';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import { BarChart, DonutChart, MetricCard } from '../../../shared/ui/Charts';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, HERO_BUTTON, HERO_BUTTON_QUIET, PageHero } from '../../../shared/ui/Layout';
import { useOrgData, useWorld } from '../hooks';
import { currentRegion } from '../../../core/i18n/format';

const UPDATED = 'Live, from this browser';

/** ORG-01. Home of a group, trust or university administrator. */
export default function OrgDashboardPage() {
  const { org, path, can, persona } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const inbox = useStore(inboxStore);

  const members = institutions.filter((inst) => inst.orgId === org.id);
  const own = members.filter((inst) => !isExternal(inst));
  const waiting = own.reduce((sum, inst) => sum + pendingCount(inbox, inst.id), 0);
  const openLinks = world.links.filter((link) => link.parentOrgId === org.id && OPEN_LINK_STATUSES.includes(link.status));
  const pending = members.filter((inst) => inst.status === 'pending');
  const billing = world.billing[org.id];
  const history = world.history.filter((item) => item.orgId === org.id).slice(0, 5);

  // A number is shown only when the institution is run by the organization or has agreed to share it.
  const visibleStudents = members.filter((inst) => shareLevelFor(world, inst, 'enrolment') !== 'none');
  const hidden = members.filter((inst) => shareLevelFor(world, inst, 'enrolment') === 'none');
  const totalStudents = visibleStudents.reduce((sum, inst) => sum + (DEMO_STATS[inst.id]?.students ?? 0), 0);

  const byProfile = (Object.keys(PROFILE_LABEL) as Array<keyof typeof PROFILE_LABEL>)
    .map((profile) => ({ label: PROFILE_LABEL[profile], value: members.filter((inst) => inst.profile === profile).length }))
    .filter((item) => item.value > 0);

  const columns: Column<Institution>[] = [
    {
      key: 'name',
      header: 'Institution',
      sortable: true,
      accessor: (row) => row.name,
      cell: (row) =>
        isExternal(row) ? (
          <span className="font-medium text-charcoal-900">{row.name}</span>
        ) : (
          <Link to={`/inst/${row.id}`} className="font-medium text-primary-700 hover:underline">
            {row.name}
          </Link>
        ),
    },
    { key: 'profile', header: 'Type', sortable: true, accessor: (row) => PROFILE_LABEL[row.profile] },
    {
      key: 'relationship',
      header: 'Relationship',
      sortable: true,
      accessor: (row) => (row.relationship ? RELATIONSHIP_LABEL[row.relationship.type] : 'Member'),
      cell: (row) => (
        <span className="inline-flex flex-wrap items-center gap-2">
          {row.relationship ? RELATIONSHIP_LABEL[row.relationship.type] : 'Member'}
          {isExternal(row) && <Badge tone="info">Runs independently</Badge>}
        </span>
      ),
    },
    {
      key: 'students',
      header: 'Students (demo)',
      align: 'right',
      sortable: true,
      sortValue: (row) => (shareLevelFor(world, row, 'enrolment') === 'none' ? -1 : DEMO_STATS[row.id]?.students ?? 0),
      accessor: (row) => (shareLevelFor(world, row, 'enrolment') === 'none' ? 'Not shared' : DEMO_STATS[row.id]?.students ?? 0),
      cell: (row) => (shareLevelFor(world, row, 'enrolment') === 'none' ? <span className="text-charcoal-600">Not shared</span> : (DEMO_STATS[row.id]?.students ?? 0).toLocaleString(currentRegion().locale)),
    },
    { key: 'waiting', header: 'Waiting', align: 'right', sortable: true, accessor: (row) => (isExternal(row) ? '' : pendingCount(inbox, row.id)) },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <PageContainer>
      <PageHero
        eyebrow="ORG-01"
        greeting={`Welcome back, ${persona.name}`}
        title={org.name}
        description={`${ORG_TYPE_LABEL[org.type]}${org.governance ? `, ${org.governance} governance` : ''}. ${members.length} institutions.`}
        actions={
          <>
            {can('org.institutions.create').allowed && (
              <Link to={path('institutions/new')} className={HERO_BUTTON}>
                <Plus size={16} aria-hidden="true" />
                Add institution
              </Link>
            )}
            <Link to={path('institutions')} className={HERO_BUTTON_QUIET}>
              <Building2 size={16} aria-hidden="true" />
              All institutions
            </Link>
          </>
        }
      />

      {pending.length > 0 && (
        <Alert tone="warning" title={`${pending.length} ${pending.length === 1 ? 'institution waits' : 'institutions wait'} for approval`} className="mb-6">
          <Link to={path('institutions')} className="font-medium underline">
            Open the directory
          </Link>{' '}
          to approve {pending.map((inst) => inst.shortName).join(', ')}.
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Institutions" value={String(members.length)} icon={<Building2 size={18} />} accent="blue" to={path('institutions')} hint={`${members.filter((inst) => inst.status === 'active').length} active`} definition="Institutions that belong to this organization, of any status." period="Now" updated={UPDATED} coverage="Whole organization" />
        <MetricCard
          label="Students"
          value={totalStudents.toLocaleString(currentRegion().locale)}
          icon={<GraduationCap size={18} />}
          accent="green"
          hint={hidden.length > 0 ? `Not counted: ${hidden.length} independent ${hidden.length === 1 ? 'institution has' : 'institutions have'} not shared enrolment` : 'All institutions included'}
          definition="Students of institutions the organization runs, plus those that agreed to share enrolment. Demo figures."
          period="Now"
          updated={UPDATED}
          coverage={`${visibleStudents.length} of ${members.length} institutions`}
        />
        <MetricCard label="Waiting for a decision" value={String(waiting)} icon={<Inbox size={18} />} accent="purple" to={path('inbox')} tone={waiting > 5 ? 'alert' : 'default'} definition="Approvals and tasks that nobody has decided or finished, in institutions the organization runs." period="Now" updated={UPDATED} coverage={`${own.length} institutions`} />
        <MetricCard label="Open linking requests" value={String(openLinks.length)} icon={<Link2 size={18} />} accent="orange" to={path('link-requests')} tone={openLinks.length > 0 ? 'alert' : 'default'} definition="Requests to bring an institution into this organization that are not finished." period="Now" updated={UPDATED} coverage="Whole organization" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Institutions by type" className="lg:col-span-1">
          {byProfile.length === 0 ? <EmptyState icon={<School size={32} />} title="No institutions yet" /> : <DonutChart data={byProfile} ariaLabel="Institutions by type" centerLabel="Institutions" />}
        </Card>
        <Card title="Students by institution" description="Demo figures. Independent institutions appear only when they share enrolment." className="lg:col-span-2">
          {visibleStudents.length === 0 ? (
            <EmptyState title="Nothing to show" description="No institution has shared enrolment yet." />
          ) : (
            <BarChart data={visibleStudents.map((inst) => ({ label: inst.shortName, value: DEMO_STATS[inst.id]?.students ?? 0 }))} ariaLabel="Students by institution" format={(value) => value.toLocaleString(currentRegion().locale)} />
          )}
          {hidden.length > 0 && (
            <p className="mt-3 text-sm text-charcoal-600">
              Not shared: {hidden.map((inst) => inst.shortName).join(', ')}.{' '}
              <Link to={path('data-sharing')} className="font-medium text-primary-700 hover:underline">
                See data sharing
              </Link>
            </p>
          )}
        </Card>
      </div>

      <Card title="Institutions" description="Open an institution that the organization runs. Independent ones are managed by their own administrators." padded={false} className="mb-6">
        <DataTable caption="Institutions of this organization" rows={members} columns={columns} rowKey={(row) => row.id} searchText={(row) => `${row.name} ${row.city} ${PROFILE_LABEL[row.profile]}`} searchPlaceholder="Search institutions" initialSort={{ key: 'name', direction: 'asc' }} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Recent changes" description="Who changed what" className="lg:col-span-2" actions={<Link to={path('history')} className="text-sm font-medium text-primary-700 hover:underline">Open history</Link>}>
          {history.length === 0 ? (
            <p className="text-sm text-charcoal-600">Nothing has changed yet.</p>
          ) : (
            <ul className="divide-y divide-warm-200">
              {history.map((item) => (
                <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="text-sm text-charcoal-900">{item.summary}</p>
                  <p className="text-xs text-charcoal-600">
                    {item.byName} · {formatDate(item.at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Subscription" actions={<Link to={path('billing')} className="text-sm font-medium text-primary-700 hover:underline">Details</Link>}>
          {billing ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-charcoal-600">Plan</dt>
                <dd className="font-medium text-charcoal-900">{billing.plan}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-charcoal-600">Renews on</dt>
                <dd className="font-medium text-charcoal-900">{formatDate(billing.renewsOn)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-charcoal-600">Student seats used</dt>
                <dd className="font-medium text-charcoal-900">
                  {billing.studentsUsed.toLocaleString(currentRegion().locale)} of {billing.studentSeats.toLocaleString(currentRegion().locale)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-charcoal-600">No subscription is recorded.</p>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
