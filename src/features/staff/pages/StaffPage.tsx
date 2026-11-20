import { useState } from 'react';
import { Search, Plus, Phone, Mail, User, GraduationCap, Briefcase, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { teachers } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  // Filter staff based on search and role
  const filteredStaff = teachers.filter(staff => {
    const matchesSearch = 
      staff.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.phone?.includes(searchTerm);
    
    const matchesRole = filterRole === 'all' || staff.designation === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter
  const roles = Array.from(new Set(teachers.map(t => t.designation).filter(Boolean)));

  const handleAdd = (data: any) => {
    console.log('Adding staff:', data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: 'Staff member added successfully!' });
  };

  const handleDelete = () => {
    console.log('Deleting staff:', selectedStaff);
    setToast({ show: true, type: 'success', message: 'Staff member deleted successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Staff Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Manage teachers, staff, and employee information
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Staff Member
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
          <p className="text-2xl font-bold text-charcoal-950">{teachers.length}</p>
          <p className="text-sm text-charcoal-600">Total Staff</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">
            {teachers.filter(t => t.status === 'active').length}
          </p>
          <p className="text-sm text-charcoal-600">Active</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Briefcase className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{roles.length}</p>
          <p className="text-sm text-charcoal-600">Departments</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">
            {new Date().toLocaleDateString('en-IN', { month: 'short' })}
          </p>
          <p className="text-sm text-charcoal-600">Current Month</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, employee ID, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <button className="btn-secondary">
            Export List
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                  Joining Date
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
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-charcoal-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-charcoal-900">
                        {staff.employeeId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal-900">{staff.fullName}</p>
                          <p className="text-sm text-charcoal-500">{staff.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-primary-600" />
                        <span className="text-sm text-charcoal-900">{staff.designation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-charcoal-600">
                          <Phone size={14} />
                          {staff.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-charcoal-600">
                          <Mail size={14} />
                          {staff.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-charcoal-600">
                        <Calendar size={14} />
                        {staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {staff.status === 'active' ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-error">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="btn-ghost text-sm py-1 px-3">View</button>
                        <button className="btn-ghost text-sm py-1 px-3">Edit</button>
                        <button 
                          onClick={() => {
                            setSelectedStaff(staff);
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

      {/* Quick Stats by Department */}
      <div className="card">
        <h2 className="text-lg font-semibold text-charcoal-950 mb-4">Staff by Department</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roles.map(role => {
            const count = teachers.filter(t => t.designation === role).length;
            return (
              <div key={role} className="p-4 bg-warm-50 rounded-lg border border-warm-200">
                <p className="text-2xl font-bold text-primary-600 mb-1">{count}</p>
                <p className="text-sm text-charcoal-600">{role}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Staff Member" size="lg">
        <StaffForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Staff Member"
        message="Are you sure you want to delete this staff member?"
        itemName={selectedStaff?.fullName}
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

function StaffForm({ onSubmit, onCancel }: any) {
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: `EMP${Date.now()}`,
    designation: '',
    joiningDate: '',
    gender: 'male',
    qualification: '',
    address: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">First Name *</label>
          <input required value={data.firstName} onChange={(e) => setData({...data, firstName: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Last Name *</label>
          <input required value={data.lastName} onChange={(e) => setData({...data, lastName: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email *</label>
          <input required type="email" value={data.email} onChange={(e) => setData({...data, email: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone *</label>
          <input required type="tel" value={data.phone} onChange={(e) => setData({...data, phone: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Employee ID</label>
          <input value={data.employeeId} onChange={(e) => setData({...data, employeeId: e.target.value})} className="input" readOnly />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Designation *</label>
          <input required value={data.designation} onChange={(e) => setData({...data, designation: e.target.value})} className="input" placeholder="e.g., Teacher, Principal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Joining Date *</label>
          <input required type="date" value={data.joiningDate} onChange={(e) => setData({...data, joiningDate: e.target.value})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Gender *</label>
          <select required value={data.gender} onChange={(e) => setData({...data, gender: e.target.value})} className="input">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Qualification</label>
          <input value={data.qualification} onChange={(e) => setData({...data, qualification: e.target.value})} className="input" placeholder="e.g., B.Ed, M.A." />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Address</label>
          <textarea value={data.address} onChange={(e) => setData({...data, address: e.target.value})} className="input" rows={3} />
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Add Staff</button>
      </div>
    </form>
  );
}
