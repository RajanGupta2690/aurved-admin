import { useState } from 'react';
import { DollarSign, Search, Download, Plus, Eye, CreditCard } from 'lucide-react';
import { students, fees, classes } from '../../../data/mockData';

export default function FeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
          <button className="btn-primary flex items-center gap-2">
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
                      <button className="p-2 hover:bg-warm-100 rounded-lg transition-colors" title="View Details">
                        <Eye size={16} className="text-charcoal-600" />
                      </button>
                      <button className="p-2 hover:bg-primary-50 rounded-lg transition-colors" title="Collect Payment">
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
    </div>
  );
}
