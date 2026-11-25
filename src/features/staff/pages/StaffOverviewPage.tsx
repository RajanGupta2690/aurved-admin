import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, GraduationCap, KeyRound, UserCheck, Users } from 'lucide-react';
import { snapshot } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import { formatDate } from '../../../core/org/rules';
import { isExited } from '../../../core/staff/model';
import { documentGaps, policyOf } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { MetricCard } from '../../../shared/ui/Charts';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

const UPDATED = 'Live, from this browser';

/** STF-01. What needs attention today. */
export default function StaffOverviewPage() {
  const { path } = usePortal();
  const { inst, members, state, nameOf } = useInstStaff();
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const current = members.filter((member) => !isExited(member.employment.status));
  const snap = snapshot();
  const probationEnding = current.filter((member) => {
    if (member.employment.status !== 'probation') return false;
    const end = new Date(`${member.employment.joinDate}T00:00:00Z`);
    end.setUTCMonth(end.getUTCMonth() + policyOf(snap, inst.id).probationMonths);
    return end.toISOString().slice(0, 10) <= new Date(Date.parse(today) + 60 * 86_400_000).toISOString().slice(0, 10);
  });
  const withGaps = current.filter((member) => documentGaps(snap, member).length > 0);
  const onLeave = current.filter((member) => member.employment.status === 'on_leave');
  const noBoss = current.filter((member) => !member.employment.reportsToId && member.employment.designationId !== current[0]?.employment.designationId);
  const expiring = current.flatMap((member) => member.documents.filter((doc) => doc.expires && doc.expires <= new Date(Date.parse(today) + 60 * 86_400_000).toISOString().slice(0, 10)).map((doc) => ({ member, doc })));
  const live = state.delegations.filter((item) => item.instId === inst.id && item.status === 'active' && item.from <= today && today <= item.to);
  const recent = state.events.filter((event) => event.instId === inst.id).slice(0, 6);

  return (
    <PageContainer>
      <PageHeader title="Staff overview" eyebrow="STF-01" description={`What needs attention at ${inst.shortName}.`} breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff overview' }]} />
      <StaffNav />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Current staff" value={String(current.length)} icon={<Users size={18} />} to={path('staff')} definition="People employed now. People who left are not counted." period="Now" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Teaching staff" value={String(current.filter((member) => member.employment.category === 'teaching').length)} icon={<GraduationCap size={18} />} definition="Current staff in teaching designations." period="Now" updated={UPDATED} coverage="This institution" />
        <MetricCard label="With sign-in account" value={String(current.filter((member) => member.accountId).length)} icon={<KeyRound size={18} />} to={path('staff-access')} definition="Current staff who can sign in." period="Now" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Need attention" value={String(withGaps.length + probationEnding.length + expiring.length)} icon={<AlertTriangle size={18} />} tone={withGaps.length + probationEnding.length + expiring.length > 0 ? 'alert' : 'default'} definition="Missing or unverified documents, probation ending within 60 days, and documents that expire within 60 days." period="Now" updated={UPDATED} coverage="This institution" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Documents" description="Required by the staff policy">
          {withGaps.length === 0 ? <p className="text-sm text-charcoal-700">Every current person has the required documents verified.</p> : (
            <ul className="divide-y divide-warm-200 text-sm">
              {withGaps.slice(0, 6).map((member) => (
                <li key={member.id} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <span>
                    <Link to={path(`staff/${member.id}`)} className="font-medium text-primary-700 hover:underline">{member.person.fullName}</Link>
                    <span className="block text-xs text-charcoal-600">{documentGaps(snap, member).join(', ')}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {withGaps.length > 6 && <p className="mt-2 text-xs text-charcoal-600">and {withGaps.length - 6} more.</p>}
          {expiring.length > 0 && <p className="mt-3 text-sm text-charcoal-800">{expiring.length} document{expiring.length === 1 ? '' : 's'} expire within 60 days ({expiring.slice(0, 3).map((item) => `${item.member.person.fullName}: ${item.doc.type}`).join('; ')}).</p>}
        </Card>
        <Card title="People">
          <ul className="space-y-2 text-sm text-charcoal-800">
            <li><UserCheck size={14} className="mr-2 inline text-primary-700" aria-hidden="true" />{probationEnding.length} on probation that ends within 60 days{probationEnding.length ? `: ${probationEnding.map((m) => m.person.fullName).join(', ')}` : ''}</li>
            <li><UserCheck size={14} className="mr-2 inline text-primary-700" aria-hidden="true" />{onLeave.length} on leave{onLeave.length ? `: ${onLeave.map((m) => m.person.fullName).join(', ')}` : ''}</li>
            <li><UserCheck size={14} className="mr-2 inline text-primary-700" aria-hidden="true" />{live.length} delegation{live.length === 1 ? '' : 's'} running{live.length ? `: ${live.map((d) => `${nameOf(d.fromId)} to ${nameOf(d.toId)}`).join('; ')}` : ''}</li>
            <li><UserCheck size={14} className="mr-2 inline text-primary-700" aria-hidden="true" />{noBoss.length} people with nobody to report to</li>
          </ul>
        </Card>
        <Card title="Recent activity" className="lg:col-span-2">
          {recent.length === 0 ? <p className="text-sm text-charcoal-600">Nothing yet.</p> : (
            <ul className="divide-y divide-warm-200 text-sm">
              {recent.map((event) => (
                <li key={event.id} className="py-2 first:pt-0 last:pb-0">
                  {event.summary}
                  <span className="block text-xs text-charcoal-600">{event.byName}, {formatDate(event.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
