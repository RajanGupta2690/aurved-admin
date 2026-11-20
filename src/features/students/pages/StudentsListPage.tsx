import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { students, classes } from '../../../data/mockData';

export default function StudentsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

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

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Students</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage all student records</p>
        </div>
        <Link to="/students/add" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Class Filter */}
          <select
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
          <button className="btn-secondary flex items-center justify-center gap-2">
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
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Admission No.
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
                      >
                        <Eye size={16} className="text-charcoal-600" />
                      </Link>
                      <Link
                        to={`/students/${student.id}/edit`}
                        className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} className="text-charcoal-600" />
                      </Link>
                      <button
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
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
            Showing {filteredStudents.length} of {students.length} students
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1.5 text-sm">Previous</button>
            <button className="btn-primary px-3 py-1.5 text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
