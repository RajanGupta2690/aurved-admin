import { createElement, lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import {
  BarChart3, BookMarked, BookOpen, Building2, Bus, Calendar, CalendarDays, CalendarRange, CircleHelp, ClipboardCheck, CreditCard, DollarSign, FileText,
  GraduationCap, History, Inbox, LayoutDashboard, Layers, Library, Link2, Handshake, MapPin, MessageSquare, Network, Package, ScrollText, School,
  Settings, Share2, UserPlus, Users, UsersRound, Boxes, ClipboardList, KeyRound, ListChecks, SearchCheck, SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PortalContextValue } from '../context/portalContext';
import { isExternal } from '../org/rules';
import { RECORD_MODULES } from '../records/registry';

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
  /** A reason the screen cannot be used here even by someone allowed, or null. Shown on the access page. */
  requires?: (portal: PortalContextValue) => string | null;
  component: LazyExoticComponent<ComponentType>;
}

export const NAV_GROUPS = ['Overview', 'Organization', 'People', 'Academics', 'Operations', 'Insights', 'Administration', 'Access', 'Support'] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];

/** True when the page has something to show about data sharing: the institution, or any institution of the organization, runs independently. */
const hasIndependentChildren = (portal: PortalContextValue) =>
  portal.scope === 'inst' ? Boolean(portal.inst && isExternal(portal.inst)) : portal.institutions.some((candidate) => candidate.orgId === portal.org.id && isExternal(candidate));

const page = (loader: () => Promise<{ default: ComponentType }>) => lazy(loader);

const MODULE_ICONS: Record<string, LucideIcon> = {
  admissions: UserPlus, wellbeing: UsersRound, academics: BookOpen, attendance: ClipboardCheck, timetable: Calendar, examinations: FileText, schoolops: ClipboardList, communication: MessageSquare,
  library: Library, transport: Bus, inventory: Package, quality: ScrollText, programmes: BookMarked, academicrecords: GraduationCap, facultywork: Users, examcontrol: FileText, research: SearchCheck,
  careers: Handshake, alumni: UsersRound, international: Share2, finance: DollarSign, hr: UsersRound, facilities: MapPin, hostel: School, events: CalendarDays, procurement: Package, aid: DollarSign,
  univaffairs: Building2, services: ListChecks, privacy: KeyRound, integrations: Link2,
};

/** One overview and one list screen for every module and collection built from records. */
function recordRoutes(): RouteDef[] {
  return RECORD_MODULES.flatMap((module) => {
    const custom = module.key === 'finance' ? () => import('../../features/records/FinanceOverview') : module.key === 'univaffairs' ? () => import('../../features/records/UniversityOverview') : null;
    const dashboard: RouteDef = {
      id: module.key,
      screenId: `MOD-${module.key}`,
      path: module.key,
      scope: module.scope,
      title: module.label,
      group: module.nav as NavGroup,
      icon: MODULE_ICONS[module.key] ?? ListChecks,
      feature: `${module.key}.overview`,
      nav: true,
      requires: module.orgTypes ? (portal) => (portal.scope === 'org' && module.orgTypes!.includes(portal.org.type) ? null : 'This is only for a university.') : undefined,
      visible: module.orgTypes ? (portal) => portal.scope === 'org' && module.orgTypes!.includes(portal.org.type) : undefined,
      component: custom
        ? lazy(custom)
        : lazy(async () => {
            const loaded = await import('../../features/records/ModuleDashboardPage');
            return { default: () => createElement(loaded.default, { moduleKey: module.key }) };
          }),
    };
    const lists: RouteDef[] = module.collections.map((def) => ({
      id: `${module.key}-${def.key}`,
      screenId: def.screenId,
      path: `${module.key}/${def.key}`,
      scope: module.scope,
      title: def.title,
      group: module.nav as NavGroup,
      icon: MODULE_ICONS[module.key] ?? ListChecks,
      feature: `${module.key}.${def.key}`,
      nav: false,
      requires: dashboard.requires,
      component: lazy(async () => {
        const loaded = await import('../../features/records/CollectionPage');
        return { default: () => createElement(loaded.default, { moduleKey: module.key, collectionKey: def.key }) };
      }),
    }));
    return [dashboard, ...lists];
  });
}

