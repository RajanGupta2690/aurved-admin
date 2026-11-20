import { useState } from 'react';
import { Calendar, Plus, Eye, Edit, FileText, Trash2 } from 'lucide-react';
import { examinations, classes } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

export default function ExaminationsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

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

  const handleAddExam = (data: any) => {
    console.log('Adding exam:', data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: 'Examination created successfully!' });
  };

  const handleEditExam = (data: any) => {
    console.log('Editing exam:', data);
    setShowEditModal(false);
    setSelectedExam(null);
    setToast({ show: true, type: 'success', message: 'Examination updated successfully!' });
  };

  const handleDeleteExam = () => {
    console.log('Deleting exam:', selectedExam);
    setShowDeleteConfirm(false);
    setSelectedExam(null);
    setToast({ show: true, type: 'success', message: 'Examination deleted successfully!' });
  };

  const handleView = (exam: any) => {
    setSelectedExam(exam);
    setShowViewModal(true);
  };

  const handleEdit = (exam: any) => {
    setSelectedExam(exam);
    setShowEditModal(true);
  };

  const handleDeleteClick = (exam: any) => {
    setSelectedExam(exam);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Examinations</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage examinations, schedules, and results</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
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
                <button 
                  className="btn-secondary flex items-center gap-2 text-sm"
                  onClick={() => handleView(exam)}
                >
                  <Eye size={16} />
                  View
                </button>
                <button 
                  className="btn-ghost flex items-center gap-2 text-sm"
                  onClick={() => handleEdit(exam)}
                >
                  <Edit size={16} />
                  Edit
                </button>
                {exam.status === 'completed' && (
                  <button className="btn-ghost flex items-center gap-2 text-sm text-primary-600">
                    <FileText size={16} />
                    Results
                  </button>
                )}
                <button 
                  className="text-red-600 hover:bg-red-50 text-sm py-1 px-2 rounded flex items-center gap-2"
                  onClick={() => handleDeleteClick(exam)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
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

      {/* Add Exam Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Examination"
      >
        <ExamForm
          onSubmit={handleAddExam}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Exam Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExam(null);
        }}
        title="Edit Examination"
      >
        <ExamForm
          exam={selectedExam}
          onSubmit={handleEditExam}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedExam(null);
          }}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedExam(null);
        }}
        title="Examination Details"
      >
        {selectedExam && (
          <ExamDetails
            exam={selectedExam}
            onClose={() => {
              setShowViewModal(false);
              setSelectedExam(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedExam(null);
        }}
        onConfirm={handleDeleteExam}
        title="Delete Examination"
        message={`Are you sure you want to delete "${selectedExam?.name}"? This action cannot be undone.`}
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

// Exam Form Component
function ExamForm({ exam, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: exam?.name || '',
    examType: exam?.examType || 'unit_test',
    startDate: exam?.startDate || '',
    endDate: exam?.endDate || '',
    classIds: exam?.classIds || [],
    status: exam?.status || 'upcoming',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleClass = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((id: string) => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Examination Name *</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Mid-Term Examination 2024"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Exam Type *</label>
          <select
            className="input"
            value={formData.examType}
            onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
            required
          >
            <option value="unit_test">Unit Test</option>
            <option value="mid_term">Mid-Term</option>
            <option value="final">Final</option>
            <option value="half_yearly">Half-Yearly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className="label">Status *</label>
          <select
            className="input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
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

      <div>
        <label className="label">Select Classes *</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {classes.map(cls => (
            <label
              key={cls.id}
              className="flex items-center gap-2 p-2 border border-warm-200 rounded hover:bg-warm-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.classIds.includes(cls.id)}
                onChange={() => toggleClass(cls.id)}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-charcoal-900">{cls.name}</span>
            </label>
          ))}
        </div>
        {formData.classIds.length === 0 && (
          <p className="text-xs text-red-600 mt-1">Please select at least one class</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn-primary"
          disabled={formData.classIds.length === 0}
        >
          {exam ? 'Update Examination' : 'Create Examination'}
        </button>
      </div>
    </form>
  );
}

// Exam Details Component
function ExamDetails({ exam, onClose }: any) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-warm-50 rounded-lg border border-warm-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-charcoal-600">Exam Type</p>
            <p className="font-medium text-charcoal-900 capitalize">
              {exam.examType.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-charcoal-600">Status</p>
            <span className={`badge ${
              exam.status === 'completed' ? 'badge-success' :
              exam.status === 'ongoing' ? 'badge-info' :
              exam.status === 'upcoming' ? 'badge-warning' :
              'badge-error'
            }`}>
              {exam.status}
            </span>
          </div>
          <div>
            <p className="text-charcoal-600">Start Date</p>
            <p className="font-medium text-charcoal-900">
              {new Date(exam.startDate).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-charcoal-600">End Date</p>
            <p className="font-medium text-charcoal-900">
              {new Date(exam.endDate).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-3">Classes</h3>
        <div className="flex flex-wrap gap-2">
          {exam.classIds.map((classId: string) => {
            const cls = classes.find(c => c.id === classId);
            return (
              <span key={classId} className="badge badge-info">
                {cls?.name || classId}
              </span>
            );
          })}
        </div>
      </div>

      {exam.status === 'upcoming' && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800">
            📅 Examination starts in {Math.ceil((new Date(exam.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
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
