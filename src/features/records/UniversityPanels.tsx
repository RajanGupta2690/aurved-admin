import { useStore } from '../../core/api/persistedStore';
import { recordsStore } from '../../core/api/stores';
import { usePortal } from '../../core/context/portalContext';
import { SHARE_LEVEL_LABEL } from '../../core/org/model';
import { isExternal, shareLevelFor } from '../../core/org/rules';
import { RELATIONSHIP_LABEL } from '../../core/org/types';
import { DEMO_STATS } from '../../data/demo/orgData';
import { Badge } from '../../shared/ui/Badge';
import { BarChart } from '../../shared/ui/Charts';
import { Card } from '../../shared/ui/Layout';
import { useOrgData, useWorld } from '../organization/hooks';
import { currentRegion } from '../../core/i18n/format';

/**
 * SP-U-02 (student registry), SP-U-03 (exam comparison) and SP-U-06 (compliance).
 * Every number follows the data sharing agreements: an independent college shows only what it agreed to share.
 */
export default function UniversityPanels() {
  const { org } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const state = useStore(recordsStore);
  const colleges = institutions.filter((inst) => inst.orgId === org.id && inst.profile !== 'university');
  const programmes = (id: string) => world.curricula.find((item) => item.instId === id)?.programmes.filter((p) => p.status === 'active').length ?? 0;
  const results = (state.resultapproval ?? []).filter((row) => row.scopeId === org.id && !row.archived);
  const inspections = (state.collegeinspections ?? []).filter((row) => row.scopeId === org.id && !row.archived);

  const comparison = colleges
    .map((inst) => {
      const mine = results.filter((row) => row.data.college === inst.id && (row.status === 'approved' || row.status === 'published'));
      const level = shareLevelFor(world, inst, 'results');
      const latest = mine[mine.length - 1];
      return { inst, level, percent: latest ? Number(latest.data.passPercent) : null };
    });
  const visible = comparison.filter((item) => item.level !== 'none' && item.percent !== null);
  const hidden = comparison.filter((item) => item.level === 'none');

  return (
    <div className="mb-6 grid gap-6 lg:grid-cols-2">
      <Card title="Student registry" description="SP-U-02. Students by college. Independent colleges appear only when they share enrolment." padded={false} className="lg:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Student registry by college</caption>
            <thead>
              <tr className="border-b border-warm-200 bg-warm-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-charcoal-800">College</th>
                <th scope="col" className="px-3 py-3 font-semibold text-charcoal-800">Relationship</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold text-charcoal-800">Students (demo)</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold text-charcoal-800">Programmes</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((inst) => {
                const level = shareLevelFor(world, inst, 'enrolment');
                return (
                  <tr key={inst.id} className="border-b border-warm-100 last:border-0">
                    <th scope="row" className="px-4 py-2 text-left font-medium text-charcoal-900">{inst.shortName}</th>
                    <td className="px-3 py-2">{RELATIONSHIP_LABEL[inst.relationship?.type ?? 'member']}{isExternal(inst) && <Badge tone="info" className="ml-2">Independent</Badge>}</td>
                    <td className="px-3 py-2 text-right">{level === 'none' ? <span className="text-charcoal-600">Not shared</span> : (DEMO_STATS[inst.id]?.students ?? 0).toLocaleString(currentRegion().locale)}</td>
                    <td className="px-3 py-2 text-right">{level === 'none' ? <span className="text-charcoal-600">Not shared</span> : programmes(inst.id)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Pass percentage by college" description="SP-U-03. From results that are approved or published.">
        {visible.length === 0 ? <p className="text-sm text-charcoal-600">No approved results yet.</p> : <BarChart data={visible.map((item) => ({ label: item.inst.shortName, value: item.percent ?? 0 }))} ariaLabel="Pass percentage by college" format={(value) => `${value}%`} />}
        {hidden.length > 0 && <p className="mt-3 text-sm text-charcoal-600">Not shared: {hidden.map((item) => item.inst.shortName).join(', ')}.</p>}
      </Card>

      <Card title="Compliance" description="SP-U-06. Inspection status and compliance documents.">
        <ul className="divide-y divide-warm-200 text-sm">
          {colleges.map((inst) => {
            const latest = inspections.filter((row) => row.data.college === inst.id).sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)))[0];
            const docs = shareLevelFor(world, inst, 'compliance');
            return (
              <li key={inst.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <span className="font-medium text-charcoal-900">{inst.shortName}</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={latest ? (latest.status === 'granted' ? 'success' : latest.status === 'refused' ? 'danger' : 'warning') : 'neutral'}>{latest ? `Inspection: ${latest.status}` : 'Not inspected'}</Badge>
                  <Badge tone={docs === 'none' ? 'neutral' : 'info'}>Documents: {SHARE_LEVEL_LABEL[docs].toLowerCase()}</Badge>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
