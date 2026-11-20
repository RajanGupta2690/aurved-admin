import { useState } from 'react';
import { Search, Plus, BookOpen, User, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2 } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';

// Mock library data
const mockBooks = [
  { id: '1', title: 'Science for Class 5', author: 'Dr. Sharma', isbn: '978-93-5000-001-1', category: 'Textbook', total: 50, available: 35, issued: 15 },
  { id: '2', title: 'Mathematics Workbook', author: 'Prof. Gupta', isbn: '978-93-5000-002-8', category: 'Workbook', total: 60, available: 42, issued: 18 },
  { id: '3', title: 'English Literature', author: 'Ms. Verma', isbn: '978-93-5000-003-5', category: 'Textbook', total: 40, available: 28, issued: 12 },
  { id: '4', title: 'Harry Potter Series', author: 'J.K. Rowling', isbn: '978-93-5000-004-2', category: 'Fiction', total: 20, available: 15, issued: 5 },
  { id: '5', title: 'General Knowledge 2024', author: 'Various', isbn: '978-93-5000-005-9', category: 'Reference', total: 30, available: 30, issued: 0 },
];

const categories = ['All', 'Textbook', 'Workbook', 'Fiction', 'Reference', 'Magazine'];

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, type: 'success' as const, message: '' });

  const filteredBooks = mockBooks.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm);
    const matchesCategory = filterCategory === 'All' || book.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalBooks: mockBooks.reduce((sum, book) => sum + book.total, 0),
    available: mockBooks.reduce((sum, book) => sum + book.available, 0),
    issued: mockBooks.reduce((sum, book) => sum + book.issued, 0),
    categories: categories.length - 1,
  };

  const handleAddBook = (data: any) => {
    console.log('Adding book:', data);
    setShowAddModal(false);
    setToast({ show: true, type: 'success', message: 'Book added successfully!' });
  };

  const handleEditBook = (data: any) => {
    console.log('Editing book:', data);
    setShowEditModal(false);
    setSelectedBook(null);
    setToast({ show: true, type: 'success', message: 'Book updated successfully!' });
  };

  const handleIssueBook = (data: any) => {
    console.log('Issuing book:', data);
    setShowIssueModal(false);
    setSelectedBook(null);
    setToast({ show: true, type: 'success', message: 'Book issued successfully!' });
  };

  const handleReturnBook = (data: any) => {
    console.log('Returning book:', data);
    setShowReturnModal(false);
    setSelectedBook(null);
    setToast({ show: true, type: 'success', message: 'Book returned successfully!' });
  };

  const handleDeleteBook = () => {
    console.log('Deleting book:', selectedBook);
    setShowDeleteConfirm(false);
    setSelectedBook(null);
    setToast({ show: true, type: 'success', message: 'Book deleted successfully!' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Library Management</h1>
          <p className="text-sm text-charcoal-600 mt-1">
            Manage books, inventory, and issue/return
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Book
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.totalBooks}</p>
          <p className="text-sm text-charcoal-600">Total Books</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.available}</p>
          <p className="text-sm text-charcoal-600">Available</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.issued}</p>
          <p className="text-sm text-charcoal-600">Issued</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <BookOpen className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal-950">{stats.categories}</p>
          <p className="text-sm text-charcoal-600">Categories</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input md:w-48"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={() => setShowIssueModal(true)}>Issue Book</button>
        </div>
      </div>

      {/* Books Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">ISBN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Issued</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-warm-200">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-primary-600" />
                      <span className="font-medium text-charcoal-900">{book.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal-600">{book.author}</td>
                  <td className="px-6 py-4 text-sm font-mono text-charcoal-600">{book.isbn}</td>
                  <td className="px-6 py-4">
                    <span className="badge badge-info">{book.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal-900">{book.total}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">{book.available}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600">{book.issued}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        className="btn-ghost text-sm py-1 px-3"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit size={14} className="inline mr-1" />
                        Edit
                      </button>
                      <button 
                        className="btn-secondary text-sm py-1 px-3"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowIssueModal(true);
                        }}
                      >
                        Issue
                      </button>
                      <button 
                        className="text-red-600 hover:bg-red-50 text-sm py-1 px-3 rounded"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 size={14} className="inline mr-1" />
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
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Book"
      >
        <BookForm onSubmit={handleAddBook} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBook(null);
        }}
        title="Edit Book"
      >
        <BookForm
          book={selectedBook}
          onSubmit={handleEditBook}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedBook(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={showIssueModal}
        onClose={() => {
          setShowIssueModal(false);
          setSelectedBook(null);
        }}
        title="Issue Book"
      >
        <IssueBookForm
          book={selectedBook}
          onSubmit={handleIssueBook}
          onCancel={() => {
            setShowIssueModal(false);
            setSelectedBook(null);
          }}
        />
      </Modal>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedBook(null);
        }}
        onConfirm={handleDeleteBook}
        title="Delete Book"
        message={`Are you sure you want to delete "${selectedBook?.title}"?`}
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

// Book Form Component
function BookForm({ book, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    isbn: book?.isbn || '',
    category: book?.category || 'Textbook',
    total: book?.total || '',
    publisher: '',
    publishYear: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Book Title *</label>
        <input
          type="text"
          className="input"
          placeholder="Enter book title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Author *</label>
          <input
            type="text"
            className="input"
            placeholder="Enter author name"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">ISBN *</label>
          <input
            type="text"
            className="input"
            placeholder="978-93-5000-000-0"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select
            className="input"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            {categories.filter(c => c !== 'All').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Total Copies *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g., 50"
            value={formData.total}
            onChange={(e) => setFormData({ ...formData, total: e.target.value })}
            required
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Publisher</label>
          <input
            type="text"
            className="input"
            placeholder="Enter publisher name"
            value={formData.publisher}
            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Publish Year</label>
          <input
            type="number"
            className="input"
            placeholder="e.g., 2024"
            value={formData.publishYear}
            onChange={(e) => setFormData({ ...formData, publishYear: e.target.value })}
            min="1900"
            max="2100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{book ? 'Update' : 'Add'} Book</button>
      </div>
    </form>
  );
}

// Issue Book Form
function IssueBookForm({ book, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, bookId: book?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {book && (
        <div className="p-3 bg-warm-50 rounded-lg border border-warm-200">
          <p className="text-sm font-semibold text-charcoal-900">{book.title}</p>
          <p className="text-xs text-charcoal-600">by {book.author}</p>
          <p className="text-xs text-green-600 mt-1">Available: {book.available} copies</p>
        </div>
      )}

      <div>
        <label className="label">Student ID / Admission Number *</label>
        <input
          type="text"
          className="input"
          placeholder="Enter student ID"
          value={formData.studentId}
          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Issue Date *</label>
          <input
            type="date"
            className="input"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Due Date *</label>
          <input
            type="date"
            className="input"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Issue Book</button>
      </div>
    </form>
  );
}
