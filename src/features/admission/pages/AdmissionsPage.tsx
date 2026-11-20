import { useState } from 'react';
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, Phone, Mail } from 'lucide-react';
import { enquiries, applications, classes } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = useState<'enquiries' | 'applications'>('enquiries');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const handleAdd = (data: any) => {
    console.log('Adding:', data);
    setShowAddModal(false);
    setToast({ 
      show: true, 
      type: 'success', 
      message: `${activeTab === 'enquiries' ? 'Enquiry' : 'Application'} added successfully!` 
    });
  };

  const handleDelete = () => {
    console.log('Deleting:', selectedItem);
    setToast({ 
      show: true, 
      type: 'success', 
      message: `${activeTab === 'enquiries' ? 'Enquiry' : 'Application'} deleted successfully!` 
    });
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    console.log('Updating status:', id, newStatus);
    setToast({ show: true, type: 'success', message: 'Status updated successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Admissions</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage enquiries and applications</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          {activeTab === 'enquiries' ? 'New Enquiry' : 'New Application'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Total Enquiries</p>
          <p className="text-2xl font-bold text-charcoal-950">{enquiries.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Active Applications</p>
          <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">
            {applications.filter(a => a.status === 'approved').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {applications.filter(a => a.status === 'under_review').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0">
        <div className="border-b border-warm-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('enquiries')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'enquiries'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Enquiries ({enquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Applications ({applications.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'enquiries' ? (
            <div className="space-y-4">
              {enquiries.map(enquiry => (
                <div key={enquiry.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-charcoal-950">{enquiry.studentName}</h3>
                        <span className={`badge ${
                          enquiry.status === 'new' ? 'badge-info' :
                          enquiry.status === 'contacted' ? 'badge-warning' :
                          enquiry.status === 'converted' ? 'badge-success' : 'badge-error'
                        }`}>
                          {enquiry.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-charcoal-500">Parent</p>
                          <p className="font-medium">{enquiry.parentName}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Phone</p>
                          <p className="font-medium">{enquiry.phone}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Email</p>
                          <p className="font-medium text-xs">{enquiry.email}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Date</p>
                          <p className="font-medium">{new Date(enquiry.enquiryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-sm py-1 px-3">View Details</button>
                    <button 
                      onClick={() => handleStatusUpdate(enquiry.id, 'contacted')}
                      className="btn-ghost text-sm py-1 px-3"
                    >
                      Mark Contacted
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedItem(enquiry);
                        setShowDeleteConfirm(true);
                      }}
                      className="btn-ghost text-sm py-1 px-3 text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-charcoal-950">{app.studentName}</h3>
                        <span className={`badge ${
                          app.status === 'approved' ? 'badge-success' :
                          app.status === 'rejected' ? 'badge-error' : 'badge-warning'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-charcoal-500">Application No</p>
                          <p className="font-medium">{app.applicationNumber}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Class</p>
                          <p className="font-medium">{classes.find(c => c.id === app.appliedForClass)?.name}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Documents</p>
                          <p className="font-medium">{app.documents?.length || 0} uploaded</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Date</p>
                          <p className="font-medium">{new Date(app.applicationDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-sm py-1 px-3">View Application</button>
                    {app.status === 'under_review' && (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(app.id, 'approved')}
                          className="btn-ghost text-sm py-1 px-3 text-green-600"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(app.id, 'rejected')}
                          className="btn-ghost text-sm py-1 px-3 text-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={activeTab === 'enquiries' ? 'New Enquiry' : 'New Application'}
        size="lg"
      >
        {activeTab === 'enquiries' ? (
          <EnquiryForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
        ) : (
          <ApplicationForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
        )}
      </Modal>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Delete ${activeTab === 'enquiries' ? 'Enquiry' : 'Application'}`}
        message="Are you sure? This action cannot be undone."
        itemName={selectedItem?.studentName}
      />

      <Toast
        isOpen={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        type={toast.type}
        message={toast.message}
      />
    </div>
  );
}

function EnquiryForm({ onSubmit, onCancel }: any) {
  const [data, setData] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    classInterested: classes[0]?.id || '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Student Name *</label>
          <input required value={data.studentName} onChange={(e) => setData({...data, studentName: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Parent Name *</label>
          <input required value={data.parentName} onChange={(e) => setData({...data, parentName: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone *</label>
          <input required type="tel" value={data.phone} onChange={(e) => setData({...data, phone: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input type="email" value={data.email} onChange={(e) => setData({...data, email: e.target.value})} className="input" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Class Interested *</label>
          <select required value={data.classInterested} onChange={(e) => setData({...data, classInterested: e.target.value})} className="input">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Submit Enquiry</button>
      </div>
    </form>
  );
}

function ApplicationForm({ onSubmit, onCancel }: any) {
  const [data, setData] = useState({
    studentName: '',
    dateOfBirth: '',
    gender: 'male',
    classApplied: classes[0]?.id || '',
    parentName: '',
    phone: '',
    email: '',
    address: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Student Name *</label>
          <input required value={data.studentName} onChange={(e) => setData({...data, studentName: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth *</label>
          <input required type="date" value={data.dateOfBirth} onChange={(e) => setData({...data, dateOfBirth: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Gender *</label>
          <select required value={data.gender} onChange={(e) => setData({...data, gender: e.target.value})} className="input">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Class Applied *</label>
          <select required value={data.classApplied} onChange={(e) => setData({...data, classApplied: e.target.value})} className="input">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Parent Name *</label>
          <input required value={data.parentName} onChange={(e) => setData({...data, parentName: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone *</label>
          <input required type="tel" value={data.phone} onChange={(e) => setData({...data, phone: e.target.value})} className="input" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input type="email" value={data.email} onChange={(e) => setData({...data, email: e.target.value})} className="input" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Address</label>
          <textarea value={data.address} onChange={(e) => setData({...data, address: e.target.value})} className="input" rows={3} />
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Submit Application</button>
      </div>
    </form>
  );
}
