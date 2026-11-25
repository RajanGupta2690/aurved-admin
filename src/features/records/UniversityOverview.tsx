import ModuleDashboardPage from './ModuleDashboardPage';
import UniversityPanels from './UniversityPanels';

export default function UniversityOverview() {
  return (
    <ModuleDashboardPage moduleKey="univaffairs">
      <UniversityPanels />
    </ModuleDashboardPage>
  );
}
