import { useState } from 'react';
import { Search, Plus, BookOpen, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { homeworkList, classes } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

export default function HomeworkPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  // Filter homework
  const filteredHomework = homeworkList.filter(hw => {
    const matchesSearch = 
      hw.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || hw.status === filterStatus;
    const matchesClass = filterClass === 'all' || hw.classId === filterClass;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  // Get class name
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || classId;
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'completed':
        return <span className="badge badge-info">Completed</span>;
      case 'overdue':
        return <span className="badge badge-error">Overdue</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  // Calculate stats
  const stats = {
    total: homeworkList.length,
    active: homeworkList.filter(hw => hw.status === 'active').length,
    completed: homeworkList.filter(hw => hw.status === 'completed').length,
    overdue: homeworkList.filter(hw => hw.status === 'overdue').length,
  };

  const handleAddHomework = (data: any) => {
    console.log('Adding homework:', data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: 'Homework created successfully!' });
  };

  const handleEditHomework = (data: any) => {
    console.log('Editing homework:', data);
    setShowEditModal(false);
    setSelectedHomework(null);
    setToast({ show: true, type: 'success', message: 'Homework updated successfully!' });
  };

  const handleDeleteHomework = () => {
    console.log('Deleting homework:', selectedHomework);
    setShowDeleteConfirm(false);
    setSelectedHomework(null);
    setToast({ show: true, type: 'success', message: 'Homework deleted successfully!' });
  };

  const handleViewDetails = (homework: any) => {
    setSelectedHomework(homework);
    setShowViewModal(true);
  };

  const handleEdit = (homework: any) => {
    setSelectedHomework(homework);
    setShowEditModal(true);
  };

  const handleDeleteClick = (homework: any) => {
    setSelectedHomework(homework);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Homework Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Create and manage homework assignments for students
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Create Homework
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.total}</p>
          <p className="text-sm text-charcoal-600">Total Assignments</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.active}</p>
          <p className="text-sm text-charcoal-600">Active</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.completed}</p>
          <p className="text-sm text-charcoal-600">Completed</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.overdue}</p>
          <p className="text-sm text-charcoal-600">Overdue</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search homework by title, subject, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="input md:w-40"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input md:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Homework List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredHomework.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={48} className="mx-auto text-charcoal-300 mb-4" />
            <p className="text-charcoal-500">No homework assignments found</p>
          </div>
        ) : (
          filteredHomework.map((homework) => (
            <div key={homework.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen size={20} className="text-primary-600" />
                    <h3 className="text-lg font-semibold text-charcoal-950">
                      {homework.title}
                    </h3>
                    {getStatusBadge(homework.status)}
                  </div>
                  
                  <p className="text-sm text-charcoal-600 mb-4">
                    {homework.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-600">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} />
                      <span>{homework.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Class:</span>
                      <span>{getClassName(homework.classId)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Assigned: {new Date(homework.assignedDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>Due: {new Date(homework.dueDate).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {homework.attachments && homework.attachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-primary-600">
                      <span>📎 {homework.attachments.length} attachment(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button 
                    className="btn-secondary text-sm py-1 px-3"
                    onClick={() => handleViewDetails(homework)}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn-ghost text-sm py-1 px-3 flex items-center gap-1"
                    onClick={() => handleEdit(homework)}
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button 
                    className="text-red-600 hover:bg-red-50 text-sm py-1 px-3 rounded flex items-center gap-1"
                    onClick={() => handleDeleteClick(homework)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Submission Stats */}
              {homework.submissions && (
                <div className="mt-4 pt-4 border-t border-warm-200">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-charcoal-600">Submissions: </span>
                      <span className="font-semibold text-charcoal-950">
                        {homework.submissions.submitted}/{homework.submissions.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-charcoal-600">Pending: </span>
                      <span className="font-semibold text-orange-600">
                        {homework.submissions.total - homework.submissions.submitted}
                      </span>
                    </div>
                    {homework.submissions.graded > 0 && (
                      <div>
                        <span className="text-charcoal-600">Graded: </span>
                        <span className="font-semibold text-green-600">
                          {homework.submissions.graded}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-charcoal-950 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {homeworkList.slice(0, 5).map(hw => (
            <div key={hw.id} className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen size={16} className="text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-charcoal-900">{hw.title}</p>
                  <p className="text-xs text-charcoal-600">{hw.subject} - {getClassName(hw.classId)}</p>
                </div>
              </div>
              <div className="text-xs text-charcoal-500">
                {new Date(hw.assignedDate).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Homework Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Homework"
      >
        <HomeworkForm
          onSubmit={handleAddHomework}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Homework Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedHomework(null);
        }}
        title="Edit Homework"
      >
        <HomeworkForm
          homework={selectedHomework}
          onSubmit={handleEditHomework}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedHomework(null);
          }}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedHomework(null);
        }}
        title="Homework Details"
      >
        {selectedHomework && (
          <HomeworkDetails
            homework={selectedHomework}
            onClose={() => {
              setShowViewModal(false);
              setSelectedHomework(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedHomework(null);
        }}
        onConfirm={handleDeleteHomework}
        title="Delete Homework"
        message={`Are you sure you want to delete "${selectedHomework?.title}"? This action cannot be undone.`}
      />

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

// Homework Form Component
function HomeworkForm({ homework, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: homework?.title || '',
    subject: homework?.subject || '',
    classId: homework?.classId || '',
    description: homework?.description || '',
    assignedDate: homework?.assignedDate || new Date().toISOString().split('T')[0],
    dueDate: homework?.dueDate || '',
    status: homework?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input
          type="text"
          className="input"
          placeholder="Enter homework title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Subject *</label>
          <select
            className="input"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          >
            <option value="">Select subject</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Social Studies">Social Studies</option>
            <option value="Computer Science">Computer Science</option>
          </select>
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
      </div>

      <div>
        <label className="label">Description *</label>
        <textarea
          className="input"
          rows={4}
          placeholder="Enter homework description and instructions"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assigned Date *</label>
          <input
            type="date"
            className="input"
            value={formData.assignedDate}
            onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Due Date *</label>
          <input
            type="date"
            className="input"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Status *</label>
        <select
          className="input"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          required
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {homework ? 'Update Homework' : 'Create Homework'}
        </button>
      </div>
    </form>
  );
}

// Homework Details Component
function HomeworkDetails({ homework, onClose }: any) {
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || classId;
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-warm-50 rounded-lg border border-warm-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-charcoal-600">Subject</p>
            <p className="font-medium text-charcoal-900">{homework.subject}</p>
          </div>
          <div>
            <p className="text-charcoal-600">Class</p>
            <p className="font-medium text-charcoal-900">{getClassName(homework.classId)}</p>
          </div>
          <div>
            <p className="text-charcoal-600">Assigned Date</p>
            <p className="font-medium text-charcoal-900">
              {new Date(homework.assignedDate).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-charcoal-600">Due Date</p>
            <p className="font-medium text-charcoal-900">
              {new Date(homework.dueDate).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-charcoal-600">Status</p>
            <span className={`badge ${
              homework.status === 'active' ? 'badge-success' :
              homework.status === 'completed' ? 'badge-info' :
              'badge-error'
            }`}>
              {homework.status}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-2">Description</h3>
        <p className="text-sm text-charcoal-700">{homework.description}</p>
      </div>

      {homework.submissions && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal-900 mb-3">Submission Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{homework.submissions.total}</p>
              <p className="text-xs text-charcoal-600">Total Students</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{homework.submissions.submitted}</p>
              <p className="text-xs text-charcoal-600">Submitted</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-600">
                {homework.submissions.total - homework.submissions.submitted}
              </p>
              <p className="text-xs text-charcoal-600">Pending</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="btn-secondary">
          Close
        </button>
      </div>
    </div>
  );
}
