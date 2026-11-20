import { useState } from 'react';
import { Search, Plus, Phone, Mail, User, Users, MapPin, Briefcase } from 'lucide-react';
import { parents, students } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

export default function ParentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  // Filter parents based on search
  const filteredParents = parents.filter(parent => 
    parent.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.motherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.fatherPhone?.includes(searchTerm) ||
    parent.motherPhone?.includes(searchTerm) ||
    parent.fatherEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.motherEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get student names for a parent
  const getStudentNames = (studentIds: string[]) => {
    return studentIds
      .map(id => students.find(s => s.id === id)?.fullName)
      .filter(Boolean)
      .join(', ');
  };

  const handleAdd = (data: any) => {
    console.log('Adding parent:', data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: 'Parent added successfully!' });
  };

  const handleDelete = () => {
    console.log('Deleting parent:', selectedParent);
    setToast({ show: true, type: 'success', message: 'Parent deleted successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Parents Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Manage parent information and communication
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Parent
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{parents.length}</p>
          <p className="text-sm text-charcoal-600">Total Parents</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Phone className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">
            {parents.filter(p => p.fatherPhone || p.motherPhone).length}
          </p>
          <p className="text-sm text-charcoal-600">Verified Contacts</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Mail className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">
            {parents.filter(p => p.fatherEmail || p.motherEmail).length}
          </p>
          <p className="text-sm text-charcoal-600">Email Registered</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <User className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{students.length}</p>
          <p className="text-sm text-charcoal-600">Total Students</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search by parent name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button className="btn-secondary">
            Export List
          </button>
        </div>
      </div>

      {/* Parents Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Parent Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Occupation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Children
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-warm-200">
              {filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-charcoal-500">
                    No parents found
                  </td>
                </tr>
              ) : (
                filteredParents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-blue-600" />
                          <span className="font-medium text-charcoal-900">
                            {parent.fatherName || 'N/A'}
                          </span>
                        </div>
                        {parent.motherName && (
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-pink-600" />
                            <span className="font-medium text-charcoal-900">
                              {parent.motherName}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {parent.fatherPhone && (
                          <div className="flex items-center gap-2 text-sm text-charcoal-600">
                            <Phone size={14} />
                            {parent.fatherPhone}
                          </div>
                        )}
                        {parent.fatherEmail && (
                          <div className="flex items-center gap-2 text-sm text-charcoal-600">
                            <Mail size={14} />
                            {parent.fatherEmail}
                          </div>
                        )}
                        {parent.motherPhone && parent.motherPhone !== parent.fatherPhone && (
                          <div className="flex items-center gap-2 text-sm text-charcoal-600">
                            <Phone size={14} />
                            {parent.motherPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {parent.fatherOccupation && (
                          <div className="flex items-center gap-2 text-sm text-charcoal-600">
                            <Briefcase size={14} />
                            {parent.fatherOccupation}
                          </div>
                        )}
                        {parent.motherOccupation && (
                          <div className="flex items-center gap-2 text-sm text-charcoal-600">
                            <Briefcase size={14} />
                            {parent.motherOccupation}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-charcoal-900">
                        <Users size={14} className="text-primary-600" />
                        {getStudentNames(parent.studentIds)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="btn-ghost text-sm py-1 px-3">
                          View
                        </button>
                        <button className="btn-ghost text-sm py-1 px-3">
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedParent(parent);
                            setShowDeleteConfirm(true);
                          }}
                          className="btn-ghost text-sm py-1 px-3 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Address Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-charcoal-950 mb-4">Recent Addresses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredParents.slice(0, 4).map((parent) => (
            <div key={parent.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary-600 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-charcoal-950 mb-1">
                    {parent.fatherName || parent.motherName}
                  </p>
                  <p className="text-sm text-charcoal-600">{parent.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Parent" size="lg">
        <ParentForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Parent"
        message="Are you sure you want to delete this parent record?"
        itemName={selectedParent?.fatherName || selectedParent?.motherName}
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

function ParentForm({ onSubmit, onCancel }: any) {
  const [data, setData] = useState({
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    motherOccupation: '',
    address: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-charcoal-950">Father's Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Father's Name *</label>
            <input required value={data.fatherName} onChange={(e) => setData({...data, fatherName: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone *</label>
            <input required type="tel" value={data.fatherPhone} onChange={(e) => setData({...data, fatherPhone: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={data.fatherEmail} onChange={(e) => setData({...data, fatherEmail: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Occupation</label>
            <input value={data.fatherOccupation} onChange={(e) => setData({...data, fatherOccupation: e.target.value})} className="input" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-charcoal-950">Mother's Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mother's Name</label>
            <input value={data.motherName} onChange={(e) => setData({...data, motherName: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input type="tel" value={data.motherPhone} onChange={(e) => setData({...data, motherPhone: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={data.motherEmail} onChange={(e) => setData({...data, motherEmail: e.target.value})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Occupation</label>
            <input value={data.motherOccupation} onChange={(e) => setData({...data, motherOccupation: e.target.value})} className="input" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Address *</label>
        <textarea required value={data.address} onChange={(e) => setData({...data, address: e.target.value})} className="input" rows={3} />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Add Parent</button>
      </div>
    </form>
  );
}
