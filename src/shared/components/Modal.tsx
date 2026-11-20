import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Full screen on mobile, centered on larger screens */}
      <div className={`
        relative bg-white w-full
        rounded-t-2xl sm:rounded-xl shadow-2xl
        ${sizeClasses[size]} 
        max-h-[95vh] sm:max-h-[90vh]
        flex flex-col
        animate-slide-up sm:animate-fade-in
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-warm-200">
          <h2 className="text-lg sm:text-xl font-semibold text-charcoal-950">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-charcoal-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-3 sm:py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
