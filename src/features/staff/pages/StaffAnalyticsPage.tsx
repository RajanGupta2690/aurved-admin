import { useState } from 'react';
import { usePortal } from '../../../core/context/portalContext';
import { staffAnalytics } from '../../../core/staff/analytics';
import PageContainer from '../../../shared/layout/PageContainer';
import { BarChart, DonutChart, MetricCard } from '../../../shared/ui/Charts';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

const UPDATED = 'Live, from this browser';

/** STF-28 */
export default function StaffAnalyticsPage() {
  const { path } = usePortal();
  const { inst, state } = useInstStaff();
  const [year] = useState(() => new Date().getFullYear());
  const a = staffAnalytics(state, [inst.id], year);
  return (
    <PageContainer>
      <PageHeader title="Staff analytics" eyebrow="STF-28" description={`Headcount, structure, workload and attrition at ${inst.shortName}.`} breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff analytics' }]} />
      <StaffNav />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Headcount" value={String(a.headcount)} hint={`${a.teaching} teaching, ${a.nonTeaching} non-teaching`} definition="People employed now." period="Now" updated={UPDATED} coverage="This institution" />
        <MetricCard label={`Joined in ${year}`} value={String(a.joinedThisYear)} definition="People whose joining date is in this calendar year, including those who have left." period={String(year)} updated={UPDATED} coverage="This institution" />
        <MetricCard label={`Attrition in ${year}`} value={`${a.attritionPercent}%`} hint={`${a.leftThisYear} left`} definition="People who left this year divided by current staff plus those who left." period={String(year)} updated={UPDATED} coverage="This institution" />
        <MetricCard label="Average weekly periods" value={String(a.averageLoad)} hint={`${a.unassignedTeachers} teachers without an assignment`} definition="Periods per week across teaching staff in the current session." period="Current session" updated={UPDATED} coverage="This institution" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="By department">{a.byDepartment.length ? <BarChart data={a.byDepartment} ariaLabel="Staff by department" /> : <p className="text-sm text-charcoal-600">No data.</p>}</Card>
        <Card title="By designation">{a.byDesignation.length ? <BarChart data={a.byDesignation.slice(0, 8)} ariaLabel="Staff by designation" /> : <p className="text-sm text-charcoal-600">No data.</p>}</Card>
        <Card title="By employment type">{a.byType.length ? <DonutChart data={a.byType} ariaLabel="Staff by employment type" centerLabel="Staff" /> : <p className="text-sm text-charcoal-600">No data.</p>}</Card>
        <Card title="By status (everyone on record)">{a.byStatus.length ? <DonutChart data={a.byStatus} ariaLabel="Staff by status" centerLabel="Records" /> : <p className="text-sm text-charcoal-600">No data.</p>}</Card>
        <Card title="Heaviest teaching loads" description="Periods per week, current session" className="lg:col-span-2">{a.heaviest.length ? <BarChart data={a.heaviest} ariaLabel="Heaviest teaching loads" /> : <p className="text-sm text-charcoal-600">No assignments yet.</p>}</Card>
      </div>
    </PageContainer>
  );
}
