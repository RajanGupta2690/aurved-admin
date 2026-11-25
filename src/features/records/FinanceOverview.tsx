import LedgerPanel from './LedgerPanel';
import ModuleDashboardPage from './ModuleDashboardPage';

export default function FinanceOverview() {
  return (
    <ModuleDashboardPage moduleKey="finance">
      <LedgerPanel />
    </ModuleDashboardPage>
  );
}
