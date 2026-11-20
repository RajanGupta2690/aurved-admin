import { useState } from 'react';
import { Search, Plus, Bus, MapPin, User, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

// Mock transport data
const mockVehicles = [
  { id: '1', number: 'MH 01 AB 1234', type: 'Bus', capacity: 40, driver: 'Rajesh Kumar', route: 'Route 1', students: 35, status: 'active' },
  { id: '2', number: 'MH 01 CD 5678', type: 'Bus', capacity: 45, driver: 'Suresh Patel', route: 'Route 2', students: 42, status: 'active' },
  { id: '3', number: 'MH 01 EF 9012', type: 'Van', capacity: 15, driver: 'Amit Sharma', route: 'Route 3', students: 12, status: 'active' },
  { id: '4', number: 'MH 01 GH 3456', type: 'Bus', capacity: 40, driver: 'Vijay Singh', route: 'Route 4', students: 38, status: 'maintenance' },
];

const mockRoutes = [
  { id: '1', name: 'Route 1', area: 'Andheri - Bandra - Dadar', stops: 8, distance: '15 km' },
  { id: '2', name: 'Route 2', area: 'Borivali - Malad - Goregaon', stops: 10, distance: '18 km' },
  { id: '3', name: 'Route 3', area: 'Powai - Vikhroli - Ghatkopar', stops: 6, distance: '12 km' },
  { id: '4', name: 'Route 4', area: 'Kurla - Chembur - Vashi', stops: 9, distance: '20 km' },
];

export default function TransportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'vehicles' | 'routes'>('vehicles');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const filteredVehicles = mockVehicles.filter(v => 
    v.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalVehicles: mockVehicles.length,
    active: mockVehicles.filter(v => v.status === 'active').length,
    totalSeats: mockVehicles.reduce((sum, v) => sum + v.capacity, 0),
    occupied: mockVehicles.reduce((sum, v) => sum + v.students, 0),
  };

  const handleAdd = (data: any) => {
    console.log('Adding:', view, data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: `${view === 'vehicles' ? 'Vehicle' : 'Route'} added successfully!` });
  };

  const handleEdit = (data: any) => {
    console.log('Editing:', data);
    setShowEditModal(false);
    setSelectedItem(null);
    setToast({ show: true, type: 'success', message: `${view === 'vehicles' ? 'Vehicle' : 'Route'} updated successfully!` });
  };

  const handleDelete = () => {
    console.log('Deleting:', selectedItem);
    setShowDeleteConfirm(false);
    setSelectedItem(null);
    setToast({ show: true, type: 'success', message: 'Deleted successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Transport Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">Manage vehicles, routes, and transportation</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Bus className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.totalVehicles}</p>
          <p className="text-sm text-charcoal-600">Total Vehicles</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.active}</p>
          <p className="text-sm text-charcoal-600">Active</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <User className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.totalSeats}</p>
          <p className="text-sm text-charcoal-600">Total Capacity</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <MapPin className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{mockRoutes.length}</p>
          <p className="text-sm text-charcoal-600">Routes</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="card">
        <div className="flex gap-4">
          <button
            onClick={() => setView('vehicles')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'vehicles' ? 'bg-primary-500 text-white' : 'text-charcoal-600 hover:bg-warm-100'
            }`}
          >
            Vehicles
          </button>
          <button
            onClick={() => setView('routes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'routes' ? 'bg-primary-500 text-white' : 'text-charcoal-600 hover:bg-warm-100'
            }`}
          >
            Routes
          </button>
          <div className="flex-1"></div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Vehicles View */}
      {view === 'vehicles' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Vehicle Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-warm-200">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-charcoal-900">{vehicle.number}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Bus size={16} className="text-primary-600" />
                        <span className="text-sm text-charcoal-900">{vehicle.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal-900">{vehicle.driver}</td>
                    <td className="px-6 py-4 text-sm text-charcoal-900">{vehicle.route}</td>
                    <td className="px-6 py-4 text-sm text-charcoal-900">{vehicle.capacity}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-charcoal-900">{vehicle.students}</td>
                    <td className="px-6 py-4">
                      {vehicle.status === 'active' ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-warning">Maintenance</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          className="btn-ghost text-sm py-1 px-3"
                          onClick={() => {
                            setSelectedItem(vehicle);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:bg-red-50 text-sm py-1 px-3 rounded"
                          onClick={() => {
                            setSelectedItem(vehicle);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Routes View */}
      {view === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockRoutes.map((route) => (
            <div key={route.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <MapPin className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-950">{route.name}</h3>
                    <p className="text-sm text-charcoal-600">{route.area}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-charcoal-600 mt-3">
                <div>
                  <span className="font-medium">Stops:</span> {route.stops}
                </div>
                <div>
                  <span className="font-medium">Distance:</span> {route.distance}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  className="btn-secondary text-sm py-1 px-3"
                  onClick={() => {
                    setSelectedItem(route);
                    setShowEditModal(true);
                  }}
                >
                  Edit Route
                </button>
                <button 
                  className="text-red-600 hover:bg-red-50 text-sm py-1 px-3 rounded"
                  onClick={() => {
                    setSelectedItem(route);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add ${view === 'vehicles' ? 'Vehicle' : 'Route'}`}
      >
        {view === 'vehicles' ? (
          <VehicleForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
        ) : (
          <RouteForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
        )}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        title={`Edit ${view === 'vehicles' ? 'Vehicle' : 'Route'}`}
      >
        {view === 'vehicles' ? (
          <VehicleForm vehicle={selectedItem} onSubmit={handleEdit} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />
        ) : (
          <RouteForm route={selectedItem} onSubmit={handleEdit} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />
        )}
      </Modal>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${view === 'vehicles' ? 'Vehicle' : 'Route'}`}
        message={`Are you sure you want to delete this ${view === 'vehicles' ? 'vehicle' : 'route'}?`}
      />

      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}

// Vehicle Form
function VehicleForm({ vehicle, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    number: vehicle?.number || '',
    type: vehicle?.type || 'Bus',
    capacity: vehicle?.capacity || '',
    driver: vehicle?.driver || '',
    route: vehicle?.route || '',
    status: vehicle?.status || 'active',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <label className="label">Vehicle Number *</label>
        <input type="text" className="input" placeholder="MH 01 AB 1234" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type *</label>
          <select className="input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
            <option value="Bus">Bus</option>
            <option value="Van">Van</option>
            <option value="Car">Car</option>
          </select>
        </div>
        <div>
          <label className="label">Capacity *</label>
          <input type="number" className="input" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required />
        </div>
      </div>
      <div>
        <label className="label">Driver Name *</label>
        <input type="text" className="input" value={formData.driver} onChange={(e) => setFormData({ ...formData, driver: e.target.value })} required />
      </div>
      <div>
        <label className="label">Route</label>
        <input type="text" className="input" value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{vehicle ? 'Update' : 'Add'} Vehicle</button>
      </div>
    </form>
  );
}

// Route Form
function RouteForm({ route, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: route?.name || '',
    area: route?.area || '',
    stops: route?.stops || '',
    distance: route?.distance || '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <label className="label">Route Name *</label>
        <input type="text" className="input" placeholder="Route 1" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
      </div>
      <div>
        <label className="label">Coverage Area *</label>
        <input type="text" className="input" placeholder="Area 1 - Area 2 - Area 3" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Number of Stops *</label>
          <input type="number" className="input" value={formData.stops} onChange={(e) => setFormData({ ...formData, stops: e.target.value })} required />
        </div>
        <div>
          <label className="label">Total Distance *</label>
          <input type="text" className="input" placeholder="15 km" value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: e.target.value })} required />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{route ? 'Update' : 'Add'} Route</button>
      </div>
    </form>
  );
}
