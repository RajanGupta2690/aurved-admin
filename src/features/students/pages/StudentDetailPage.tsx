import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Phone, MapPin, Calendar, User } from 'lucide-react';
import { classes, attendanceRecords, fees } from '../../../data/mockData';
import { studentActions, useStudents } from '../../../core/api/studentStore';
import Modal from '../../../shared/components/Modal';
import Toast from '../../../shared/components/Toast';
import StudentForm from '../components/StudentForm';
import type { StudentFormValues } from '../components/StudentForm';
import StudentParentSummary from '../components/StudentParentSummary';
import StudentParentsPanel from '../components/StudentParentsPanel';
import { useState } from 'react';
import { formatDate } from '../../../core/i18n/format';

export default function StudentDetailPage() {
  const { id } = useParams();
  const students = useStudents();
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  
  const student = students.find(s => s.id === id);
  const studentClass = student ? classes.find(c => c.id === student.classId) : null;
  const section = studentClass?.sections.find(s => s.id === student?.sectionId);
  const studentAttendance = attendanceRecords.filter(a => a.studentId === id);
  const studentFees = fees.filter(f => f.studentId === id);

  if (!student) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <p className="text-charcoal-600">Student not found</p>
          <Link to="/students" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal Information' },
    { id: 'parent', label: 'Parent/Guardian' },
    { id: 'academic', label: 'Academic' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'fees', label: 'Fees' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/students" aria-label="Back to students" className="p-2 hover:bg-warm-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-charcoal-950">Student Details</h1>
            <p className="text-sm text-charcoal-600 mt-1">School student ID: {student.admissionNumber}</p>
          </div>
        </div>
        <button type="button" className="btn-primary flex items-center gap-2" onClick={() => setEditing(true)}>
          <Pencil size={18} aria-hidden="true" />
          Edit student
        </button>
      </div>
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit student" size="lg">
        <StudentForm
          mode="edit"
          initial={student}
          students={students}
          onCancel={() => setEditing(false)}
          onSubmit={(form: StudentFormValues) => {
            studentActions.update(student.id, {
              firstName: form.firstName,
              lastName: form.lastName,
              fullName: `${form.firstName} ${form.lastName}`.trim(),
              dateOfBirth: form.dateOfBirth,
              gender: form.gender as typeof student.gender,
              bloodGroup: form.bloodGroup || undefined,
              address: form.address,
              email: form.email.trim() || undefined,
              phone: form.phone.trim() || undefined,
              classId: form.classId,
              sectionId: form.sectionId,
              rollNumber: form.rollNumber,
            });
            setEditing(false);
            setToast({ show: true, message: 'Student details saved.' });
          }}
        />
      </Modal>
      <Toast show={toast.show} type="success" message={toast.message} onClose={() => setToast((previous) => ({ ...previous, show: false }))} />

      {/* Student Profile Card */}
      <div className="card">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-3xl flex-shrink-0">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-charcoal-950">{student.fullName}</h2>
                <p className="text-charcoal-600 mt-1">
                  {studentClass?.name} - Section {section?.name} • Roll No: {student.rollNumber}
                </p>
              </div>
              <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                {student.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-charcoal-400" />
                <div>
                  <p className="text-charcoal-500 text-xs">Date of Birth</p>
                  <p className="text-charcoal-900 font-medium">
                    {formatDate(student.dateOfBirth)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-charcoal-400" />
                <div>
                  <p className="text-charcoal-500 text-xs">Gender</p>
                  <p className="text-charcoal-900 font-medium capitalize">{student.gender}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-charcoal-400" />
                <div>
                  <p className="text-charcoal-500 text-xs">Phone</p>
                  <p className="text-charcoal-900 font-medium">{student.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-charcoal-400" />
                <div>
                  <p className="text-charcoal-500 text-xs">City</p>
                  <p className="text-charcoal-900 font-medium">{student.city}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-warm-200 overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-charcoal-950 mb-4">Personal Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-charcoal-500">Full Name</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-charcoal-500">Date of Birth</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1">
                        {formatDate(student.dateOfBirth)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-charcoal-500">Gender</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1 capitalize">{student.gender}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-charcoal-500">Blood Group</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.bloodGroup || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-charcoal-950 mb-4">Academic Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-charcoal-500">Admission Number</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.admissionNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-charcoal-500">Class & Section</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1">
                        {studentClass?.name} - Section {section?.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-charcoal-500">Roll Number</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.rollNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-charcoal-500">Admission Date</dt>
                      <dd className="text-sm text-charcoal-900 font-medium mt-1">
                        {formatDate(student.admissionDate)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <StudentParentSummary student={student} onManage={() => setActiveTab('parent')} />
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-charcoal-500">First Name</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.firstName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">Last Name</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.lastName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">Date of Birth</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">
                    {formatDate(student.dateOfBirth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">Gender</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1 capitalize">{student.gender}</dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">Blood Group</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.bloodGroup || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">Phone</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.phone || 'N/A'}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm text-charcoal-500">Address</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.address}</dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">City</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.city}</dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">State</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.state}</dd>
                </div>
                <div>
                  <dt className="text-sm text-charcoal-500">Pincode</dt>
                  <dd className="text-sm text-charcoal-900 font-medium mt-1">{student.pincode}</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'parent' && <StudentParentsPanel student={student} />}

          {activeTab === 'fees' && (
            <div className="space-y-4">
              {studentFees.length > 0 ? (
                studentFees.map(fee => (
                  <div key={fee.id} className="p-4 bg-warm-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-charcoal-900">Fee Details</h4>
                      <span className={`badge ${
                        fee.status === 'paid' ? 'badge-success' : 
                        fee.status === 'pending' ? 'badge-warning' : 
                        'badge-error'
                      }`}>
                        {fee.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-charcoal-500">Total Amount</p>
                        <p className="text-lg font-bold text-charcoal-900 mt-1">₹{fee.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-charcoal-500">Paid Amount</p>
                        <p className="text-lg font-bold text-emerald-600 mt-1">₹{fee.paidAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-charcoal-500">Pending Amount</p>
                        <p className="text-lg font-bold text-orange-600 mt-1">₹{fee.pendingAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-charcoal-500 py-8">No fee records found</p>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <p className="text-sm text-charcoal-600 mb-4">
                Recent attendance records for {student.fullName}
              </p>
              {studentAttendance.length > 0 ? (
                <div className="space-y-2">
                  {studentAttendance.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-charcoal-900">
                          {new Date(record.date).toLocaleDateString('en-IN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {record.remarks && (
                          <p className="text-xs text-charcoal-600 mt-1">{record.remarks}</p>
                        )}
                      </div>
                      <span className={`badge ${
                        record.status === 'present' ? 'badge-success' : 
                        record.status === 'absent' ? 'badge-error' : 
                        'badge-warning'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-charcoal-500 py-8">No attendance records found</p>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <p className="text-charcoal-500">No documents uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
