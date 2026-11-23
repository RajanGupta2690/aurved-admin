import { useState } from 'react';
import { Users, Shield, Plus, Edit, Trash2, Check, X, Search } from 'lucide-react';
import { UserRole, Permission, ROLE_PERMISSIONS } from '../../../core/auth/types';
import Modal from '../../../shared/components/Modal';
import Toast from '../../../shared/components/Toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: UserRole;
  customPermissions?: Permission[];
  assignedClasses?: string[];
  assignedSubjects?: string[];
  phone: string;
  joinDate: string;
  isActive: boolean;
}

// Mock data
const initialStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh@school.com',
    employeeId: 'EMP001',
    role: UserRole.SUPER_ADMIN,
    phone: '+91 98765 43210',
    joinDate: '2020-01-15',
    isActive: true,
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@school.com',
    employeeId: 'EMP002',
    role: UserRole.TEACHER,
    assignedClasses: ['Class 5A', 'Class 6B'],
    assignedSubjects: ['Mathematics', 'Science'],
    phone: '+91 98765 43211',
    joinDate: '2021-03-20',
    isActive: true,
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@school.com',
    employeeId: 'EMP003',
    role: UserRole.LIBRARIAN,
    phone: '+91 98765 43212',
    joinDate: '2021-06-10',
    isActive: true,
  },
  {
    id: '4',
    name: 'Sunita Verma',
    email: 'sunita@school.com',
    employeeId: 'EMP004',
    role: UserRole.ACCOUNTANT,
    phone: '+91 98765 43213',
    joinDate: '2020-08-05',
    isActive: true,
  },
  {
    id: '5',
    name: 'Rahul Singh',
    email: 'rahul@school.com',
    employeeId: 'EMP005',
    role: UserRole.TEACHER,
    assignedClasses: ['Class 7A', 'Class 8A'],
    assignedSubjects: ['English', 'Hindi'],
    phone: '+91 98765 43214',
    joinDate: '2022-01-15',
    isActive: true,
  },
];

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN_STAFF]: 'Admin Staff',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.LIBRARIAN]: 'Librarian',
  [UserRole.ACCOUNTANT]: 'Accountant',
  [UserRole.TRANSPORT_MANAGER]: 'Transport Manager',
  [UserRole.RECEPTIONIST]: 'Receptionist',
};

const roleColors: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-purple-50 text-purple-700 border-purple-200',
  [UserRole.ADMIN_STAFF]: 'bg-blue-50 text-blue-700 border-blue-200',
  [UserRole.TEACHER]: 'bg-green-50 text-green-700 border-green-200',
  [UserRole.LIBRARIAN]: 'bg-orange-50 text-orange-700 border-orange-200',
  [UserRole.ACCOUNTANT]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [UserRole.TRANSPORT_MANAGER]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [UserRole.RECEPTIONIST]: 'bg-pink-50 text-pink-700 border-pink-200',
};

