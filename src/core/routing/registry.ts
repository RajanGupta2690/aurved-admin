import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import {
  BarChart3, BookMarked, BookOpen, Building2, Bus, Calendar, CalendarDays, CalendarRange, CircleHelp, ClipboardCheck, CreditCard, DollarSign, FileText,
  GraduationCap, History, Inbox, LayoutDashboard, Layers, Library, Link2, Handshake, MapPin, MessageSquare, Network, Package, ScrollText, School,
  Settings, Share2, UserPlus, Users, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PortalContextValue } from '../context/portalContext';
import { isExternal } from '../org/rules';

/**
 * One list of screens. The router, the sidebar, the breadcrumbs and the access checks all read it.
 * A screen is added here in the milestone that builds it. Planned screens live in docs/product/03-screen-register.md.
 */
export interface RouteDef {
  id: string;
  /** Id in the screen register. */
  screenId: string;
  /** Path below /inst/:instId or /org/:orgId. Empty string is the index page. */
  path: string;
  scope: 'inst' | 'org' | 'both';
  title: string;
  group: NavGroup;
  icon: LucideIcon;
  /** Feature that must be available. The permission checked is  feature + ".view". */
  feature: string;
  /** Shown in the sidebar. */
  nav: boolean;
  /** Old prototype screen. Replaced when its module is rebuilt. */
  legacy?: boolean;
  /** Extra rule for showing it in the menu. The page itself still opens by address and explains itself. */
  visible?: (portal: PortalContextValue) => boolean;
  component: LazyExoticComponent<ComponentType>;
}

export const NAV_GROUPS = ['Overview', 'Organization', 'People', 'Academics', 'Operations', 'Insights', 'Administration', 'Support'] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];

/** True when the page has something to show about data sharing: the institution, or any institution of the organization, runs independently. */
const hasIndependentChildren = (portal: PortalContextValue) =>
  portal.scope === 'inst' ? Boolean(portal.inst && isExternal(portal.inst)) : portal.institutions.some((candidate) => candidate.orgId === portal.org.id && isExternal(candidate));

const page = (loader: () => Promise<{ default: ComponentType }>) => lazy(loader);

