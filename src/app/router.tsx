import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../shared/layouts/MainLayout';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import StudentsListPage from '../features/students/pages/StudentsListPage';
import StudentDetailPage from '../features/students/pages/StudentDetailPage';
import AdmissionsPage from '../features/admission/pages/AdmissionsPage';
import AttendancePage from '../features/attendance/pages/AttendancePage';
import FeesPage from '../features/fees/pages/FeesPage';
import ExaminationsPage from '../features/examination/pages/ExaminationsPage';
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
        element: <PlaceholderPage title="Parents" description="Parent management coming soon" />,
      },
      {
        path: 'academics/*',
        element: <PlaceholderPage title="Academic Management" description="Academic configuration coming soon" />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'timetable',
        element: <PlaceholderPage title="Timetable" description="Timetable management coming soon" />,
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
        element: <PlaceholderPage title="Teachers & Staff" description="Staff management coming soon" />,
      },
      {
        path: 'homework',
        element: <PlaceholderPage title="Homework" description="Homework management coming soon" />,
      },
      {
        path: 'communication',
        element: <PlaceholderPage title="Communication" description="Communication module coming soon" />,
      },
      {
        path: 'transport',
        element: <PlaceholderPage title="Transport" description="Transport management coming soon" />,
      },
      {
        path: 'library',
        element: <PlaceholderPage title="Library" description="Library management coming soon" />,
      },
      {
        path: 'inventory',
        element: <PlaceholderPage title="Inventory" description="Inventory management coming soon" />,
      },
      {
        path: 'reports',
        element: <PlaceholderPage title="Reports & Analytics" description="Reports module coming soon" />,
      },
      {
        path: 'settings',
        element: <PlaceholderPage title="Settings" description="Settings module coming soon" />,
      },
    ],
  },
]);
