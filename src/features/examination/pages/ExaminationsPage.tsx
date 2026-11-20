import { Calendar, Plus, Eye, Edit, FileText } from 'lucide-react';
import { examinations, classes } from '../../../data/mockData';

export default function ExaminationsPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'ongoing':
        return 'badge-info';
      case 'upcoming':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge';
    }
  };

  const stats = {
    total: examinations.length,
    upcoming: examinations.filter(e => e.status === 'upcoming').length,
    ongoing: examinations.filter(e => e.status === 'ongoing').length,
    completed: examinations.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Examinations</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage examinations, schedules, and results</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Create Examination
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Total Exams</p>
          <p className="text-2xl font-bold text-charcoal-950">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-orange-600">{stats.upcoming}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Ongoing</p>
          <p className="text-2xl font-bold text-blue-600">{stats.ongoing}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
        </div>
      </div>

      {/* Examinations List */}
      <div className="space-y-4">
        {examinations.map(exam => (
          <div key={exam.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-charcoal-950">{exam.name}</h3>
                  <span className={`badge ${getStatusColor(exam.status)}`}>
                    {exam.status}
                  </span>
                  <span className="text-xs px-2 py-1 bg-warm-100 text-charcoal-700 rounded capitalize">
                    {exam.examType.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-charcoal-400" />
                    <div>
                      <p className="text-charcoal-500">Start Date</p>
                      <p className="text-charcoal-900 font-medium">
                        {new Date(exam.startDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-charcoal-400" />
                    <div>
                      <p className="text-charcoal-500">End Date</p>
                      <p className="text-charcoal-900 font-medium">
                        {new Date(exam.endDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-charcoal-500">Classes</p>
                    <p className="text-charcoal-900 font-medium">
                      {exam.classIds.map(classId => {
                        const cls = classes.find(c => c.id === classId);
                        return cls?.name;
                      }).join(', ')}
                    </p>
                  </div>
                </div>

                {exam.status === 'upcoming' && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-800">
                      📅 Examination starts in {Math.ceil((new Date(exam.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-6">
                <button className="btn-secondary flex items-center gap-2 text-sm">
                  <Eye size={16} />
                  View
                </button>
                <button className="btn-ghost flex items-center gap-2 text-sm">
                  <Edit size={16} />
                  Edit
                </button>
                {exam.status === 'completed' && (
                  <button className="btn-ghost flex items-center gap-2 text-sm text-primary-600">
                    <FileText size={16} />
                    Results
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-semibold text-charcoal-950 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'Configure Exam Types',
            'Set Grade Levels',
            'Marks Entry',
            'Generate Report Cards',
          ].map((action, idx) => (
            <button
              key={idx}
              className="p-4 bg-warm-50 rounded-lg border border-warm-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-center"
            >
              <p className="text-sm font-medium text-charcoal-900">{action}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
