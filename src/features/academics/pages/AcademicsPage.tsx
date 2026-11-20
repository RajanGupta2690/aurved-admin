import { useState } from 'react';
import { Plus, BookOpen, Users, Layout, GraduationCap, Edit, Trash2 } from 'lucide-react';
import { classes, academicSessions } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

// Mock subjects data
const mockSubjects = [
  { id: '1', name: 'Mathematics', code: 'MATH', type: 'Core', classId: 'class-1' },
  { id: '2', name: 'Science', code: 'SCI', type: 'Core', classId: 'class-1' },
  { id: '3', name: 'English', code: 'ENG', type: 'Core', classId: 'class-1' },
  { id: '4', name: 'Hindi', code: 'HIN', type: 'Core', classId: 'class-1' },
  { id: '5', name: 'Social Studies', code: 'SST', type: 'Core', classId: 'class-2' },
  { id: '6', name: 'Computer Science', code: 'CS', type: 'Elective', classId: 'class-2' },
  { id: '7', name: 'Physical Education', code: 'PE', type: 'Activity', classId: 'class-2' },
  { id: '8', name: 'Art & Craft', code: 'ART', type: 'Activity', classId: 'class-3' },
];

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'classes' | 'subjects'>('sessions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  // Calculate stats
  const totalSections = classes.reduce((sum, cls) => sum + cls.sections.length, 0);
  const totalSubjects = mockSubjects.length;

  const handleAdd = (data: any) => {
    console.log('Adding:', activeTab, data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: `${activeTab} added successfully!` });
  };

  const handleEdit = (data: any) => {
    console.log('Editing:', activeTab, data);
    setShowEditModal(false);
    setSelectedItem(null);
    setToast({ show: true, type: 'success', message: `${activeTab} updated successfully!` });
  };

  const handleDelete = () => {
    console.log('Deleting:', selectedItem);
    setShowDeleteConfirm(false);
    setSelectedItem(null);
    setToast({ show: true, type: 'success', message: `${activeTab} deleted successfully!` });
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDeleteClick = (item: any) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Academic Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Manage academic sessions, classes, sections, and subjects
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add New
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <GraduationCap className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{academicSessions.length}</p>
          <p className="text-sm text-charcoal-600">Academic Sessions</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Layout className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{classes.length}</p>
          <p className="text-sm text-charcoal-600">Classes</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{totalSections}</p>
          <p className="text-sm text-charcoal-600">Sections</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <BookOpen className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{totalSubjects}</p>
          <p className="text-sm text-charcoal-600">Subjects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sessions' ? 'bg-primary-500 text-white' : 'text-charcoal-600 hover:bg-warm-100'
            }`}
          >
            Academic Sessions
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'classes' ? 'bg-primary-500 text-white' : 'text-charcoal-600 hover:bg-warm-100'
            }`}
          >
            Classes & Sections
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'subjects' ? 'bg-primary-500 text-white' : 'text-charcoal-600 hover:bg-warm-100'
            }`}
          >
            Subjects
          </button>
        </div>
      </div>

      {/* Academic Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {academicSessions.map((session) => (
            <div key={session.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <GraduationCap className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-950">{session.name}</h3>
                    {session.isCurrent && (
                      <span className="badge badge-success text-xs mt-1">Current Session</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-charcoal-600">
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium">{new Date(session.startDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>End Date:</span>
                  <span className="font-medium">{new Date(session.endDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  className="btn-secondary text-sm py-1 px-3"
                  onClick={() => handleEditClick(session)}
                >
                  <Edit size={14} className="inline mr-1" />
                  Edit
                </button>
                <button 
                  className="text-red-600 hover:bg-red-50 text-sm py-1 px-3 rounded"
                  onClick={() => handleDeleteClick(session)}
                >
                  <Trash2 size={14} className="inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Classes & Sections Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div key={cls.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <Layout className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-950 text-lg">{cls.name}</h3>
                    <p className="text-sm text-charcoal-600">{cls.sections.length} Section(s)</p>
                  </div>
                </div>
                <button className="btn-secondary text-sm py-1 px-3">Add Section</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cls.sections.map((section) => (
                  <div key={section.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-charcoal-950">Section {section.name}</h4>
                      <span className="badge badge-info text-xs">Active</span>
                    </div>
                    <div className="space-y-1 text-sm text-charcoal-600">
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="font-medium">{section.capacity}</span>
                      </div>
                      {section.classTeacherId && (
                        <div className="flex justify-between">
                          <span>Class Teacher:</span>
                          <span className="font-medium text-xs">Assigned</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn-ghost text-xs py-1 px-2">View</button>
                      <button className="btn-ghost text-xs py-1 px-2">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-warm-200">
                {mockSubjects.map((subject) => {
                  const cls = classes.find(c => c.id === subject.classId);
                  return (
                    <tr key={subject.id} className="hover:bg-warm-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-primary-600" />
                          <span className="font-medium text-charcoal-900">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-charcoal-600">{subject.code}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          subject.type === 'Core' ? 'badge-success' :
                          subject.type === 'Elective' ? 'badge-info' :
                          'badge-warning'
                        }`}>
                          {subject.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal-900">{cls?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="btn-ghost text-sm py-1 px-3">Edit</button>
                          <button className="btn-ghost text-sm py-1 px-3">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
      isOpen={showAddModal}
      onClose={() => setShowAddModal(false)}
      title={`Add ${activeTab === 'sessions' ? 'Academic Session' : activeTab === 'classes' ? 'Class' : 'Subject'}`}
    >
      <AcademicForm
        type={activeTab}
        onSubmit={handleAdd}
        onCancel={() => setShowAddModal(false)}
      />
    </Modal>

    <Modal
      isOpen={showEditModal}
      onClose={() => {
        setShowEditModal(false);
        setSelectedItem(null);
      }}
      title={`Edit ${activeTab === 'sessions' ? 'Academic Session' : activeTab === 'classes' ? 'Class' : 'Subject'}`}
    >
      <AcademicForm
        type={activeTab}
        item={selectedItem}
        onSubmit={handleEdit}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
      />
    </Modal>

    <DeleteConfirmation
      isOpen={showDeleteConfirm}
      onClose={() => {
        setShowDeleteConfirm(false);
        setSelectedItem(null);
      }}
      onConfirm={handleDelete}
      title={`Delete ${activeTab}`}
      message={`Are you sure you want to delete this ${activeTab}? This action cannot be undone.`}
    />

    <Toast
      show={toast.show}
      type={toast.type}
      message={toast.message}
      onClose={() => setToast({ ...toast, show: false })}
    />
    </div>
  );
}

