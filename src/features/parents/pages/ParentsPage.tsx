import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Phone, Mail, User, Users, MapPin, Briefcase } from 'lucide-react';
import { students } from '../../../data/mockData';
import { useFamily } from '../../../core/api/familyStore';
import { parentDisplayName, parentFullLabel, searchParents } from '../../../core/api/familyLogic';
import type { Parent } from '../../../types';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';
import AddParentDialog from '../components/AddParentDialog';
import ParentEditDialog from '../components/ParentEditDialog';

type ToastState = { show: boolean; type: 'success' | 'error'; message: string };

export default function ParentsPage() {
  const { family, actions } = useFamily();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' });

  const notify = (type: ToastState['type'], message: string) => setToast({ show: true, type, message });

  const parents = family.parents;
  const filteredParents = searchParents(family, searchTerm);
  const editing = editId ? parents.find((parent) => parent.id === editId) : undefined;

  // A record that still has children linked is never deleted from here.
  const requestDelete = (parent: Parent) => {
    if (parent.studentIds.length > 0) {
      const count = parent.studentIds.length;
      notify(
        'error',
        `${parentFullLabel(parent)} is linked to ${count} ${count === 1 ? 'student' : 'students'}. Remove the link on the student page first.`,
      );
      return;
    }
    setDeleteTarget(parent);
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
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
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
            {parents.filter(p => p.fatherPhone || p.motherPhone || p.guardianPhone).length}
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
              aria-label="Search parents"
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
                filteredParents.map((parent) => {
                  const children = parent.studentIds
                    .map((id) => students.find((student) => student.id === id))
                    .filter((student): student is (typeof students)[number] => Boolean(student));
                  return (
                    <tr key={parent.id} className="hover:bg-warm-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {parent.fatherName && (
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-blue-600" />
                              <span className="font-medium text-charcoal-900">{parent.fatherName}</span>
                            </div>
                          )}
                          {parent.motherName && (
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-pink-600" />
                              <span className="font-medium text-charcoal-900">{parent.motherName}</span>
                            </div>
                          )}
                          {parent.guardianName && (
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-charcoal-500" />
                              <span className="font-medium text-charcoal-900">
                                {parent.guardianName}
                                {parent.guardianRelation ? ` (${parent.guardianRelation})` : ''}
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
                          {parent.guardianPhone && (
                            <div className="flex items-center gap-2 text-sm text-charcoal-600">
                              <Phone size={14} />
                              {parent.guardianPhone}
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
                        {children.length === 0 ? (
                          <span className="text-sm text-warning-700">No student linked</span>
                        ) : (
                          <ul className="flex flex-col gap-1">
                            {children.map((student) => (
                              <li key={student.id} className="flex items-center gap-2 text-sm">
                                <Users size={14} className="text-primary-600" />
                                <Link to={`/students/${student.id}`} className="text-primary-700 hover:underline">
                                  {student.fullName}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="btn-ghost text-sm py-1 px-3">
                            View
                          </button>
                          <button
                            onClick={() => setEditId(parent.id)}
                            className="btn-ghost text-sm py-1 px-3"
                            aria-label={`Edit ${parentFullLabel(parent)}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => requestDelete(parent)}
                            className="btn-ghost text-sm py-1 px-3 text-red-600"
                            aria-label={`Delete ${parentFullLabel(parent)}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                    {parentDisplayName(parent)}
                  </p>
                  <p className="text-sm text-charcoal-600">{parent.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      {showAdd && (
        <AddParentDialog onClose={() => setShowAdd(false)} onSaved={(message) => notify('success', message)} />
      )}
      {editing && (
        <ParentEditDialog parent={editing} onClose={() => setEditId(null)} onSaved={(message) => notify('success', message)} />
      )}

      <DeleteConfirmation
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          actions.remove(deleteTarget.id);
          notify('success', `${parentFullLabel(deleteTarget)} deleted.`);
        }}
        title="Delete Parent"
        message="This parent record has no student linked. Delete it?"
        itemName={deleteTarget ? parentFullLabel(deleteTarget) : undefined}
      />

      <Toast
        show={toast.show}
        onClose={() => setToast((previous) => ({ ...previous, show: false }))}
        type={toast.type}
        message={toast.message}
      />
    </div>
  );
}
