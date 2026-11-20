import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../shared/layouts/MainLayout';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import StudentsListPage from '../features/students/pages/StudentsListPage';
import StudentDetailPage from '../features/students/pages/StudentDetailPage';
import AdmissionsPage from '../features/admission/pages/AdmissionsPage';
import AttendancePage from '../features/attendance/pages/AttendancePage';
import FeesPage from '../features/fees/pages/FeesPage';
import ExaminationsPage from '../features/examination/pages/ExaminationsPage';
import ParentsPage from '../features/parents/pages/ParentsPage';
import StaffPage from '../features/staff/pages/StaffPage';
import HomeworkPage from '../features/homework/pages/HomeworkPage';
import CommunicationPage from '../features/communication/pages/CommunicationPage';
import TimetablePage from '../features/timetable/pages/TimetablePage';
import LibraryPage from '../features/library/pages/LibraryPage';
import TransportPage from '../features/transport/pages/TransportPage';
import InventoryPage from '../features/inventory/pages/InventoryPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import SettingsPage from '../features/settings/pages/SettingsPage';
import AcademicsPage from '../features/academics/pages/AcademicsPage';
import PlaceholderPage from '../shared/components/PlaceholderPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'admissions',
        element: <AdmissionsPage />,
      },
      {
        path: 'students',
        element: <StudentsListPage />,
      },
      {
        path: 'students/:id',
        element: <StudentDetailPage />,
      },
      {
        path: 'parents',
        element: <ParentsPage />,
      },
      {
        path: 'academics/*',
        element: <AcademicsPage />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'timetable',
        element: <TimetablePage />,
      },
      {
        path: 'examinations',
        element: <ExaminationsPage />,
      },
      {
        path: 'fees',
        element: <FeesPage />,
      },
      {
        path: 'staff',
        element: <StaffPage />,
      },
      {
        path: 'homework',
        element: <HomeworkPage />,
      },
      {
        path: 'communication',
        element: <CommunicationPage />,
      },
      {
        path: 'transport',
        element: <TransportPage />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);