// Academic Form Component
function AcademicForm({ type, item, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState(() => {
    if (type === 'sessions') {
      return {
        name: item?.name || '',
        startDate: item?.startDate || '',
        endDate: item?.endDate || '',
        isCurrent: item?.isCurrent || false,
      };
    } else if (type === 'classes') {
      return {
        name: item?.name || '',
        capacity: item?.capacity || '',
      };
    } else {
      return {
        name: item?.name || '',
        code: item?.code || '',
        type: item?.type || 'Core',
        classId: item?.classId || '',
      };
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (type === 'sessions') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Session Name *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Academic Year 2024-2025"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input
              type="date"
              className="input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input
              type="date"
              className="input"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isCurrent"
            checked={formData.isCurrent}
            onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
            className="rounded text-primary-600"
          />
          <label htmlFor="isCurrent" className="text-sm text-charcoal-700">
            Set as current academic session
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{item ? 'Update' : 'Create'}</button>
        </div>
      </form>
    );
  }

  if (type === 'classes') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Class Name *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Class 1, Class 2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Default Capacity</label>
          <input
            type="number"
            className="input"
            placeholder="e.g., 40"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{item ? 'Update' : 'Create'}</button>
        </div>
      </form>
    );
  }

  // Subjects form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Subject Name *</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Mathematics"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Subject Code *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., MATH"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
          />
        </div>
        <div>
          <label className="label">Type *</label>
          <select
            className="input"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="Core">Core</option>
            <option value="Elective">Elective</option>
            <option value="Activity">Activity</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Class *</label>
        <select
          className="input"
          value={formData.classId}
          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
          required
        >
          <option value="">Select class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{item ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