const STATIC_ROUTES: RouteDef[] = [
  { id: 'home', screenId: 'SH-13', path: '', scope: 'both', title: 'Home', group: 'Overview', icon: LayoutDashboard, feature: 'home.overview', nav: true, component: page(() => import('../../features/portal/pages/HomePage')) },
  { id: 'inbox', screenId: 'SH-05', path: 'inbox', scope: 'both', title: 'Tasks and approvals', group: 'Overview', icon: Inbox, feature: 'inbox.tasks', nav: true, component: page(() => import('../../features/portal/pages/InboxPage')) },
  { id: 'calendar', screenId: 'SH-06', path: 'calendar', scope: 'both', title: 'Calendar', group: 'Overview', icon: CalendarDays, feature: 'calendar.events', nav: true, component: page(() => import('../../features/portal/pages/CalendarPage')) },

  { id: 'organization', screenId: 'ORG-02', path: 'organization', scope: 'org', title: 'Organization profile', group: 'Organization', icon: Building2, feature: 'org.profile', nav: true, component: page(() => import('../../features/organization/pages/OrganizationProfilePage')) },
  { id: 'institutions', screenId: 'ORG-03', path: 'institutions', scope: 'org', title: 'Institutions', group: 'Organization', icon: School, feature: 'org.institutions', nav: true, component: page(() => import('../../features/organization/pages/InstitutionDirectoryPage')) },
  { id: 'institution-new', screenId: 'ORG-05', path: 'institutions/new', scope: 'org', title: 'Add an institution', group: 'Organization', icon: School, feature: 'org.institutions', nav: false, component: page(() => import('../../features/organization/pages/AddInstitutionPage')) },
  { id: 'hierarchy', screenId: 'ORG-07', path: 'hierarchy', scope: 'org', title: 'Hierarchy', group: 'Organization', icon: Network, feature: 'org.hierarchy', nav: true, component: page(() => import('../../features/organization/pages/HierarchyPage')) },
  { id: 'relationships', screenId: 'ORG-08', path: 'relationships', scope: 'org', title: 'Relationships', group: 'Organization', icon: Handshake, feature: 'org.relationships', nav: true, component: page(() => import('../../features/organization/pages/RelationshipsPage')) },
  { id: 'feature-policy', screenId: 'ACC-02', path: 'feature-policy', scope: 'org', title: 'Feature policy', group: 'Organization', icon: SlidersHorizontal, feature: 'org.featurepolicy', nav: true, component: page(() => import('../../features/access/pages/FeaturePolicyPage')) },
  { id: 'policies', screenId: 'ORG-10', path: 'policies', scope: 'org', title: 'Governance policies', group: 'Organization', icon: ScrollText, feature: 'org.policies', nav: true, component: page(() => import('../../features/organization/pages/PoliciesPage')) },

  { id: 'students', screenId: 'OLD-03', path: 'students', scope: 'inst', title: 'Students', group: 'People', icon: Users, feature: 'students.directory', nav: true, legacy: true, component: page(() => import('../../features/students/pages/StudentsListPage')) },
  { id: 'student-detail', screenId: 'OLD-04', path: 'students/:id', scope: 'inst', title: 'Student details', group: 'People', icon: Users, feature: 'students.profile', nav: false, legacy: true, component: page(() => import('../../features/students/pages/StudentDetailPage')) },
  { id: 'parents', screenId: 'OLD-05', path: 'parents', scope: 'inst', title: 'Parents', group: 'People', icon: UsersRound, feature: 'families.guardians', nav: true, legacy: true, component: page(() => import('../../features/parents/pages/ParentsPage')) },
  { id: 'staff-overview', screenId: 'STF-01', path: 'staff-overview', scope: 'inst', title: 'Staff overview', group: 'People', icon: UsersRound, feature: 'staff.directory', nav: true, component: page(() => import('../../features/staff/pages/StaffOverviewPage')) },
  { id: 'staff', screenId: 'STF-02', path: 'staff', scope: 'inst', title: 'Staff', group: 'People', icon: GraduationCap, feature: 'staff.directory', nav: true, component: page(() => import('../../features/staff/pages/StaffDirectoryPage')) },
  { id: 'staff-new', screenId: 'STF-05', path: 'staff/new', scope: 'inst', title: 'Add staff', group: 'People', icon: GraduationCap, feature: 'staff.directory', nav: false, component: page(() => import('../../features/staff/pages/AddStaffPage')) },
  { id: 'staff-profile', screenId: 'STF-06', path: 'staff/:id', scope: 'inst', title: 'Staff profile', group: 'People', icon: GraduationCap, feature: 'staff.profile', nav: false, component: page(() => import('../../features/staff/pages/StaffProfilePage')) },
  { id: 'staff-structure', screenId: 'STF-10', path: 'staff-structure', scope: 'inst', title: 'Designations and departments', group: 'People', icon: Network, feature: 'staff.structure', nav: false, component: page(() => import('../../features/staff/pages/StaffStructurePage')) },
  { id: 'staff-assignments', screenId: 'STF-14', path: 'staff-assignments', scope: 'inst', title: 'Teaching assignments', group: 'People', icon: BookOpen, feature: 'staff.assignments', nav: false, component: page(() => import('../../features/staff/pages/StaffAssignmentsPage')) },
  { id: 'staff-duties', screenId: 'STF-17', path: 'staff-duties', scope: 'inst', title: 'Additional duties', group: 'People', icon: ClipboardList, feature: 'staff.duties', nav: false, component: page(() => import('../../features/staff/pages/StaffDutiesPage')) },
  { id: 'staff-delegations', screenId: 'STF-24', path: 'staff-delegations', scope: 'inst', title: 'Delegation', group: 'People', icon: Handshake, feature: 'staff.delegation', nav: false, component: page(() => import('../../features/staff/pages/StaffDelegationsPage')) },
  { id: 'staff-access', screenId: 'STF-22', path: 'staff-access', scope: 'inst', title: 'Staff access', group: 'People', icon: KeyRound, feature: 'staff.access', nav: false, component: page(() => import('../../features/staff/pages/StaffAccessPage')) },
  { id: 'staff-exits', screenId: 'STF-27', path: 'staff-exits', scope: 'inst', title: 'Transfers and exits', group: 'People', icon: Users, feature: 'staff.exits', nav: false, component: page(() => import('../../features/staff/pages/StaffExitsPage')) },
  { id: 'staff-analytics', screenId: 'STF-28', path: 'staff-analytics', scope: 'inst', title: 'Staff analytics', group: 'People', icon: BarChart3, feature: 'staff.analytics', nav: false, component: page(() => import('../../features/staff/pages/StaffAnalyticsPage')) },
  { id: 'staff-import', screenId: 'STF-29', path: 'staff-import', scope: 'inst', title: 'Import staff', group: 'People', icon: UserPlus, feature: 'staff.directory', nav: false, component: page(() => import('../../features/staff/pages/StaffImportPage')) },
  { id: 'staff-policies', screenId: 'STF-30', path: 'staff-policies', scope: 'inst', title: 'Staff policies', group: 'People', icon: ScrollText, feature: 'staff.policies', nav: false, component: page(() => import('../../features/staff/pages/StaffPoliciesPage')) },



  { id: 'reports', screenId: 'RPT-01', path: 'reports', scope: 'both', title: 'Reports', group: 'Insights', icon: BarChart3, feature: 'reports.catalog', nav: true, component: page(() => import('../../features/records/ReportsPage')) },
  { id: 'institution', screenId: 'ORG-04', path: 'institution', scope: 'inst', title: 'Institution profile', group: 'Administration', icon: School, feature: 'institution.profile', nav: true, component: page(() => import('../../features/institution/pages/InstitutionProfilePage')) },
  { id: 'campuses', screenId: 'ORG-06', path: 'campuses', scope: 'both', title: 'Campuses', group: 'Administration', icon: MapPin, feature: 'institution.campuses', nav: true, component: page(() => import('../../features/institution/pages/CampusesPage')) },
  { id: 'sessions', screenId: 'ORG-13', path: 'sessions', scope: 'both', title: 'Academic sessions', group: 'Administration', icon: CalendarRange, feature: 'institution.sessions', nav: true, component: page(() => import('../../features/institution/pages/SessionsPage')) },
  { id: 'curriculum', screenId: 'ORG-14', path: 'curriculum', scope: 'inst', title: 'Curriculum', group: 'Administration', icon: Layers, feature: 'institution.curriculum', nav: true, component: page(() => import('../../features/institution/pages/CurriculumPage')) },
  { id: 'link-requests', screenId: 'ORG-09', path: 'link-requests', scope: 'both', title: 'Linking requests', group: 'Administration', icon: Link2, feature: 'institution.links', nav: true, component: page(() => import('../../features/organization/pages/LinkRequestsPage')) },
  { id: 'link-request', screenId: 'ORG-09', path: 'link-requests/:id', scope: 'both', title: 'Linking request', group: 'Administration', icon: Link2, feature: 'institution.links', nav: false, component: page(() => import('../../features/organization/pages/LinkRequestPage')) },
  { id: 'data-sharing', screenId: 'ORG-11', path: 'data-sharing', scope: 'both', title: 'Data sharing', group: 'Administration', icon: Share2, feature: 'institution.sharing', nav: true, visible: hasIndependentChildren, component: page(() => import('../../features/organization/pages/DataSharingPage')) },
  { id: 'billing', screenId: 'ORG-12', path: 'billing', scope: 'both', title: 'Subscription and billing', group: 'Administration', icon: CreditCard, feature: 'institution.billing', nav: true, component: page(() => import('../../features/organization/pages/BillingPage')) },
  { id: 'history', screenId: 'ORG-16', path: 'history', scope: 'both', title: 'Change history', group: 'Administration', icon: History, feature: 'institution.history', nav: true, component: page(() => import('../../features/organization/pages/HistoryPage')) },
  { id: 'features', screenId: 'ACC-03', path: 'features', scope: 'inst', title: 'Features', group: 'Access', icon: ListChecks, feature: 'access.features', nav: true, component: page(() => import('../../features/access/pages/FeaturesPage')) },
  { id: 'entitlements', screenId: 'ACC-01', path: 'entitlements', scope: 'both', title: 'Plan entitlements', group: 'Access', icon: Boxes, feature: 'access.entitlements', nav: false, component: page(() => import('../../features/access/pages/EntitlementsPage')) },
  { id: 'dependencies', screenId: 'ACC-06', path: 'dependencies', scope: 'both', title: 'Feature dependencies', group: 'Access', icon: Network, feature: 'access.dependencies', nav: false, component: page(() => import('../../features/access/pages/DependenciesPage')) },
  { id: 'config-history', screenId: 'ACC-14', path: 'config-history', scope: 'both', title: 'Configuration history', group: 'Access', icon: History, feature: 'access.confighistory', nav: false, component: page(() => import('../../features/access/pages/ConfigHistoryPage')) },
  { id: 'roles', screenId: 'ACC-07', path: 'roles', scope: 'both', title: 'Roles', group: 'Access', icon: KeyRound, feature: 'access.roles', nav: true, component: page(() => import('../../features/access/pages/RolesPage')) },
  { id: 'role-builder', screenId: 'ACC-08', path: 'roles/:id', scope: 'both', title: 'Role builder', group: 'Access', icon: KeyRound, feature: 'access.roles', nav: false, component: page(() => import('../../features/access/pages/RoleBuilderPage')) },
  { id: 'role-templates', screenId: 'ACC-10', path: 'role-templates', scope: 'both', title: 'Permission templates', group: 'Access', icon: ClipboardList, feature: 'access.roles', nav: false, component: page(() => import('../../features/access/pages/TemplatesPage')) },
  { id: 'data-scope', screenId: 'ACC-11', path: 'data-scope', scope: 'both', title: 'Data scope', group: 'Access', icon: SlidersHorizontal, feature: 'access.scope', nav: false, component: page(() => import('../../features/access/pages/DataScopePage')) },
  { id: 'access-explainer', screenId: 'ACC-12', path: 'access-explainer', scope: 'both', title: 'Access explainer', group: 'Access', icon: SearchCheck, feature: 'access.explainer', nav: true, component: page(() => import('../../features/access/pages/ExplainerPage')) },
  { id: 'audit-log', screenId: 'ACC-13', path: 'audit-log', scope: 'both', title: 'Audit log', group: 'Access', icon: ScrollText, feature: 'access.audit', nav: true, component: page(() => import('../../features/access/pages/AuditPage')) },
  { id: 'settings', screenId: 'OLD-18', path: 'settings', scope: 'inst', title: 'Settings', group: 'Administration', icon: Settings, feature: 'institution.profile', nav: false, component: page(() => import('../../features/portal/pages/SettingsRedirect')) },

  { id: 'help', screenId: 'SH-07', path: 'help', scope: 'both', title: 'Help centre', group: 'Support', icon: CircleHelp, feature: 'help.center', nav: true, component: page(() => import('../../features/portal/pages/HelpPage')) },
  { id: 'profile', screenId: 'SH-08', path: 'profile', scope: 'both', title: 'Profile and preferences', group: 'Support', icon: Users, feature: 'profile.account', nav: false, component: page(() => import('../../features/portal/pages/ProfilePage')) },
];

export const ROUTES: RouteDef[] = [...STATIC_ROUTES, ...recordRoutes()];

/** Top-level paths of the old flat URLs. They redirect into the current institution. */
export const LEGACY_PATHS = ['admissions', 'students', 'students/:id', 'parents', 'staff', 'academics/*', 'homework', 'attendance', 'timetable', 'examinations', 'fees', 'communication', 'transport', 'library', 'inventory', 'reports', 'settings'];
