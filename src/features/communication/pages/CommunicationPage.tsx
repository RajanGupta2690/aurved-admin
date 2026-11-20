import { useState } from 'react';
import { Search, Plus, Bell, Calendar, Users, Eye, Send, Edit, Trash2 } from 'lucide-react';
import { notices, classes } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

export default function CommunicationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  // Filter notices
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = 
      notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || notice.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get unique types
  const types = Array.from(new Set(notices.map(n => n.type).filter(Boolean)));

  // Type badge
  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      announcement: 'badge-info',
      event: 'badge-success',
      holiday: 'badge-warning',
      exam: 'badge-error',
      urgent: 'badge-error',
    };
    return <span className={`badge ${badges[type] || 'badge-info'}`}>{type}</span>;
  };

  // Priority icon
  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <span className="text-red-600 font-bold">!</span>;
    }
    return null;
  };

  const handleAddNotice = (data: any) => {
    console.log('Adding notice:', data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: 'Notice created successfully!' });
  };

  const handleEditNotice = (data: any) => {
    console.log('Editing notice:', data);
    setShowEditModal(false);
    setSelectedNotice(null);
    setToast({ show: true, type: 'success', message: 'Notice updated successfully!' });
  };

  const handleDeleteNotice = () => {
    console.log('Deleting notice:', selectedNotice);
    setShowDeleteConfirm(false);
    setSelectedNotice(null);
    setToast({ show: true, type: 'success', message: 'Notice deleted successfully!' });
  };

  const handleView = (notice: any) => {
    setSelectedNotice(notice);
    setShowViewModal(true);
  };

  const handleEdit = (notice: any) => {
    setSelectedNotice(notice);
    setShowEditModal(true);
  };

  const handleDeleteClick = (notice: any) => {
    setSelectedNotice(notice);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Communication</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Notices, announcements, and school communication
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Create Notice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Bell className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{notices.length}</p>
          <p className="text-sm text-charcoal-600">Total Notices</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Send className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">
            {notices.filter(n => n.publishedDate).length}
          </p>
          <p className="text-sm text-charcoal-600">Published</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">
            {notices.filter(n => n.type === 'event').length}
          </p>
          <p className="text-sm text-charcoal-600">Events</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Users className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">All</p>
          <p className="text-sm text-charcoal-600">Target Audience</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search notices by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Types</option>
            {types.map(type => type && (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <button className="btn-secondary">
            Send Notification
          </button>
        </div>
      </div>

      {/* Notices List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredNotices.length === 0 ? (
          <div className="card text-center py-12">
            <Bell size={48} className="mx-auto text-charcoal-300 mb-4" />
            <p className="text-charcoal-500">No notices found</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div key={notice.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getPriorityIcon(notice.priority)}
                    <Bell size={20} className="text-primary-600" />
                    <h3 className="text-lg font-semibold text-charcoal-950">
                      {notice.title}
                    </h3>
                    {getTypeBadge(notice.type)}
                  </div>

                  <p className="text-sm text-charcoal-600 mb-4">
                    {notice.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        Published: {new Date(notice.publishedDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>Target: {notice.targetAudience}</span>
                    </div>
                    {notice.publishedBy && (
                      <div className="flex items-center gap-2">
                        <span>By: {notice.publishedBy}</span>
                      </div>
                    )}
                  </div>

                  {notice.attachments && notice.attachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-primary-600">
                      <span>📎 {notice.attachments.length} attachment(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button 
                    className="btn-secondary text-sm py-1 px-3 flex items-center gap-2"
                    onClick={() => handleView(notice)}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button 
                    className="btn-ghost text-sm py-1 px-3 flex items-center gap-2"
                    onClick={() => handleEdit(notice)}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button 
                    className="text-red-600 hover:bg-red-50 text-sm py-1 px-3 rounded flex items-center gap-2"
                    onClick={() => handleDeleteClick(notice)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Read Stats */}
              {notice.readBy && (
                <div className="mt-4 pt-4 border-t border-warm-200">
                  <div className="flex items-center gap-2 text-sm text-charcoal-600">
                    <Eye size={16} />
                    <span>Read by {notice.readBy.length} recipient(s)</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Bell size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-950">Send SMS</h3>
              <p className="text-sm text-charcoal-600">Bulk SMS to parents</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Send size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-950">Send Email</h3>
              <p className="text-sm text-charcoal-600">Email notification</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-950">Schedule Event</h3>
              <p className="text-sm text-charcoal-600">Create calendar event</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Notice Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Notice"
      >
        <NoticeForm
          onSubmit={handleAddNotice}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Notice Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedNotice(null);
        }}
        title="Edit Notice"
      >
        <NoticeForm
          notice={selectedNotice}
          onSubmit={handleEditNotice}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedNotice(null);
          }}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedNotice(null);
        }}
        title="Notice Details"
      >
        {selectedNotice && (
          <NoticeDetails
            notice={selectedNotice}
            onClose={() => {
              setShowViewModal(false);
              setSelectedNotice(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedNotice(null);
        }}
        onConfirm={handleDeleteNotice}
        title="Delete Notice"
        message={`Are you sure you want to delete "${selectedNotice?.title}"? This action cannot be undone.`}
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

// Notice Form Component
function NoticeForm({ notice, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    type: notice?.type || 'announcement',
    priority: notice?.priority || 'normal',
    targetAudience: notice?.targetAudience || 'all',
    publishedDate: notice?.publishedDate || new Date().toISOString().split('T')[0],
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
          placeholder="Enter notice title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="label">Content *</label>
        <textarea
          className="input"
          rows={5}
          placeholder="Enter notice content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type *</label>
          <select
            className="input"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="announcement">Announcement</option>
            <option value="event">Event</option>
            <option value="holiday">Holiday</option>
            <option value="exam">Exam</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="label">Priority *</label>
          <select
            className="input"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            required
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Target Audience *</label>
          <select
            className="input"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            required
          >
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
            <option value="staff">Staff</option>
            <option value="teachers">Teachers</option>
          </select>
        </div>
        <div>
          <label className="label">Publish Date *</label>
          <input
            type="date"
            className="input"
            value={formData.publishedDate}
            onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {notice ? 'Update Notice' : 'Create Notice'}
        </button>
      </div>
    </form>
  );
}

// Notice Details Component
function NoticeDetails({ notice, onClose }: any) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-warm-50 rounded-lg border border-warm-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-charcoal-600">Type</p>
            <span className={`badge ${
              notice.type === 'announcement' ? 'badge-info' :
              notice.type === 'event' ? 'badge-success' :
              notice.type === 'holiday' ? 'badge-warning' :
              'badge-error'
            }`}>
              {notice.type}
            </span>
          </div>
          <div>
            <p className="text-charcoal-600">Priority</p>
            <span className={`badge ${
              notice.priority === 'high' ? 'badge-error' :
              notice.priority === 'low' ? 'badge-success' :
              'badge-info'
            }`}>
              {notice.priority}
            </span>
          </div>
          <div>
            <p className="text-charcoal-600">Target Audience</p>
            <p className="font-medium text-charcoal-900 capitalize">{notice.targetAudience}</p>
          </div>
          <div>
            <p className="text-charcoal-600">Published Date</p>
            <p className="font-medium text-charcoal-900">
              {new Date(notice.publishedDate).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-2">Content</h3>
        <p className="text-sm text-charcoal-700">{notice.content}</p>
      </div>

      {notice.readBy && notice.readBy.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal-900 mb-2">Read Statistics</h3>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-800">
              ✓ Read by {notice.readBy.length} recipient(s)
            </p>
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
