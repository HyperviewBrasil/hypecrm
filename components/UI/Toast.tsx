import React, { useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { ToastType } from '../../contexts/ToastContext';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: FiCheckCircle,
    bgClass: 'bg-green-600',
    borderClass: 'border-green-700',
  },
  error: {
    icon: FiAlertCircle,
    bgClass: 'bg-red-600',
    borderClass: 'border-red-700',
  },
  info: {
    icon: FiInfo,
    bgClass: 'bg-blue-600',
    borderClass: 'border-blue-700',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // Auto-dismiss after 2 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const { icon: Icon, bgClass, borderClass } = toastConfig[type];

  return (
    <div className={`relative flex items-center p-4 text-white rounded-md shadow-lg ${bgClass} border ${borderClass} animate-fade-in-right`}>
      <div className="flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 ml-3">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 flex-shrink-0 p-1 rounded-md hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white">
        <span className='sr-only'>Close</span>
        <FiX className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;