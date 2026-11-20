import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  show: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export default function Toast({ show, onClose, type, message, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const config = {
    success: {
      icon: <CheckCircle size={20} />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    error: {
      icon: <XCircle size={20} />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
    warning: {
      icon: <AlertCircle size={20} />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-900',
    },
    info: {
      icon: <Info size={20} />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
    },
  };

  const { icon, bgColor, borderColor, iconColor, textColor } = config[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          <div className={iconColor}>{icon}</div>
          <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X size={16} className={iconColor} />
          </button>
        </div>
      </div>
    </div>
  );
}
