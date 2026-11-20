import { useState } from 'react';
import { DollarSign, Search, Download, Plus, Eye, CreditCard } from 'lucide-react';
import { students, fees, classes } from '../../../data/mockData';
import Modal from '../../../shared/components/Modal';
import Toast from '../../../shared/components/Toast';

export default function FeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const studentFeeData = students.map(student => {
    const studentFee = fees.find(f => f.studentId === student.id);
    const classData = classes.find(c => c.id === student.classId);
    const section = classData?.sections.find(s => s.id === student.sectionId);
    
    return {
      student,
      fee: studentFee,
      className: classData?.name || 'N/A',
      sectionName: section?.name || 'N/A',
    };
  });

  const filteredData = studentFeeData.filter(item => {
    const matchesSearch = item.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.fee?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalAmount: fees.reduce((sum, f) => sum + f.totalAmount, 0),
    collected: fees.reduce((sum, f) => sum + f.paidAmount, 0),
    pending: fees.reduce((sum, f) => sum + f.pendingAmount, 0),
    overdueCount: fees.filter(f => f.status === 'overdue').length,
  };

  const handleCollectFee = (data: any) => {
    console.log('Collecting fee:', data);
    setShowCollectModal(false);
    setSelectedFeeRecord(null);
    setToast({ show: true, type: 'success', message: 'Payment collected successfully!' });
  };

  const handleViewDetails = (record: any) => {
    setSelectedFeeRecord(record);
    setShowViewModal(true);
  };

  const handleCollectPayment = (record: any) => {
    setSelectedFeeRecord(record);
    setShowCollectModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Fees & Accounts</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage fee collection and payment records</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Export
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => {
            setSelectedFeeRecord(null);
            setShowCollectModal(true);
          }}>
            <Plus size={20} />
            Collect Fee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <p className="text-sm text-charcoal-600">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">₹{(stats.totalAmount / 100000).toFixed(2)}L</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <p className="text-sm text-charcoal-600">Collected</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">₹{(stats.collected / 100000).toFixed(2)}L</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <DollarSign size={20} className="text-orange-600" />
            </div>
            <p className="text-sm text-charcoal-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">₹{(stats.pending / 100000).toFixed(2)}L</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <p className="text-sm text-charcoal-600">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search by student name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">
                  Class
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal-700 uppercase">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal-700 uppercase">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal-700 uppercase">
                  Pending
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-charcoal-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-charcoal-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-warm-200">
              {filteredData.map(({ student, fee, className, sectionName }) => (
                <tr key={student.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-charcoal-900">{student.fullName}</p>
                        <p className="text-xs text-charcoal-500">{student.admissionNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900">
                    {className} - {sectionName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900 text-right font-medium">
                    ₹{fee ? fee.totalAmount.toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 text-right font-medium">
                    ₹{fee ? fee.paidAmount.toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right font-medium">
                    ₹{fee ? fee.pendingAmount.toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {fee ? (
                      <span className={`badge ${
                        fee.status === 'paid' ? 'badge-success' :
                        fee.status === 'pending' ? 'badge-warning' :
                        fee.status === 'partial' ? 'badge-info' :
                        'badge-error'
                      }`}>
                        {fee.status}
                      </span>
                    ) : (
                      <span className="badge">No Record</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="p-2 hover:bg-warm-100 rounded-lg transition-colors" 
                        title="View Details"
                        onClick={() => handleViewDetails({ student, fee, className, sectionName })}
                      >
                        <Eye size={16} className="text-charcoal-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-primary-50 rounded-lg transition-colors" 
                        title="Collect Payment"
                        onClick={() => handleCollectPayment({ student, fee, className, sectionName })}
                      >
                        <CreditCard size={16} className="text-primary-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-charcoal-500">No fee records found</p>
          </div>
        )}
      </div>

      {/* Collect Fee Modal */}
      <Modal
        isOpen={showCollectModal}
        onClose={() => {
          setShowCollectModal(false);
          setSelectedFeeRecord(null);
        }}
        title={selectedFeeRecord ? `Collect Payment - ${selectedFeeRecord.student.fullName}` : 'Collect Fee'}
      >
        <FeeCollectionForm
          feeRecord={selectedFeeRecord}
          onSubmit={handleCollectFee}
          onCancel={() => {
            setShowCollectModal(false);
            setSelectedFeeRecord(null);
          }}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedFeeRecord(null);
        }}
        title="Fee Details"
      >
        {selectedFeeRecord && (
          <FeeDetailsView
            feeRecord={selectedFeeRecord}
            onClose={() => {
              setShowViewModal(false);
              setSelectedFeeRecord(null);
            }}
          />
        )}
      </Modal>

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

// Fee Collection Form Component
function FeeCollectionForm({ feeRecord, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    studentId: feeRecord?.student?.id || '',
    admissionNumber: feeRecord?.student?.admissionNumber || '',
    studentName: feeRecord?.student?.fullName || '',
    className: feeRecord?.className || '',
    amount: '',
    paymentMode: 'cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student Info (if pre-selected) */}
      {feeRecord && (
        <div className="p-4 bg-warm-50 rounded-lg border border-warm-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-charcoal-600">Student</p>
              <p className="font-medium text-charcoal-900">{feeRecord.student.fullName}</p>
            </div>
            <div>
              <p className="text-charcoal-600">Class</p>
              <p className="font-medium text-charcoal-900">{feeRecord.className} - {feeRecord.sectionName}</p>
            </div>
            <div>
              <p className="text-charcoal-600">Total Amount</p>
              <p className="font-medium text-charcoal-900">₹{feeRecord.fee?.totalAmount?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-charcoal-600">Pending Amount</p>
              <p className="font-medium text-orange-600">₹{feeRecord.fee?.pendingAmount?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Student Selection (if not pre-selected) */}
      {!feeRecord && (
        <>
          <div>
            <label className="label">Admission Number *</label>
            <input
              type="text"
              className="input"
              placeholder="Enter admission number"
              value={formData.admissionNumber}
              onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Student Name *</label>
            <input
              type="text"
              className="input"
              placeholder="Enter student name"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              required
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Amount (₹) *</label>
          <input
            type="number"
            className="input"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            min="1"
          />
        </div>
        <div>
          <label className="label">Payment Mode *</label>
          <select
            className="input"
            value={formData.paymentMode}
            onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
            required
          >
            <option value="cash">Cash</option>
            <option value="online">Online Transfer</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
            <option value="upi">UPI</option>
          </select>
        </div>
      </div>

      {formData.paymentMode !== 'cash' && (
        <div>
          <label className="label">Transaction ID / Reference Number</label>
          <input
            type="text"
            className="input"
            placeholder="Enter transaction ID"
            value={formData.transactionId}
            onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
          />
        </div>
      )}

      <div>
        <label className="label">Payment Date *</label>
        <input
          type="date"
          className="input"
          value={formData.paymentDate}
          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="label">Remarks</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Enter any additional notes"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Collect Payment
        </button>
      </div>
    </form>
  );
}

// Fee Details View Component
function FeeDetailsView({ feeRecord, onClose }: any) {
  const paymentHistory = [
    {
      id: 1,
      date: '2024-04-15',
      amount: 5000,
      mode: 'online',
      transactionId: 'TXN123456',
      collectedBy: 'Admin User',
    },
    {
      id: 2,
      date: '2024-05-20',
      amount: 3000,
      mode: 'cash',
      transactionId: 'CASH-001',
      collectedBy: 'Admin User',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="p-4 bg-warm-50 rounded-lg border border-warm-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-charcoal-600">Student</p>
            <p className="font-medium text-charcoal-900">{feeRecord.student.fullName}</p>
          </div>
          <div>
            <p className="text-charcoal-600">Admission Number</p>
            <p className="font-medium text-charcoal-900">{feeRecord.student.admissionNumber}</p>
          </div>
          <div>
            <p className="text-charcoal-600">Class</p>
            <p className="font-medium text-charcoal-900">{feeRecord.className} - {feeRecord.sectionName}</p>
          </div>
          <div>
            <p className="text-charcoal-600">Status</p>
            <span className={`badge ${
              feeRecord.fee?.status === 'paid' ? 'badge-success' :
              feeRecord.fee?.status === 'pending' ? 'badge-warning' :
              feeRecord.fee?.status === 'partial' ? 'badge-info' :
              'badge-error'
            }`}>
              {feeRecord.fee?.status || 'No Record'}
            </span>
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-3">Fee Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-warm-200">
            <span className="text-charcoal-600">Total Fee Amount</span>
            <span className="font-semibold text-charcoal-900">
              ₹{feeRecord.fee?.totalAmount?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-warm-200">
            <span className="text-charcoal-600">Paid Amount</span>
            <span className="font-semibold text-emerald-600">
              ₹{feeRecord.fee?.paidAmount?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-charcoal-600">Pending Amount</span>
            <span className="font-semibold text-orange-600">
              ₹{feeRecord.fee?.pendingAmount?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-3">Payment History</h3>
        <div className="space-y-3">
          {paymentHistory.map((payment) => (
            <div key={payment.id} className="p-3 bg-warm-50 rounded-lg border border-warm-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-charcoal-900">₹{payment.amount.toLocaleString()}</p>
                  <p className="text-xs text-charcoal-600">{payment.date}</p>
                </div>
                <span className="badge badge-success">{payment.mode}</span>
              </div>
              <div className="text-xs text-charcoal-600 space-y-1">
                <p>Transaction ID: {payment.transactionId}</p>
                <p>Collected by: {payment.collectedBy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="btn-secondary">
          Close
        </button>
      </div>
    </div>
  );
}
