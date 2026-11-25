import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, Eye, Trash2 } from 'lucide-react';
import { classes } from '../../../data/mockData';
import { studentActions, useStudents } from '../../../core/api/studentStore';
import { familyActions } from '../../../core/api/familyStore';
import { formToParentFields, nextStudentCode } from '../../../core/api/familyLogic';
import StudentForm from '../components/StudentForm';
import type { ParentChoice, StudentFormValues } from '../components/StudentForm';
import type { Student } from '../../../types';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

export default function StudentsListPage() {
  const students = useStudents();
  const [year] = useState(() => new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as 'success' | 'error', message: '' });

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'Unknown';
  };

  const getSectionName = (classId: string, sectionId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.sections.find(s => s.id === sectionId)?.name || '';
  };

  const handleAddStudent = (form: StudentFormValues, parent: ParentChoice) => {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const id = `student-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    studentActions.add({
      id,
      admissionNumber: form.admissionNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      fullName,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender as Student['gender'],
      bloodGroup: form.bloodGroup || undefined,
      address: form.address,
      city: '',
      state: '',
      pincode: '',
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      admissionDate: today,
      academicSessionId: 'session-1',
      classId: form.classId,
      sectionId: form.sectionId,
      rollNumber: form.rollNumber,
      status: 'active',
      parentId: '',
    });
    let note = '';
    if (parent.kind === 'new') {
      familyActions.createAndLink(id, formToParentFields(parent.values));
      note = ' Parents were added and linked.';
    } else if (parent.kind === 'existing') {
      familyActions.link(id, parent.parentId);
      note = ' Linked to the chosen family.';
    }
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: `${fullName} was added with school student ID ${form.admissionNumber}.${note}` });
  };
  const handleDeleteStudent = () => {
    if (!selectedStudent) return;
    studentActions.remove(selectedStudent.id);
    setToast({ show: true, type: 'success', message: `${selectedStudent.fullName} was removed.` });
    setSelectedStudent(null);
  };
  const handleExport = () => {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = ['School student ID', 'Name', 'Class', 'Section', 'Roll number', 'Gender', 'Status'];
    const rows = filteredStudents.map((student) => [student.admissionNumber, student.fullName, getClassName(student.classId), getSectionName(student.classId, student.sectionId), student.rollNumber, student.gender, student.status]);
    const text = [header, ...rows].map((row) => row.map((cell) => quote(String(cell ?? ''))).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.csv';
    link.click();
    URL.revokeObjectURL(url);
    setToast({ show: true, type: 'success', message: `Exported ${filteredStudents.length} students.` });
  };
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Students</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage all student records</p>
        </div>
        <button type="button" className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              aria-label="Search students"
              placeholder="Search by name or school student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Class Filter */}
          <select
            aria-label="Filter by class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button type="button" onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2">
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-charcoal-950">{students.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Active Students</p>
          <p className="text-2xl font-bold text-emerald-600">
            {students.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Boys</p>
          <p className="text-2xl font-bold text-blue-600">
            {students.filter(s => s.gender === 'male').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Girls</p>
          <p className="text-2xl font-bold text-pink-600">
            {students.filter(s => s.gender === 'female').length}
          </p>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Students</caption>
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  School student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Roll No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-warm-200">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal-900">
                    {student.admissionNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-charcoal-900">{student.fullName}</p>
                        <p className="text-xs text-charcoal-500">{student.email || student.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900">
                    {getClassName(student.classId)} - {getSectionName(student.classId, student.sectionId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900">
                    {student.rollNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900 capitalize">
                    {student.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/students/${student.id}`}
                        className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
                        title="View"
                        aria-label={`View ${student.fullName}`}
                      >
                        <Eye size={16} className="text-charcoal-600" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                        aria-label={`Delete ${student.fullName}`}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-warm-200 flex items-center justify-between">
          <p className="text-sm text-charcoal-600">
            Showing all {filteredStudents.length} of {students.length} students
          </p>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student"
        size="lg"
      >
        <StudentForm mode="add" students={students} nextCode={nextStudentCode(students, year)} onSubmit={handleAddStudent} onCancel={() => setShowAddModal(false)} />
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message="Are you sure you want to delete this student? This will remove all associated records."
        itemName={selectedStudent?.fullName}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        type={toast.type}
        message={toast.message}
      />
    </div>
  );
}
