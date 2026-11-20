import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import { academicSessions } from '../../data/mockData';

export default function Header() {
  const currentSession = academicSessions.find(s => s.isCurrent);

  return (
    <header className="bg-white border-b border-warm-200 h-16 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
          <input
            type="text"
            placeholder="Search students, teachers, classes..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-warm-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-6">
        {/* Academic Session Selector */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-warm-300 bg-warm-50 cursor-pointer hover:bg-warm-100 transition-colors">
          <div className="text-sm">
            <p className="text-xs text-charcoal-500">Academic Year</p>
            <p className="font-medium text-charcoal-900">{currentSession?.name}</p>
          </div>
          <ChevronDown size={16} className="text-charcoal-500" />
        </div>

        {/* Help */}
        <button className="p-2 rounded-lg hover:bg-warm-100 transition-colors relative">
          <HelpCircle size={22} className="text-charcoal-600" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-warm-100 transition-colors relative">
          <Bell size={22} className="text-charcoal-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-warm-100 transition-colors">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
            RK
          </div>
          <ChevronDown size={16} className="text-charcoal-500" />
        </button>
      </div>
    </header>
  );
}
