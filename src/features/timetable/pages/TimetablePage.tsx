import { useState } from 'react';
import { Calendar, Clock, BookOpen, User, Download, Plus, Edit } from 'lucide-react';
import { classes, teachers } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import Toast from '../../../shared/components/Toast';

// Mock timetable data
const mockPeriods = [
  { id: '1', time: '08:00 - 08:45', name: 'Period 1' },
  { id: '2', time: '08:45 - 09:30', name: 'Period 2' },
  { id: '3', time: '09:30 - 10:15', name: 'Period 3' },
  { id: 'break', time: '10:15 - 10:30', name: 'Break' },
  { id: '4', time: '10:30 - 11:15', name: 'Period 4' },
  { id: '5', time: '11:15 - 12:00', name: 'Period 5' },
  { id: '6', time: '12:00 - 12:45', name: 'Period 6' },
  { id: 'lunch', time: '12:45 - 01:30', name: 'Lunch' },
  { id: '7', time: '01:30 - 02:15', name: 'Period 7' },
  { id: '8', time: '02:15 - 03:00', name: 'Period 8' },
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer', 'Physical Education', 'Art'];

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const [selectedSection, setSelectedSection] = useState('');
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  // Get sections for selected class
  const selectedClassData = classes.find(c => c.id === selectedClass);
  const sections = selectedClassData?.sections || [];

  // Generate random timetable (mock)
  const getTimetableCell = (periodId: string, day: string) => {
    if (periodId === 'break' || periodId === 'lunch') {
      return null;
    }
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomTeacher = teachers[Math.floor(Math.random() * Math.min(teachers.length, 3))];
    return {
      subject: randomSubject,
      teacher: randomTeacher?.fullName || 'TBA',
    };
  };

  const handleEditCell = (period: any, day: string, cell: any) => {
    setSelectedCell({ period, day, ...cell });
    setShowEditModal(true);
  };

  const handleUpdateCell = (data: any) => {
    console.log('Updating timetable cell:', data);
    setShowEditModal(false);
    setSelectedCell(null);
    setToast({ show: true, type: 'success', message: 'Timetable updated successfully!' });
  };

  const handleCreateTimetable = (data: any) => {
    console.log('Creating timetable:', data);
    setShowCreateModal(false);
    setToast({ show: true, type: 'success', message: 'Timetable created successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Timetable Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Manage class schedules and teacher allocations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Export
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} />
            Create Timetable
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{classes.length}</p>
          <p className="text-sm text-charcoal-600">Total Classes</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{mockPeriods.filter(p => p.id !== 'break' && p.id !== 'lunch').length}</p>
          <p className="text-sm text-charcoal-600">Periods/Day</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <BookOpen className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{subjects.length}</p>
          <p className="text-sm text-charcoal-600">Subjects</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <User className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{teachers.length}</p>
          <p className="text-sm text-charcoal-600">Teachers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-charcoal-700">View Mode:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'class' | 'teacher')}
              className="input"
            >
              <option value="class">Class Timetable</option>
              <option value="teacher">Teacher Timetable</option>
            </select>
          </div>

          {viewMode === 'class' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-charcoal-700">Class:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                  className="input"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-charcoal-700">Section:</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="input"
                >
                  <option value="">All Sections</option>
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary-500 text-white">
                <th className="px-4 py-3 text-left font-semibold border border-primary-600 min-w-[120px]">
                  Time / Day
                </th>
                {weekDays.map(day => (
                  <th key={day} className="px-4 py-3 text-center font-semibold border border-primary-600 min-w-[150px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockPeriods.map(period => (
                <tr key={period.id} className={period.id === 'break' || period.id === 'lunch' ? 'bg-warm-100' : 'bg-white'}>
                  <td className="px-4 py-3 border border-warm-200">
                    <div>
                      <p className="font-semibold text-sm text-charcoal-950">{period.name}</p>
                      <p className="text-xs text-charcoal-600">{period.time}</p>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    if (period.id === 'break') {
                      return (
                        <td key={day} colSpan={1} className="px-4 py-3 text-center border border-warm-200">
                          <span className="text-sm font-medium text-charcoal-600">☕ Break</span>
                        </td>
                      );
                    }
                    if (period.id === 'lunch') {
                      return (
                        <td key={day} colSpan={1} className="px-4 py-3 text-center border border-warm-200">
                          <span className="text-sm font-medium text-charcoal-600">🍽️ Lunch</span>
                        </td>
                      );
                    }
                    const cell = getTimetableCell(period.id, day);
                    return (
                      <td 
                        key={day} 
                        className="px-4 py-3 border border-warm-200 hover:bg-warm-50 transition-colors cursor-pointer group relative"
                        onClick={() => handleEditCell(period, day, cell)}
                      >
                        {cell && (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-charcoal-950">{cell.subject}</p>
                            <p className="text-xs text-charcoal-600 flex items-center gap-1">
                              <User size={12} />
                              {cell.teacher}
                            </p>
                            <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm">
                              <Edit size={14} className="text-primary-600" />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-charcoal-950 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded"></div>
            <span className="text-sm text-charcoal-600">Regular Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warm-100 border border-warm-300 rounded"></div>
            <span className="text-sm text-charcoal-600">Break / Lunch</span>
          </div>
        </div>
      </div>

      {/* Edit Cell Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCell(null);
        }}
        title="Edit Timetable Slot"
      >
        <TimetableSlotForm
          slot={selectedCell}
          onSubmit={handleUpdateCell}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCell(null);
          }}
        />
      </Modal>

      {/* Create Timetable Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Timetable"
      >
        <CreateTimetableForm
          onSubmit={handleCreateTimetable}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Toast */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}

// Timetable Slot Form
function TimetableSlotForm({ slot, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    subject: slot?.subject || '',
    teacher: slot?.teacher || '',
    room: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-warm-50 rounded-lg">
        <p className="text-sm text-charcoal-600">
          <span className="font-semibold">{slot?.period?.name}</span> - {slot?.day}
        </p>
        <p className="text-xs text-charcoal-500">{slot?.period?.time}</p>
      </div>

      <div>
        <label className="label">Subject *</label>
        <select
          className="input"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
        >
          <option value="">Select subject</option>
          {subjects.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Teacher *</label>
        <select
          className="input"
          value={formData.teacher}
          onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
          required
        >
          <option value="">Select teacher</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.fullName}>{teacher.fullName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Room Number</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Room 101"
          value={formData.room}
          onChange={(e) => setFormData({ ...formData, room: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Update Slot</button>
      </div>
    </form>
  );
}

// Create Timetable Form
function CreateTimetableForm({ onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    classId: '',
    sectionId: '',
    academicYear: '',
  });

  const selectedClassData = classes.find(c => c.id === formData.classId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Class *</label>
        <select
          className="input"
          value={formData.classId}
          onChange={(e) => setFormData({ ...formData, classId: e.target.value, sectionId: '' })}
          required
        >
          <option value="">Select class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {formData.classId && (
        <div>
          <label className="label">Section *</label>
          <select
            className="input"
            value={formData.sectionId}
            onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
            required
          >
            <option value="">Select section</option>
            {selectedClassData?.sections.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Academic Year *</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., 2024-2025"
          value={formData.academicYear}
          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
          required
        />
      </div>

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          ℹ️ A blank timetable template will be created for the selected class and section.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Create Timetable</button>
      </div>
    </form>
  );
}
