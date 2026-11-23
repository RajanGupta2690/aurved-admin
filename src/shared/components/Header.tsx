import { Search, Bell, HelpCircle, ChevronDown, Menu, User as UserIcon } from 'lucide-react';
import { academicSessions } from '../../data/mockData';
import { useAuth } from '../../core/auth/AuthContext';
import { UserRole } from '../../core/auth/types';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const currentSession = academicSessions.find(s => s.isCurrent);
  const { user, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.ADMIN_STAFF]: 'Admin Staff',
    [UserRole.TEACHER]: 'Teacher',
    [UserRole.LIBRARIAN]: 'Librarian',
    [UserRole.ACCOUNTANT]: 'Accountant',
    [UserRole.TRANSPORT_MANAGER]: 'Transport Manager',
    [UserRole.RECEPTIONIST]: 'Receptionist',
  };

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setShowRoleMenu(false);
  };

  return (
    <header className="bg-white border-b border-warm-200 h-14 md:h-16 px-3 md:px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left Section - Mobile Menu + Search */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-warm-100 transition-colors"
        >
          <Menu size={22} className="text-charcoal-600" />
        </button>

        {/* Search - Hidden on small mobile, visible on md+ */}
        <div className="hidden sm:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-warm-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Mobile Search Icon */}
        <button className="sm:hidden p-2 rounded-lg hover:bg-warm-100 transition-colors">
          <Search size={20} className="text-charcoal-600" />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Academic Session Selector - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-warm-300 bg-warm-50 cursor-pointer hover:bg-warm-100 transition-colors">
          <div className="text-sm">
            <p className="text-xs text-charcoal-500">Academic Year</p>
            <p className="font-medium text-charcoal-900 text-sm">{currentSession?.name}</p>
          </div>
          <ChevronDown size={16} className="text-charcoal-500" />
        </div>

        {/* Help - Hidden on mobile */}
        <button className="hidden md:block p-2 rounded-lg hover:bg-warm-100 transition-colors relative">
          <HelpCircle size={20} className="text-charcoal-600" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-warm-100 transition-colors relative">
          <Bell size={20} className="text-charcoal-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu with Role Switcher */}
        <div className="relative">
          <button 
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 p-1 md:p-2 rounded-lg hover:bg-warm-100 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs text-charcoal-900 font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-charcoal-500">{roleLabels[user?.role || UserRole.SUPER_ADMIN]}</p>
            </div>
            <ChevronDown size={16} className="text-charcoal-500 hidden md:block" />
          </button>

          {/* Role Switcher Dropdown */}
          {showRoleMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowRoleMenu(false)}
              ></div>
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-warm-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-warm-200">
                  <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Switch Role (Demo)</p>
                </div>
                {Object.entries(roleLabels).map(([role, label]) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role as UserRole)}
                    className={`w-full text-left px-4 py-2 hover:bg-warm-50 transition-colors flex items-center gap-3 ${
                      user?.role === role ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${user?.role === role ? 'bg-primary-500' : 'bg-warm-300'}`}></div>
                    <div className="flex-1">
                      <p className={`text-sm ${user?.role === role ? 'font-semibold text-primary-600' : 'text-charcoal-700'}`}>
                        {label}
                      </p>
                    </div>
                    {user?.role === role && (
                      <span className="text-xs text-primary-600 font-medium">Active</span>
                    )}
                  </button>
                ))}
                <div className="px-4 py-2 mt-2 border-t border-warm-200">
                  <p className="text-xs text-charcoal-500">Switch roles to see different permissions and UI</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
