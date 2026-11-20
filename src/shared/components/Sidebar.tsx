import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  UsersRound,
  BookOpen,
  ClipboardCheck,
  Calendar,
  FileText,
  DollarSign,
  GraduationCap,
  BookMarked,
  MessageSquare,
  Bus,
  Library,
  Package,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/',
  },
  {
    id: 'admission',
    label: 'Admissions',
    icon: <UserPlus size={20} />,
    path: '/admissions',
  },
  {
    id: 'students',
    label: 'Students',
    icon: <Users size={20} />,
    path: '/students',
  },
  {
    id: 'parents',
    label: 'Parents',
    icon: <UsersRound size={20} />,
    path: '/parents',
  },
  {
    id: 'academics',
    label: 'Academics',
    icon: <BookOpen size={20} />,
    children: [
      { id: 'sessions', label: 'Academic Sessions', icon: null, path: '/academics/sessions' },
      { id: 'classes', label: 'Classes', icon: null, path: '/academics/classes' },
      { id: 'subjects', label: 'Subjects', icon: null, path: '/academics/subjects' },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: <ClipboardCheck size={20} />,
    path: '/attendance',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: <Calendar size={20} />,
    path: '/timetable',
  },
  {
    id: 'examination',
    label: 'Examinations',
    icon: <FileText size={20} />,
    path: '/examinations',
  },
  {
    id: 'fees',
    label: 'Fees & Accounts',
    icon: <DollarSign size={20} />,
    path: '/fees',
  },
  {
    id: 'staff',
    label: 'Teachers & Staff',
    icon: <GraduationCap size={20} />,
    path: '/staff',
  },
  {
    id: 'homework',
    label: 'Homework',
    icon: <BookMarked size={20} />,
    path: '/homework',
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: <MessageSquare size={20} />,
    path: '/communication',
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: <Bus size={20} />,
    path: '/transport',
  },
  {
    id: 'library',
    label: 'Library',
    icon: <Library size={20} />,
    path: '/library',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Package size={20} />,
    path: '/inventory',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 size={20} />,
    path: '/reports',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={20} />,
    path: '/settings',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['academics']);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (item: NavItem) => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.path));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isParentActive(item);

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpand(item.id)}
            className={`sidebar-item w-full ${active ? 'sidebar-item-active' : ''}`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path || '#'}
        onClick={onClose}
        className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''} ${
          level > 0 ? 'pl-8' : ''
        }`}
      >
        {item.icon && item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-neutral-200 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        h-screen overflow-y-auto flex flex-col
        shadow-2xl lg:shadow-none
      `}
    >
      {/* Close button for mobile */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-100 text-neutral-600 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Logo and Institution - Premium Branding */}
      <div className="p-6 border-b border-neutral-200 bg-gradient-to-br from-white to-primary-50/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">AURVED</h1>
            <p className="text-xs text-neutral-500 font-medium">School Admin</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-sm text-neutral-700 font-semibold">Sunrise International</p>
          <p className="text-xs text-neutral-500 mt-0.5">Mumbai, Maharashtra</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map(item => renderNavItem(item))}
      </nav>

      {/* User Profile - Premium */}
      <div className="p-4 border-t border-neutral-200 bg-gradient-to-br from-white to-primary-50/20">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
            RK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">Rajesh Kumar</p>
            <p className="text-xs text-neutral-500">Principal</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
