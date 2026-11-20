import { useState } from 'react';
import { BarChart3, FileText, Download, Calendar, Users, DollarSign, BookOpen, TrendingUp } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import Toast from '../../../shared/components/Toast';

const reportCategories = [
  {
    title: 'Student Reports',
    icon: <Users size={24} />,
    color: 'blue',
    reports: [
      { name: 'Student List', description: 'Complete student database' },
      { name: 'Attendance Report', description: 'Monthly attendance summary' },
      { name: 'Performance Report', description: 'Academic performance analysis' },
      { name: 'Fee Defaulters', description: 'Students with pending fees' },
    ],
  },
  {
    title: 'Financial Reports',
    icon: <DollarSign size={24} />,
    color: 'green',
    reports: [
      { name: 'Fee Collection', description: 'Monthly fee collection report' },
      { name: 'Outstanding Fees', description: 'Pending fee details' },
      { name: 'Income Statement', description: 'Revenue and expenses' },
      { name: 'Payment History', description: 'Transaction records' },
    ],
  },
  {
    title: 'Academic Reports',
    icon: <BookOpen size={24} />,
    color: 'purple',
    reports: [
      { name: 'Exam Results', description: 'Class-wise exam performance' },
      { name: 'Subject Analysis', description: 'Subject-wise performance' },
      { name: 'Progress Cards', description: 'Student progress reports' },
      { name: 'Homework Status', description: 'Homework completion tracking' },
    ],
  },
  {
    title: 'Staff Reports',
    icon: <Users size={24} />,
    color: 'orange',
    reports: [
      { name: 'Staff Directory', description: 'Complete staff list' },
      { name: 'Attendance Report', description: 'Staff attendance records' },
      { name: 'Salary Report', description: 'Monthly salary details' },
      { name: 'Leave Records', description: 'Leave and absence tracking' },
    ],
  },
];

export default function ReportsPage() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const handleGenerateReport = (data: any) => {
    console.log('Generating report:', selectedReport, data);
    setShowGenerateModal(false);
    setSelectedReport(null);
    setToast({ show: true, type: 'success', message: 'Report generated successfully!' });
  };

  const handleReportClick = (category: string, report: any) => {
    setSelectedReport({ category, ...report });
    setShowGenerateModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Reports & Analytics</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Generate and download various reports
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => {
          setSelectedReport({ name: 'Custom Report', description: 'Create custom report' });
          setShowGenerateModal(true);
        }}>
          <BarChart3 size={20} />
          Custom Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">24</p>
          <p className="text-sm text-charcoal-600">Total Reports</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">156</p>
          <p className="text-sm text-charcoal-600">Generated This Month</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Download className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">89</p>
          <p className="text-sm text-charcoal-600">Downloads</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">12</p>
          <p className="text-sm text-charcoal-600">Scheduled Reports</p>
        </div>
      </div>

      {/* Report Categories */}
      {reportCategories.map((category, index) => (
        <div key={index} className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 bg-${category.color}-50 rounded-lg`}>
              <div className={`text-${category.color}-600`}>{category.icon}</div>
            </div>
            <h2 className="text-lg font-semibold text-charcoal-950">{category.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.reports.map((report, idx) => (
              <div
                key={idx}
                className="p-4 bg-warm-50 rounded-lg border border-warm-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleReportClick(category.title, report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal-950 mb-1">{report.name}</h3>
                    <p className="text-sm text-charcoal-600">{report.description}</p>
                  </div>
                  <button className="btn-ghost text-sm py-1 px-3 flex items-center gap-2">
                    <Download size={16} />
                    Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Recent Reports */}
      <div className="card">
        <h2 className="text-lg font-semibold text-charcoal-950 mb-4">Recent Reports</h2>
        <div className="space-y-3">
          {[
            { name: 'Student List Report', date: '2024-11-19', size: '2.4 MB', format: 'PDF' },
            { name: 'Fee Collection Report', date: '2024-11-18', size: '1.8 MB', format: 'Excel' },
            { name: 'Attendance Summary', date: '2024-11-17', size: '890 KB', format: 'PDF' },
          ].map((report, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-charcoal-900">{report.name}</p>
                  <p className="text-xs text-charcoal-600">
                    {report.date} • {report.size} • {report.format}
                  </p>
                </div>
              </div>
              <button className="btn-ghost text-sm py-1 px-3">
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setSelectedReport(null);
        }}
        title={`Generate ${selectedReport?.name || 'Report'}`}
      >
        <GenerateReportForm
          report={selectedReport}
          onSubmit={handleGenerateReport}
          onCancel={() => {
            setShowGenerateModal(false);
            setSelectedReport(null);
          }}
        />
      </Modal>

      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}

// Generate Report Form
function GenerateReportForm({ report, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    format: 'pdf',
    dateRange: 'this-month',
    startDate: '',
    endDate: '',
    class: '',
    section: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      {report && (
        <div className="p-3 bg-warm-50 rounded-lg">
          <p className="font-semibold text-charcoal-900">{report.name}</p>
          <p className="text-sm text-charcoal-600">{report.description}</p>
        </div>
      )}

      <div>
        <label className="label">Format *</label>
        <select className="input" value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} required>
          <option value="pdf">PDF</option>
          <option value="excel">Excel (XLSX)</option>
          <option value="csv">CSV</option>
        </select>
      </div>

      <div>
        <label className="label">Date Range *</label>
        <select className="input" value={formData.dateRange} onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })} required>
          <option value="today">Today</option>
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
          <option value="this-year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {formData.dateRange === 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" className="input" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Download size={16} />
          Generate Report
        </button>
      </div>
    </form>
  );
}
