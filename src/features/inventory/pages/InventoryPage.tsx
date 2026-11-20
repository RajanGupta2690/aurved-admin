import { useState } from 'react';
import { Search, Plus, Package, TrendingDown, TrendingUp, AlertCircle, Edit, Trash2 } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

// Mock inventory data
const mockItems = [
  { id: '1', name: 'Projector', category: 'Electronics', quantity: 15, minStock: 5, unit: 'pcs', location: 'Storage Room A', status: 'in-stock' },
  { id: '2', name: 'Whiteboard Markers', category: 'Stationery', quantity: 120, minStock: 50, unit: 'pcs', location: 'Supply Cabinet', status: 'in-stock' },
  { id: '3', name: 'Desks', category: 'Furniture', quantity: 8, minStock: 10, unit: 'pcs', location: 'Warehouse', status: 'low-stock' },
  { id: '4', name: 'Computers', category: 'Electronics', quantity: 45, minStock: 40, unit: 'pcs', location: 'IT Lab', status: 'in-stock' },
  { id: '5', name: 'Sports Equipment', category: 'Sports', quantity: 2, minStock: 10, unit: 'sets', location: 'Sports Room', status: 'out-of-stock' },
];

const categories = ['All', 'Electronics', 'Furniture', 'Stationery', 'Sports', 'Lab Equipment'];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: mockItems.length,
    inStock: mockItems.filter(i => i.status === 'in-stock').length,
    lowStock: mockItems.filter(i => i.status === 'low-stock').length,
    outOfStock: mockItems.filter(i => i.status === 'out-of-stock').length,
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'in-stock': return <span className="badge badge-success">In Stock</span>;
      case 'low-stock': return <span className="badge badge-warning">Low Stock</span>;
      case 'out-of-stock': return <span className="badge badge-error">Out of Stock</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const handleAddItem = (data: any) => {
    console.log('Adding item:', data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: 'Item added successfully!' });
  };

  const handleEditItem = (data: any) => {
    console.log('Editing item:', data);
    setShowEditModal(false);
    setSelectedItem(null);
    setToast({ show: true, type: 'success', message: 'Item updated successfully!' });
  };

  const handleUpdateStock = (data: any) => {
    console.log('Updating stock:', data);
    setShowUpdateStockModal(false);
    setSelectedItem(null);
    setToast({ show: true, type: 'success', message: 'Stock updated successfully!' });
  };

  const handleDeleteItem = () => {
    console.log('Deleting item:', selectedItem);
    setShowDeleteConfirm(false);
    setSelectedItem(null);
    setToast({ show: true, type: 'success', message: 'Item deleted successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Inventory Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">Track assets, equipment, and supplies</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.total}</p>
          <p className="text-sm text-charcoal-600">Total Items</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.inStock}</p>
          <p className="text-sm text-charcoal-600">In Stock</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingDown className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.lowStock}</p>
          <p className="text-sm text-charcoal-600">Low Stock</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.outOfStock}</p>
          <p className="text-sm text-charcoal-600">Out of Stock</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input md:w-48">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input md:w-40">
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Min Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-warm-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-primary-600" />
                      <span className="font-medium text-charcoal-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal-600">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-charcoal-900">
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal-600">{item.minStock} {item.unit}</td>
                  <td className="px-6 py-4 text-sm text-charcoal-600">{item.location}</td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        className="btn-ghost text-sm py-1 px-3"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit size={14} className="inline mr-1" />
                        Edit
                      </button>
                      <button 
                        className="btn-secondary text-sm py-1 px-3"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowUpdateStockModal(true);
                        }}
                      >
                        Update Stock
                      </button>
                      <button 
                        className="text-red-600 hover:bg-red-50 text-sm py-1 px-3 rounded"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Inventory Item">
        <ItemForm onSubmit={handleAddItem} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        title="Edit Inventory Item"
      >
        <ItemForm item={selectedItem} onSubmit={handleEditItem} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />
      </Modal>

      <Modal
        isOpen={showUpdateStockModal}
        onClose={() => {
          setShowUpdateStockModal(false);
          setSelectedItem(null);
        }}
        title="Update Stock"
      >
        <UpdateStockForm item={selectedItem} onSubmit={handleUpdateStock} onCancel={() => { setShowUpdateStockModal(false); setSelectedItem(null); }} />
      </Modal>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        message={`Are you sure you want to delete "${selectedItem?.name}"?`}
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

// Item Form
function ItemForm({ item, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || 'Electronics',
    quantity: item?.quantity || '',
    minStock: item?.minStock || '',
    unit: item?.unit || 'pcs',
    location: item?.location || '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <label className="label">Item Name *</label>
        <input type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select className="input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
            {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Unit *</label>
          <select className="input" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required>
            <option value="pcs">Pieces</option>
            <option value="sets">Sets</option>
            <option value="boxes">Boxes</option>
            <option value="units">Units</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Quantity *</label>
          <input type="number" className="input" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
        </div>
        <div>
          <label className="label">Min Stock Level *</label>
          <input type="number" className="input" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} required />
        </div>
      </div>
      <div>
        <label className="label">Location *</label>
        <input type="text" className="input" placeholder="e.g., Storage Room A" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{item ? 'Update' : 'Add'} Item</button>
      </div>
    </form>
  );
}

// Update Stock Form
function UpdateStockForm({ item, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    action: 'add',
    quantity: '',
    reason: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...formData, itemId: item?.id }); }} className="space-y-4">
      {item && (
        <div className="p-3 bg-warm-50 rounded-lg">
          <p className="font-semibold text-charcoal-900">{item.name}</p>
          <p className="text-sm text-charcoal-600">Current Stock: {item.quantity} {item.unit}</p>
        </div>
      )}
      <div>
        <label className="label">Action *</label>
        <select className="input" value={formData.action} onChange={(e) => setFormData({ ...formData, action: e.target.value })} required>
          <option value="add">Add Stock</option>
          <option value="remove">Remove Stock</option>
        </select>
      </div>
      <div>
        <label className="label">Quantity *</label>
        <input type="number" className="input" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required min="1" />
      </div>
      <div>
        <label className="label">Reason</label>
        <textarea className="input" rows={3} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Enter reason for stock update" />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Update Stock</button>
      </div>
    </form>
  );
}
