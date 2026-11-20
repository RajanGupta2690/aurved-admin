import { useState } from 'react';
import { Settings, Building2, Users, Bell, Lock, Database, Globe, Palette } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import Toast from '../../../shared/components/Toast';

const settingsCategories = [
  {
    title: 'Institution Settings',
    icon: <Building2 size={24} />,
    color: 'blue',
    items: [
      { label: 'School Name', value: 'Sunrise International School' },
      { label: 'Address', value: '123, Education Lane, Mumbai' },
      { label: 'Contact', value: '+91 98765 43210' },
      { label: 'Email', value: 'info@sunriseschool.edu' },
    ],
  },
  {
    title: 'Academic Settings',
    icon: <Globe size={24} />,
    color: 'green',
    items: [
      { label: 'Current Session', value: '2024-2025' },
      { label: 'Session Start', value: '01 April 2024' },
      { label: 'Session End', value: '31 March 2025' },
      { label: 'Working Days', value: 'Monday to Saturday' },
    ],
  },
  {
    title: 'User Management',
    icon: <Users size={24} />,
    color: 'purple',
    items: [
      { label: 'Total Users', value: '156' },
      { label: 'Active Users', value: '142' },
      { label: 'Roles Configured', value: '8' },
      { label: 'Permissions', value: 'Custom' },
    ],
  },
  {
    title: 'Notifications',
    icon: <Bell size={24} />,
    color: 'orange',
    items: [
      { label: 'Email Notifications', value: 'Enabled' },
      { label: 'SMS Notifications', value: 'Enabled' },
      { label: 'Push Notifications', value: 'Disabled' },
      { label: 'Notification Frequency', value: 'Real-time' },
    ],
  },
];

export default function SettingsPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const handleEditSetting = (data: any) => {
    console.log('Updating setting:', data);
    setShowEditModal(false);
    setSelectedSetting(null);
    setToast({ show: true, type: 'success', message: 'Settings updated successfully!' });
  };

  const handleSaveChanges = () => {
    console.log('Saving all changes');
    setToast({ show: true, type: 'success', message: 'All changes saved successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Settings</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Manage system configuration and preferences
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={handleSaveChanges}>
          <Settings size={20} />
          Save Changes
        </button>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Lock className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="font-semibold text-charcoal-950">Security</p>
          <p className="text-xs text-charcoal-600 mt-1">Passwords & Access</p>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Database className="text-green-600" size={24} />
            </div>
          </div>
          <p className="font-semibold text-charcoal-950">Data Backup</p>
          <p className="text-xs text-charcoal-600 mt-1">Backup & Restore</p>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Palette className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="font-semibold text-charcoal-950">Appearance</p>
          <p className="text-xs text-charcoal-600 mt-1">Theme & Layout</p>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Globe className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="font-semibold text-charcoal-950">Localization</p>
          <p className="text-xs text-charcoal-600 mt-1">Language & Region</p>
        </div>
      </div>

      {/* Settings Categories */}
      {settingsCategories.map((category, index) => (
        <div key={index} className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 bg-${category.color}-50 rounded-lg`}>
              <div className={`text-${category.color}-600`}>{category.icon}</div>
            </div>
            <h2 className="text-lg font-semibold text-charcoal-950">{category.title}</h2>
          </div>
          <div className="space-y-4">
            {category.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-warm-50 rounded-lg border border-warm-200"
              >
                <div>
                  <p className="font-medium text-charcoal-950">{item.label}</p>
                  <p className="text-sm text-charcoal-600 mt-1">{item.value}</p>
                </div>
                <button 
                  className="btn-ghost text-sm py-1 px-3"
                  onClick={() => {
                    setSelectedSetting({ category: category.title, ...item });
                    setShowEditModal(true);
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Module Configuration */}
      <div className="card">
        <h2 className="text-lg font-semibold text-charcoal-950 mb-4">Module Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Dashboard', 'Admissions', 'Students', 'Parents', 'Attendance', 'Fees',
            'Examinations', 'Staff', 'Homework', 'Communication', 'Timetable', 'Library',
            'Transport', 'Inventory', 'Reports', 'Settings',
          ].map((module) => (
            <div key={module} className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
              <span className="text-sm font-medium text-charcoal-900">{module}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-warm-300 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-charcoal-950 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-warm-50 rounded-lg">
            <p className="text-xs text-charcoal-600 mb-1">Version</p>
            <p className="font-semibold text-charcoal-950">v1.0.0</p>
          </div>
          <div className="p-4 bg-warm-50 rounded-lg">
            <p className="text-xs text-charcoal-600 mb-1">Last Updated</p>
            <p className="font-semibold text-charcoal-950">November 2024</p>
          </div>
          <div className="p-4 bg-warm-50 rounded-lg">
            <p className="text-xs text-charcoal-600 mb-1">Database Status</p>
            <p className="font-semibold text-green-600">Connected</p>
          </div>
        </div>
      </div>

      {/* Edit Setting Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSetting(null);
        }}
        title={`Edit ${selectedSetting?.label || 'Setting'}`}
      >
        <SettingForm
          setting={selectedSetting}
          onSubmit={handleEditSetting}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedSetting(null);
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

// Setting Form Component
function SettingForm({ setting, onSubmit, onCancel }: any) {
  const [value, setValue] = useState(setting?.value || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...setting, value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {setting && (
        <div className="p-3 bg-warm-50 rounded-lg border border-warm-200">
          <p className="text-xs text-charcoal-600">Category</p>
          <p className="font-semibold text-charcoal-900">{setting.category}</p>
        </div>
      )}

      <div>
        <label className="label">{setting?.label} *</label>
        <input
          type="text"
          className="input"
          placeholder={`Enter ${setting?.label?.toLowerCase()}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          ℹ️ Changes will be applied system-wide after saving.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Update Setting
        </button>
      </div>
    </form>
  );
}