export const ROUTES: RouteDef[] = [
  { id: 'home', screenId: 'SH-13', path: '', scope: 'both', title: 'Home', group: 'Overview', icon: LayoutDashboard, feature: 'home.overview', nav: true, component: page(() => import('../../features/portal/pages/HomePage')) },
  { id: 'inbox', screenId: 'SH-05', path: 'inbox', scope: 'both', title: 'Tasks and approvals', group: 'Overview', icon: Inbox, feature: 'inbox.tasks', nav: true, component: page(() => import('../../features/portal/pages/InboxPage')) },
  { id: 'calendar', screenId: 'SH-06', path: 'calendar', scope: 'both', title: 'Calendar', group: 'Overview', icon: CalendarDays, feature: 'calendar.events', nav: true, component: page(() => import('../../features/portal/pages/CalendarPage')) },

  { id: 'organization', screenId: 'ORG-02', path: 'organization', scope: 'org', title: 'Organization profile', group: 'Organization', icon: Building2, feature: 'org.profile', nav: true, component: page(() => import('../../features/organization/pages/OrganizationProfilePage')) },
  { id: 'institutions', screenId: 'ORG-03', path: 'institutions', scope: 'org', title: 'Institutions', group: 'Organization', icon: School, feature: 'org.institutions', nav: true, component: page(() => import('../../features/organization/pages/InstitutionDirectoryPage')) },
  { id: 'institution-new', screenId: 'ORG-05', path: 'institutions/new', scope: 'org', title: 'Add an institution', group: 'Organization', icon: School, feature: 'org.institutions', nav: false, component: page(() => import('../../features/organization/pages/AddInstitutionPage')) },
  { id: 'hierarchy', screenId: 'ORG-07', path: 'hierarchy', scope: 'org', title: 'Hierarchy', group: 'Organization', icon: Network, feature: 'org.hierarchy', nav: true, component: page(() => import('../../features/organization/pages/HierarchyPage')) },
  { id: 'relationships', screenId: 'ORG-08', path: 'relationships', scope: 'org', title: 'Relationships', group: 'Organization', icon: Handshake, feature: 'org.relationships', nav: true, component: page(() => import('../../features/organization/pages/RelationshipsPage')) },
  { id: 'policies', screenId: 'ORG-10', path: 'policies', scope: 'org', title: 'Governance policies', group: 'Organization', icon: ScrollText, feature: 'org.policies', nav: true, component: page(() => import('../../features/organization/pages/PoliciesPage')) },

  { id: 'admissions', screenId: 'OLD-02', path: 'admissions', scope: 'inst', title: 'Admissions', group: 'People', icon: UserPlus, feature: 'admissions.applications', nav: true, legacy: true, component: page(() => import('../../features/admission/pages/AdmissionsPage')) },
  { id: 'students', screenId: 'OLD-03', path: 'students', scope: 'inst', title: 'Students', group: 'People', icon: Users, feature: 'students.directory', nav: true, legacy: true, component: page(() => import('../../features/students/pages/StudentsListPage')) },
  { id: 'student-detail', screenId: 'OLD-04', path: 'students/:id', scope: 'inst', title: 'Student details', group: 'People', icon: Users, feature: 'students.profile', nav: false, legacy: true, component: page(() => import('../../features/students/pages/StudentDetailPage')) },
  { id: 'parents', screenId: 'OLD-05', path: 'parents', scope: 'inst', title: 'Parents', group: 'People', icon: UsersRound, feature: 'families.guardians', nav: true, legacy: true, component: page(() => import('../../features/parents/pages/ParentsPage')) },
  { id: 'staff', screenId: 'OLD-11', path: 'staff', scope: 'inst', title: 'Teachers and staff', group: 'People', icon: GraduationCap, feature: 'staff.directory', nav: true, legacy: true, component: page(() => import('../../features/staff/pages/StaffPage')) },

  { id: 'academics', screenId: 'OLD-06', path: 'academics/*', scope: 'inst', title: 'Academics', group: 'Academics', icon: BookOpen, feature: 'academics.structure', nav: true, legacy: true, component: page(() => import('../../features/academics/pages/AcademicsPage')) },
  { id: 'homework', screenId: 'OLD-12', path: 'homework', scope: 'inst', title: 'Homework', group: 'Academics', icon: BookMarked, feature: 'academics.homework', nav: true, legacy: true, component: page(() => import('../../features/homework/pages/HomeworkPage')) },
  { id: 'attendance', screenId: 'OLD-07', path: 'attendance', scope: 'inst', title: 'Attendance', group: 'Academics', icon: ClipboardCheck, feature: 'attendance.students', nav: true, legacy: true, component: page(() => import('../../features/attendance/pages/AttendancePage')) },
  { id: 'timetable', screenId: 'OLD-08', path: 'timetable', scope: 'inst', title: 'Timetable', group: 'Academics', icon: Calendar, feature: 'timetable.classes', nav: true, legacy: true, component: page(() => import('../../features/timetable/pages/TimetablePage')) },
  { id: 'examinations', screenId: 'OLD-09', path: 'examinations', scope: 'inst', title: 'Examinations', group: 'Academics', icon: FileText, feature: 'examinations.exams', nav: true, legacy: true, component: page(() => import('../../features/examination/pages/ExaminationsPage')) },

  { id: 'fees', screenId: 'OLD-10', path: 'fees', scope: 'inst', title: 'Fees and accounts', group: 'Operations', icon: DollarSign, feature: 'finance.fees', nav: true, legacy: true, component: page(() => import('../../features/fees/pages/FeesPage')) },
  { id: 'communication', screenId: 'OLD-13', path: 'communication', scope: 'inst', title: 'Communication', group: 'Operations', icon: MessageSquare, feature: 'communication.notices', nav: true, legacy: true, component: page(() => import('../../features/communication/pages/CommunicationPage')) },
  { id: 'transport', screenId: 'OLD-14', path: 'transport', scope: 'inst', title: 'Transport', group: 'Operations', icon: Bus, feature: 'transport.fleet', nav: true, legacy: true, component: page(() => import('../../features/transport/pages/TransportPage')) },
  { id: 'library', screenId: 'OLD-15', path: 'library', scope: 'inst', title: 'Library', group: 'Operations', icon: Library, feature: 'library.catalog', nav: true, legacy: true, component: page(() => import('../../features/library/pages/LibraryPage')) },
  { id: 'inventory', screenId: 'OLD-16', path: 'inventory', scope: 'inst', title: 'Inventory', group: 'Operations', icon: Package, feature: 'inventory.stock', nav: true, legacy: true, component: page(() => import('../../features/inventory/pages/InventoryPage')) },

  { id: 'reports', screenId: 'OLD-17', path: 'reports', scope: 'inst', title: 'Reports', group: 'Insights', icon: BarChart3, feature: 'reports.catalog', nav: true, legacy: true, component: page(() => import('../../features/reports/pages/ReportsPage')) },
  { id: 'institution', screenId: 'ORG-04', path: 'institution', scope: 'inst', title: 'Institution profile', group: 'Administration', icon: School, feature: 'institution.profile', nav: true, component: page(() => import('../../features/institution/pages/InstitutionProfilePage')) },
  { id: 'campuses', screenId: 'ORG-06', path: 'campuses', scope: 'both', title: 'Campuses', group: 'Administration', icon: MapPin, feature: 'institution.campuses', nav: true, component: page(() => import('../../features/institution/pages/CampusesPage')) },
  { id: 'sessions', screenId: 'ORG-13', path: 'sessions', scope: 'both', title: 'Academic sessions', group: 'Administration', icon: CalendarRange, feature: 'institution.sessions', nav: true, component: page(() => import('../../features/institution/pages/SessionsPage')) },
  { id: 'curriculum', screenId: 'ORG-14', path: 'curriculum', scope: 'inst', title: 'Curriculum', group: 'Administration', icon: Layers, feature: 'institution.curriculum', nav: true, component: page(() => import('../../features/institution/pages/CurriculumPage')) },
  { id: 'link-requests', screenId: 'ORG-09', path: 'link-requests', scope: 'both', title: 'Linking requests', group: 'Administration', icon: Link2, feature: 'institution.links', nav: true, component: page(() => import('../../features/organization/pages/LinkRequestsPage')) },
  { id: 'link-request', screenId: 'ORG-09', path: 'link-requests/:id', scope: 'both', title: 'Linking request', group: 'Administration', icon: Link2, feature: 'institution.links', nav: false, component: page(() => import('../../features/organization/pages/LinkRequestPage')) },
  { id: 'data-sharing', screenId: 'ORG-11', path: 'data-sharing', scope: 'both', title: 'Data sharing', group: 'Administration', icon: Share2, feature: 'institution.sharing', nav: true, visible: hasIndependentChildren, component: page(() => import('../../features/organization/pages/DataSharingPage')) },
  { id: 'billing', screenId: 'ORG-12', path: 'billing', scope: 'both', title: 'Subscription and billing', group: 'Administration', icon: CreditCard, feature: 'institution.billing', nav: true, component: page(() => import('../../features/organization/pages/BillingPage')) },
  { id: 'history', screenId: 'ORG-16', path: 'history', scope: 'both', title: 'Change history', group: 'Administration', icon: History, feature: 'institution.history', nav: true, component: page(() => import('../../features/organization/pages/HistoryPage')) },
  { id: 'settings', screenId: 'OLD-18', path: 'settings', scope: 'inst', title: 'Settings', group: 'Administration', icon: Settings, feature: 'settings.general', nav: true, legacy: true, component: page(() => import('../../features/settings/pages/SettingsPage')) },

  { id: 'help', screenId: 'SH-07', path: 'help', scope: 'both', title: 'Help centre', group: 'Support', icon: CircleHelp, feature: 'help.center', nav: true, component: page(() => import('../../features/portal/pages/HelpPage')) },
  { id: 'profile', screenId: 'SH-08', path: 'profile', scope: 'both', title: 'Profile and preferences', group: 'Support', icon: Users, feature: 'profile.account', nav: false, component: page(() => import('../../features/portal/pages/ProfilePage')) },
];

/** Top-level paths of the old flat URLs. They redirect into the current institution. */
export const LEGACY_PATHS = ['admissions', 'students', 'students/:id', 'parents', 'staff', 'academics/*', 'homework', 'attendance', 'timetable', 'examinations', 'fees', 'communication', 'transport', 'library', 'inventory', 'reports', 'settings'];
