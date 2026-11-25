import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useStore } from '../../core/api/persistedStore';
import { recordsStore } from '../../core/api/stores';
import { usePortal } from '../../core/context/portalContext';
import { countByStatus, featureKeyOf, isOverdue } from '../../core/records/ops';
import type { CollectionDef, ModuleGroup } from '../../core/records/types';
import PageContainer from '../../shared/layout/PageContainer';
import { Badge } from '../../shared/ui/Badge';
import { EmptyState } from '../../shared/ui/Feedback';
import { Card, PageHeader } from '../../shared/ui/Layout';
import { useModule, useScopeId } from './hooks';

const TONE = { success: 'success', warning: 'warning', danger: 'danger', info: 'info', neutral: 'neutral', brand: 'brand' } as const;

/** Home of a module: one card for each kind of record the person may open, with counts and what is late. */
export default function ModuleDashboardPage({ moduleKey, children }: { moduleKey: string; children?: ReactNode }) {
  const module = useModule(moduleKey);
  if (!module) return <EmptyState title="Not found" />;
  return <Dashboard module={module}>{children}</Dashboard>;
}

function Dashboard({ module, children }: { module: ModuleGroup; children?: ReactNode }) {
  const { can, feature, path, inst, org } = usePortal();
  const scopeId = useScopeId(module);
  const state = useStore(recordsStore);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const shown = module.collections.filter((def) => feature(featureKeyOf(def)).available && can(`${featureKeyOf(def)}.view`).allowed);
  const rowsOf = (def: CollectionDef) => (state[def.key] ?? []).filter((row) => row.scopeId === scopeId && !row.archived);
  const late = shown.flatMap((def) => rowsOf(def).filter((row) => isOverdue(def, row, today)).map((row) => ({ def, row })));
  const open = shown.flatMap((def) => rowsOf(def).filter((row) => def.statuses?.find((item) => item.value === row.status)?.tone === 'warning' || def.statuses?.find((item) => item.value === row.status)?.tone === 'danger').map((row) => ({ def, row })));

  return (
    <PageContainer>
      <PageHeader title={module.label} eyebrow="Module" description={module.description} breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: module.label }]} />
      {children}
      {shown.length === 0 ? (
        <EmptyState title="Nothing you can open here" description="Your role does not include any part of this module, or its features are switched off." />
      ) : (
        <>
          {late.length > 0 && (
            <Card title="Late" description="Past their date and not finished." className="mb-6">
              <ul className="divide-y divide-warm-200 text-sm">
                {late.slice(0, 6).map(({ def, row }) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                    <span>
                      <AlertTriangle size={14} className="mr-2 inline text-danger-700" aria-hidden="true" />
                      <span className="font-medium text-charcoal-900">{String(row.data[def.titleField] ?? def.singular)}</span> <span className="text-charcoal-600">in {def.title.toLowerCase()}, due {String(row.data[def.dueField!])}</span>
                    </span>
                    <Link to={path(`${module.key}/${def.key}`)} className="font-medium text-primary-700 hover:underline">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((def) => {
              const rows = rowsOf(def);
              const counts = countByStatus(def, rows).filter((item) => item.count > 0);
              return (
                <li key={def.key}>
                  <Link to={path(`${module.key}/${def.key}`)} className="card flex h-full flex-col gap-3 hover:border-primary-300" aria-label={`${def.title}: ${rows.length} records`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-charcoal-950">{def.title}</h2>
                        <p className="mt-1 text-sm text-charcoal-600">{def.description}</p>
                      </div>
                      <ArrowRight size={18} className="mt-1 shrink-0 text-primary-700" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-bold text-charcoal-950">
                      {rows.length} <span className="text-sm font-normal text-charcoal-600">{rows.length === 1 ? def.singular.toLowerCase() : `${def.singular.toLowerCase()}s`}</span>
                    </p>
                    {counts.length > 0 && (
                      <p className="flex flex-wrap gap-1.5">
                        {counts.map((item) => (
                          <Badge key={item.value} tone={TONE[def.statuses!.find((status) => status.value === item.value)!.tone]}>
                            {item.count} {item.label.toLowerCase()}
                          </Badge>
                        ))}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {open.length > 0 && <p className="mt-6 text-sm text-charcoal-600">{open.length} records are waiting for a step or need attention.</p>}
        </>
      )}
    </PageContainer>
  );
}
