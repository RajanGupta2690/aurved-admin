import { Banknote, FileText, Landmark, PiggyBank, Scale } from 'lucide-react';
import { useStore } from '../../core/api/persistedStore';
import { recordsStore } from '../../core/api/stores';
import { usePortal } from '../../core/context/portalContext';
import { formatNumber } from '../../core/i18n/format';
import { MetricCard } from '../../shared/ui/Charts';
import { Card } from '../../shared/ui/Layout';

const UPDATED = 'Live, from this browser';
const money = (value: number) => `${value < 0 ? '-' : ''}${formatNumber(Math.abs(value))}`;

/**
 * Cash, revenue, receivables, advances and liabilities, each counted on its own.
 * Money received is not revenue, and a deposit that must be given back is not revenue either.
 */
export default function LedgerPanel() {
  const { inst } = usePortal();
  const state = useStore(recordsStore);
  const scope = inst?.id ?? '';
  const mine = (key: string) => (state[key] ?? []).filter((row) => row.scopeId === scope && !row.archived);
  const fees = mine('fees');
  const invoices = mine('invoices');
  const payments = mine('payments');
  const expenses = mine('expenses');
  const budgets = mine('budgets');

  const accountOf = (feeHead: unknown) => String(fees.find((fee) => fee.data.name === feeHead)?.data.account ?? 'tuition_revenue');
  const live = invoices.filter((row) => row.status !== 'cancelled' && row.status !== 'waived');
  const paidOn = (number: unknown) => payments.filter((row) => row.data.kind === 'fee' && row.data.invoice === number).reduce((sum, row) => sum + Number(row.data.amount), 0);
  const sum = (rows: Array<{ data: Record<string, unknown> }>, key = 'amount') => rows.reduce((total, row) => total + Number(row.data[key] ?? 0), 0);

  const revenue = sum(live.filter((row) => accountOf(row.data.feeHead) !== 'refundable_deposit'));
  const cash = sum(payments.filter((row) => row.data.kind !== 'refund')) - sum(payments.filter((row) => row.data.kind === 'refund'));
  const receivables = live.reduce((total, row) => total + Math.max(0, Number(row.data.amount) - paidOn(row.data.number)), 0);
  const advances = sum(payments.filter((row) => row.data.kind === 'advance'));
  const depositsHeld = live.filter((row) => accountOf(row.data.feeHead) === 'refundable_deposit').reduce((total, row) => total + paidOn(row.data.number), 0);
  const payables = sum(expenses.filter((row) => row.status === 'approved'));
  const liabilities = advances + depositsHeld + payables;

  const categories = Array.from(new Set([...budgets.map((row) => String(row.data.category)), ...expenses.map((row) => String(row.data.category))]));
  const spent = (category: string) => sum(expenses.filter((row) => row.data.category === category && (row.status === 'approved' || row.status === 'paid')));

  return (
    <div className="mb-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Cash received" value={money(cash)} icon={<Banknote size={18} />} definition="Money actually received: fee payments and advances, less refunds. Not the same as revenue." period="To date" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Revenue billed" value={money(revenue)} icon={<FileText size={18} />} definition="Fees invoiced, apart from refundable deposits, and not counting cancelled or waived invoices." period="To date" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Receivables" value={money(receivables)} icon={<Scale size={18} />} tone={receivables > 0 ? 'alert' : 'default'} definition="Invoiced and not yet paid. It is owed to the institution." period="To date" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Advances held" value={money(advances)} icon={<PiggyBank size={18} />} definition="Money received before an invoice. It is owed back as service until it is applied." period="To date" updated={UPDATED} coverage="This institution" />
        <MetricCard label="Liabilities" value={money(liabilities)} icon={<Landmark size={18} />} definition="Advances, refundable deposits held, and approved bills not yet paid." period="To date" updated={UPDATED} coverage="This institution" />
      </div>
      <Card title="Budget against spending" description="Approved and paid expenses by category. Amounts in rupees.">
        {categories.length === 0 ? (
          <p className="text-sm text-charcoal-600">No budget or expense yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Budget against spending</caption>
              <thead>
                <tr className="border-b border-warm-200 text-left text-charcoal-700">
                  <th scope="col" className="py-2 pr-4 font-semibold">Category</th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">Budget</th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">Spent or approved</th>
                  <th scope="col" className="py-2 text-right font-semibold">Left</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const allocated = sum(budgets.filter((row) => row.data.category === category), 'allocated');
                  const used = spent(category);
                  return (
                    <tr key={category} className="border-b border-warm-100 last:border-0">
                      <th scope="row" className="py-2 pr-4 text-left font-medium capitalize text-charcoal-900">{category}</th>
                      <td className="py-2 pr-4 text-right">{allocated ? money(allocated) : 'No budget'}</td>
                      <td className="py-2 pr-4 text-right">{money(used)}</td>
                      <td className={`py-2 text-right font-medium ${allocated && used > allocated ? 'text-danger-700' : 'text-charcoal-900'}`}>{allocated ? money(allocated - used) : '-'}{allocated && used > allocated ? ' (over)' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
