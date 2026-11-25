import { useState } from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { PLAN_NAMES } from '../../../core/org/model';
import type { Invoice } from '../../../core/org/model';
import { requestUpgrade } from '../../../core/org/ops';
import { formatDate } from '../../../core/org/rules';
import PageContainer from '../../../shared/layout/PageContainer';
import { StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextareaField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, DescriptionList, PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useWorld } from '../hooks';
import { currentRegion, formatMoney } from '../../../core/i18n/format';

const money = formatMoney;

/** ORG-12. Read only. The only action is asking for a different plan. */
export default function BillingPage() {
  const { org, inst, scope, can, path } = usePortal();
  const world = useWorld();
  const apply = useApply();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [today] = useState(() => Date.now());

  const billing = world.billing[org.id];
  const title = 'Subscription and billing';
  const crumbs = [{ label: inst?.shortName ?? org.name, to: path() }, { label: title }];

  // Inside an institution of a group, the group pays. Only the independent institution sees its own bill.
  if (scope === 'inst' && !org.implicit) {
    return (
      <PageContainer>
        <PageHeader title={title} eyebrow="ORG-12" breadcrumbs={crumbs} />
        <EmptyState title={`${org.name} manages the subscription`} description={`${inst?.shortName} is covered by the plan of ${org.name}. Ask its administrators about plan, seats and invoices.`} />
      </PageContainer>
    );
  }
  if (!billing) {
    return (
      <PageContainer>
        <PageHeader title={title} eyebrow="ORG-12" breadcrumbs={crumbs} />
        <EmptyState title="No subscription recorded" description="Billing details have not been set up for this account." />
      </PageContainer>
    );
  }

  const daysLeft = Math.ceil((new Date(`${billing.renewsOn}T00:00:00`).getTime() - today) / 86_400_000);
  const used = Math.round((billing.studentsUsed / billing.studentSeats) * 100);
  const canAsk = can('institution.billing.create').allowed;

  const submit = () => {
    const result = apply((snap, now, actor) => requestUpgrade(snap, org.id, plan, reason, actor, now), 'Request recorded.');
    if (result.ok) {
      setOpen(false);
      setPlan('');
      setReason('');
      setError('');
    } else setError(result.error);
  };

  const columns: Column<Invoice>[] = [
    { key: 'id', header: 'Invoice', sortable: true, accessor: (row) => row.id },
    { key: 'date', header: 'Date', sortable: true, accessor: (row) => row.date, cell: (row) => formatDate(row.date) },
    { key: 'amount', header: 'Amount', sortable: true, align: 'right', accessor: (row) => row.amount, cell: (row) => money(row.amount, billing.currency) },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={title}
        eyebrow="ORG-12"
        description="Your plan, usage and invoices. This page is read only. Plans are changed by AURVED after a request."
        breadcrumbs={crumbs}
        actions={
          <Button variant="primary" icon={<ArrowUpCircle size={16} aria-hidden="true" />} onClick={() => { setError(''); setOpen(true); }} disabled={!canAsk} title={canAsk ? undefined : 'Your role cannot request a plan change'}>
            Request a plan change
          </Button>
        }
      />
      <Alert tone="info" className="mb-6">
        Demo figures. A plan change request is stored in this browser only.
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Plan">
          <DescriptionList
            columns={1}
            items={[
              { label: 'Plan', value: billing.plan },
              { label: 'Billed', value: billing.cycle === 'annual' ? 'Every year' : 'Every month' },
              { label: 'Renews on', value: `${formatDate(billing.renewsOn)} (${daysLeft >= 0 ? `in ${daysLeft} days` : 'date has passed'})` },
              { label: 'Institutions included', value: billing.institutionsIncluded },
            ]}
          />
        </Card>
        <Card title="Student seats" className="lg:col-span-2">
          <p className="text-2xl font-bold text-charcoal-950">
            {billing.studentsUsed.toLocaleString(currentRegion().locale)} <span className="text-base font-normal text-charcoal-600">of {billing.studentSeats.toLocaleString(currentRegion().locale)} seats used</span>
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-warm-200" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={100} aria-label="Student seats used">
            <div className={used >= 90 ? 'h-full bg-danger-600' : 'h-full bg-primary-700'} style={{ width: `${Math.min(used, 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-charcoal-600">{used}% used. {used >= 90 ? 'Close to the limit. Consider a larger plan.' : 'There is room to grow.'}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Invoices" padded={false} className="lg:col-span-2">
          <DataTable caption="Invoices" rows={billing.invoices} columns={columns} rowKey={(row) => row.id} initialSort={{ key: 'date', direction: 'desc' }} emptyTitle="No invoices yet" />
        </Card>
        <Card title="Plan change requests">
          {billing.upgradeRequests.length === 0 ? (
            <p className="text-sm text-charcoal-600">No requests.</p>
          ) : (
            <ul className="divide-y divide-warm-200">
              {billing.upgradeRequests.map((request) => (
                <li key={request.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-charcoal-900">To {request.toPlan}</p>
                  <p className="text-xs text-charcoal-600">
                    {request.byName}, {formatDate(request.at)}
                  </p>
                  <p className="mt-1 text-sm text-charcoal-700">{request.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Request a plan change"
        description={`You are on ${billing.plan}. AURVED confirms the change and any difference in price.`}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>
              Send request
            </Button>
          </>
        }
      >
        <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <SelectField label="New plan" required placeholder="Choose a plan" options={PLAN_NAMES.filter((name) => name !== billing.plan).map((name) => ({ value: name, label: name }))} value={plan} onChange={setPlan} />
          <TextareaField label="Why do you need it?" required rows={3} value={reason} onChange={setReason} />
        </form>
      </Dialog>
    </PageContainer>
  );
}
