import { Search, Bell, HelpCircle, ChevronDown, Menu } from 'lucide-react';
import { academicSessions } from '../../data/mockData';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const currentSession = academicSessions.find(s => s.isCurrent);

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

        {/* User Menu */}
        <button className="flex items-center gap-2 p-1 md:p-2 rounded-lg hover:bg-warm-100 transition-colors">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
            RK
          </div>
          <ChevronDown size={16} className="text-charcoal-500 hidden md:block" />
        </button>
      </div>
    </header>
  );
}
