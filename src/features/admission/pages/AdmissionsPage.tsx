import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { enquiries, applications } from '../../../data/mockData';

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = useState<'enquiries' | 'applications'>('enquiries');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Admissions</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage enquiries and applications</p>
        </div>
        <Link
          to={activeTab === 'enquiries' ? '/admissions/enquiry/new' : '/admissions/application/new'}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {activeTab === 'enquiries' ? 'New Enquiry' : 'New Application'}
        </Link>
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
                <div key={enquiry.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200 hover:border-primary-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-charcoal-950">{enquiry.studentName}</h3>
                        <span className={`badge ${
                          enquiry.status === 'new' ? 'badge-info' :
                          enquiry.status === 'contacted' ? 'badge-warning' :
                          enquiry.status === 'converted' ? 'badge-success' :
                          'badge-error'
                        }`}>
                          {enquiry.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-charcoal-500">Parent Name</p>
                          <p className="text-charcoal-900 font-medium mt-1">{enquiry.parentName}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Phone</p>
                          <p className="text-charcoal-900 font-medium mt-1">{enquiry.parentPhone}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Enquiry Date</p>
                          <p className="text-charcoal-900 font-medium mt-1">
                            {new Date(enquiry.enquiryDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Follow-up Date</p>
                          <p className="text-charcoal-900 font-medium mt-1">
                            {enquiry.followUpDate ? new Date(enquiry.followUpDate).toLocaleDateString('en-IN') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {enquiry.remarks && (
                        <p className="text-sm text-charcoal-600 mt-3">
                          <span className="font-medium">Remarks:</span> {enquiry.remarks}
                        </p>
                      )}
                    </div>
                    <button className="p-2 hover:bg-warm-100 rounded-lg transition-colors">
                      <Eye size={20} className="text-charcoal-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(application => (
                <div key={application.id} className="p-4 bg-warm-50 rounded-lg border border-warm-200 hover:border-primary-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-charcoal-950">{application.studentName}</h3>
                        <span className={`badge ${
                          application.status === 'submitted' ? 'badge-info' :
                          application.status === 'under_review' ? 'badge-warning' :
                          application.status === 'approved' ? 'badge-success' :
                          'badge-error'
                        }`}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-charcoal-500">Application No.</p>
                          <p className="text-charcoal-900 font-medium mt-1">{application.applicationNumber}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Parent Name</p>
                          <p className="text-charcoal-900 font-medium mt-1">{application.parentName}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Phone</p>
                          <p className="text-charcoal-900 font-medium mt-1">{application.parentPhone}</p>
                        </div>
                        <div>
                          <p className="text-charcoal-500">Application Date</p>
                          <p className="text-charcoal-900 font-medium mt-1">
                            {new Date(application.applicationDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-charcoal-600">Documents:</span>
                        <div className="flex gap-2">
                          {application.documents.map(doc => (
                            <span
                              key={doc.id}
                              className={`text-xs px-2 py-1 rounded ${
                                doc.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {doc.name} {doc.verified ? '✓' : '⏳'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-warm-100 rounded-lg transition-colors">
                        <Eye size={20} className="text-charcoal-600" />
                      </button>
                      {application.status === 'under_review' && (
                        <>
                          <button className="p-2 hover:bg-emerald-50 rounded-lg transition-colors">
                            <CheckCircle size={20} className="text-emerald-600" />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                            <XCircle size={20} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