export default function StaffRolesPage() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleChangeRole = (member: StaffMember) => {
    setSelectedStaff(member);
    setShowRoleModal(true);
  };

  const handleUpdateRole = (newRole: UserRole) => {
    if (!selectedStaff) return;
    
    setStaff(staff.map(s => 
      s.id === selectedStaff.id 
        ? { ...s, role: newRole, customPermissions: undefined }
        : s
    ));
    
    setShowRoleModal(false);
    setToast({ show: true, type: 'success', message: `Role updated to ${roleLabels[newRole]}` });
  };

  const handleCustomizePermissions = (member: StaffMember) => {
    setSelectedStaff(member);
    setShowPermissionModal(true);
  };

  const getPermissions = (member: StaffMember): Permission[] => {
    return member.customPermissions || ROLE_PERMISSIONS[member.role];
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Staff Roles & Permissions</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage staff access and permissions</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input"
          >
            <option value="all">All Roles</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredStaff.map(member => (
          <div key={member.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal-950">{member.name}</h3>
                  <p className="text-sm text-charcoal-600">{member.email}</p>
                  <p className="text-xs text-charcoal-500 mt-0.5">ID: {member.employeeId}</p>
                </div>
              </div>
              <span className={`badge ${roleColors[member.role]}`}>
                {roleLabels[member.role]}
              </span>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 mb-4 pb-4 border-b border-warm-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal-600">Phone:</span>
                <span className="text-charcoal-900 font-medium">{member.phone}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal-600">Join Date:</span>
                <span className="text-charcoal-900 font-medium">
                  {new Date(member.joinDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              {member.assignedClasses && (
                <div className="text-sm">
                  <span className="text-charcoal-600">Classes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.assignedClasses.map((cls, idx) => (
                      <span key={idx} className="badge badge-info text-xs">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {member.assignedSubjects && (
                <div className="text-sm">
                  <span className="text-charcoal-600">Subjects:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.assignedSubjects.map((subj, idx) => (
                      <span key={idx} className="badge badge-success text-xs">
                        {subj}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Permissions Summary */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-charcoal-700">Permissions</span>
                <span className="text-xs text-charcoal-500">
                  {getPermissions(member).length} permissions
                </span>
              </div>
              <div className="text-xs text-charcoal-600 bg-warm-50 rounded-lg p-2 max-h-20 overflow-y-auto">
                {member.customPermissions ? (
                  <span className="text-orange-600 font-medium">Custom permissions applied</span>
                ) : (
                  <span>Using default {roleLabels[member.role]} permissions</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleChangeRole(member)}
                className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
              >
                <Shield size={16} />
                Change Role
              </button>
              <button
                onClick={() => handleCustomizePermissions(member)}
                className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Customize
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="card text-center py-12">
          <Users size={48} className="mx-auto text-charcoal-300 mb-4" />
          <p className="text-charcoal-600">No staff members found</p>
        </div>
      )}

      {/* Change Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Change Role"
        size="md"
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="bg-warm-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-charcoal-600">Changing role for:</p>
              <p className="font-semibold text-charcoal-950 mt-1">{selectedStaff.name}</p>
              <p className="text-sm text-charcoal-600">Current: {roleLabels[selectedStaff.role]}</p>
            </div>

            <div className="space-y-2">
              {Object.entries(roleLabels).map(([role, label]) => (
                <button
                  key={role}
                  onClick={() => handleUpdateRole(role as UserRole)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedStaff.role === role
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-warm-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-charcoal-950">{label}</p>
                      <p className="text-xs text-charcoal-600 mt-1">
                        {ROLE_PERMISSIONS[role as UserRole].length} permissions
                      </p>
                    </div>
                    {selectedStaff.role === role && (
                      <Check size={20} className="text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Customize Permissions Modal */}
      <Modal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        title="Customize Permissions"
        size="lg"
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="bg-warm-50 rounded-xl p-4">
              <p className="text-sm text-charcoal-600">Customizing permissions for:</p>
              <p className="font-semibold text-charcoal-950 mt-1">{selectedStaff.name}</p>
              <p className="text-xs text-charcoal-600 mt-1">
                Base Role: {roleLabels[selectedStaff.role]}
              </p>
            </div>

            <p className="text-sm text-charcoal-600">
              Select additional permissions or restrict existing ones:
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.values(Permission).map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-3 p-3 rounded-lg border border-warm-200 hover:bg-warm-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    defaultChecked={getPermissions(selectedStaff).includes(permission)}
                    className="w-4 h-4 text-primary-600 rounded border-warm-300 focus:ring-2 focus:ring-primary-100"
                  />
                  <span className="text-sm text-charcoal-900 font-medium">
                    {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-warm-200">
              <button className="flex-1 btn-secondary" onClick={() => setShowPermissionModal(false)}>
                Cancel
              </button>
              <button className="flex-1 btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
