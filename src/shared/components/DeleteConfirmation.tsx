import { AlertTriangle } from 'lucide-react';
import { useEffect, useId } from 'react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  /** Text of the confirm button. Defaults to "Delete". */
  confirmLabel?: string;
  /** Note under the item name. Defaults to the irreversible warning. Pass an empty string to hide it. */
  warning?: string;
}

export default function DeleteConfirmation({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  itemName,
  confirmLabel = 'Delete',
  warning = 'This action cannot be undone.',
}: DeleteConfirmationProps) {
  const titleId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 id={titleId} className="text-lg font-semibold text-charcoal-950 mb-2">{title}</h3>
            <p className="text-sm text-charcoal-600 mb-1">{message}</p>
            {itemName && (
              <p className="text-sm font-medium text-charcoal-900 mt-2">
                "{itemName}"
              </p>
            )}
            {warning && (
              <p className="text-xs text-red-600 mt-3">
                {warning}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
