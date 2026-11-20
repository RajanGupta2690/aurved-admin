import {
  Users,
  GraduationCap,
  UsersRound,
  UserCheck,
  UserX,
  DollarSign,
  TrendingUp,
  Calendar,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { dashboardStats, students, teachers, examinations, notices } from '../../../data/mockData';

export default function DashboardPage() {
  const attendancePercentage = Math.round(
    (dashboardStats.presentToday / dashboardStats.totalStudents) * 100
  );

  const kpiCards = [
    {
      title: 'Total Students',
      value: dashboardStats.totalStudents,
      icon: <Users size={24} />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Teachers',
      value: dashboardStats.totalTeachers,
      icon: <GraduationCap size={24} />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Staff',
      value: dashboardStats.totalStaff,
      icon: <UsersRound size={24} />,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Present Today',
      value: dashboardStats.presentToday,
      icon: <UserCheck size={24} />,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Absent Today',
      value: dashboardStats.absentToday,
      icon: <UserX size={24} />,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Pending Fees',
      value: `₹${(dashboardStats.pendingFees / 1000).toFixed(0)}K`,
      icon: <DollarSign size={24} />,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, Rajesh Kumar</h1>
            <p className="text-primary-50">
              Today is {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-primary-100 mt-1">Academic Year: 2024-2025</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors">
              Mark Attendance
            </button>
            <button className="bg-primary-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-800 transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <div className={card.iconColor}>{card.icon}</div>
              </div>
            </div>
            <p className="text-2xl font-bold text-charcoal-950 mb-1">{card.value}</p>
            <p className="text-sm text-charcoal-600">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Overview */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-charcoal-950">Today's Attendance</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View Details →
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-charcoal-950">{attendancePercentage}%</p>
                <p className="text-sm text-charcoal-600 mt-1">Attendance Rate</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{dashboardStats.presentToday}</p>
                  <p className="text-xs text-charcoal-600">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{dashboardStats.absentToday}</p>
                  <p className="text-xs text-charcoal-600">Absent</p>
                </div>
              </div>
            </div>
            
            {/* Attendance Progress Bar */}
            <div className="w-full bg-warm-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>

            {/* Class-wise breakdown */}
            <div className="pt-4 border-t border-warm-200">
              <p className="text-sm font-medium text-charcoal-700 mb-3">Class-wise Attendance</p>
              <div className="space-y-2">
                {['Class 1', 'Class 2', 'Class 3'].map((cls, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-600">{cls}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-medium">{28 - idx}</span>
                      <span className="text-charcoal-400">/</span>
                      <span className="text-charcoal-600">30</span>
                      <span className="text-xs text-charcoal-500 ml-2">({((28 - idx) / 30 * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-charcoal-950">Fee Collection</h2>
            <TrendingUp size={20} className="text-primary-600" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-charcoal-600 mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-emerald-600">
                ₹{(dashboardStats.feesCollected / 100000).toFixed(2)}L
              </p>
            </div>
            <div>
              <p className="text-sm text-charcoal-600 mb-1">Pending Dues</p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{(dashboardStats.pendingFees / 100000).toFixed(2)}L
              </p>
            </div>
            <div className="pt-4 border-t border-warm-200">
              <p className="text-xs text-charcoal-500 mb-2">Collection Rate</p>
              <div className="w-full bg-warm-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-full rounded-full"
                  style={{
                    width: `${(dashboardStats.feesCollected / (dashboardStats.feesCollected + dashboardStats.pendingFees)) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-charcoal-600 mt-2 text-right">
                {((dashboardStats.feesCollected / (dashboardStats.feesCollected + dashboardStats.pendingFees)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Examinations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-950">Upcoming Examinations</h2>
            <Calendar size={20} className="text-primary-600" />
          </div>
          <div className="space-y-3">
            {examinations
              .filter(e => e.status === 'upcoming')
              .map(exam => (
                <div key={exam.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-charcoal-900">{exam.name}</p>
                      <p className="text-sm text-charcoal-600 mt-1">
                        {new Date(exam.startDate).toLocaleDateString('en-IN')} - {new Date(exam.endDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span className="badge badge-info">Upcoming</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-950">Recent Notices</h2>
            <Bell size={20} className="text-primary-600" />
          </div>
          <div className="space-y-3">
            {notices.slice(0, 3).map(notice => (
              <div key={notice.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200">
                <div className="flex items-start gap-3">
                  {notice.priority === 'high' ? (
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Bell size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-charcoal-900">{notice.title}</p>
                    <p className="text-sm text-charcoal-600 mt-1 line-clamp-2">{notice.description}</p>
                    <p className="text-xs text-charcoal-500 mt-2">
                      {new Date(notice.publishDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-charcoal-950 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Add Student', path: '/students/add' },
            { label: 'Mark Attendance', path: '/attendance' },
            { label: 'Collect Fee', path: '/fees/collect' },
            { label: 'Create Notice', path: '/communication/new' },
            { label: 'Add Teacher', path: '/staff/add' },
            { label: 'View Reports', path: '/reports' },
          ].map((action, idx) => (
            <button
              key={idx}
              className="p-4 bg-warm-50 rounded-lg border border-warm-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-center group"
            >
              <p className="text-sm font-medium text-charcoal-900 group-hover:text-primary-600">
                {action.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
