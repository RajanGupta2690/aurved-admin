import { useState } from 'react';
import { Calendar, Download, Save, Users } from 'lucide-react';
import { classes, students, attendanceRecords } from '../../../data/mockData';
import Toast from '../../../shared/components/Toast';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('class-1');
  const [selectedSection, setSelectedSection] = useState('sec-1-a');
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const selectedClassData = classes.find(c => c.id === selectedClass);
  const classStudents = students.filter(
    s => s.classId === selectedClass && s.sectionId === selectedSection
  );

  const [attendance, setAttendance] = useState<Record<string, string>>(
    classStudents.reduce((acc, student) => {
      const record = attendanceRecords.find(
        r => r.studentId === student.id && r.date === selectedDate
      );
      acc[student.id] = record?.status || 'present';
      return acc;
    }, {} as Record<string, string>)
  );

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: string) => {
    setAttendance(
      classStudents.reduce((acc, student) => {
        acc[student.id] = status;
        return acc;
      }, {} as Record<string, string>)
    );
    setToast({ show: true, type: 'success', message: `All students marked as ${status}!` });
  };

  const handleSaveAttendance = () => {
    console.log('Saving attendance:', attendance);
    setToast({ show: true, type: 'success', message: 'Attendance saved successfully!' });
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const attendancePercentage = classStudents.length > 0 
    ? Math.round((presentCount / classStudents.length) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Attendance Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">Mark and manage student attendance</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Export
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleSaveAttendance}>
            <Save size={20} />
            Save Attendance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                const cls = classes.find(c => c.id === e.target.value);
                if (cls && cls.sections.length > 0) {
                  setSelectedSection(cls.sections[0].id);
                }
              }}
              className="input"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="input"
            >
              {selectedClassData?.sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Quick Actions</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAll('present')}
                className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
              >
                All Present
              </button>
              <button
                onClick={() => handleMarkAll('absent')}
                className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                All Absent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-charcoal-950">{classStudents.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Present</p>
          <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Absent</p>
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Attendance Rate</p>
          <p className="text-2xl font-bold text-primary-600">{attendancePercentage}%</p>
        </div>
      </div>

      {/* Attendance List */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 bg-warm-50 border-b border-warm-200">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-charcoal-600" />
            <h2 className="font-semibold text-charcoal-950">
              {selectedClassData?.name} - Section {selectedClassData?.sections.find(s => s.id === selectedSection)?.name}
            </h2>
            <span className="text-sm text-charcoal-600">
              ({classStudents.length} students)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">
                  Roll No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">
                  Gender
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-charcoal-700 uppercase">
                  Attendance Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-warm-200">
              {classStudents.map(student => (
                <tr key={student.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal-900">
                    {student.rollNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-charcoal-900">{student.fullName}</p>
                        <p className="text-xs text-charcoal-500">{student.admissionNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900 capitalize">
                    {student.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'present')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          attendance[student.id] === 'present'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-warm-100 text-charcoal-600 hover:bg-emerald-50'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          attendance[student.id] === 'absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-warm-100 text-charcoal-600 hover:bg-red-50'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'late')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          attendance[student.id] === 'late'
                            ? 'bg-orange-500 text-white'
                            : 'bg-warm-100 text-charcoal-600 hover:bg-orange-50'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'on_leave')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          attendance[student.id] === 'on_leave'
                            ? 'bg-blue-500 text-white'
                            : 'bg-warm-100 text-charcoal-600 hover:bg-blue-50'
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {classStudents.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-charcoal-500">No students found in this class/section</p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
