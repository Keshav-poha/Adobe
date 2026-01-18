import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, message: string, duration: number = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastStyles = (type: ToastType) => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--spectrum-spacing-200)',
      padding: 'var(--spectrum-spacing-300)',
      borderRadius: 'var(--spectrum-corner-radius-100)',
      marginBottom: 'var(--spectrum-spacing-200)',
      minWidth: '288px',
      maxWidth: '320px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideIn 0.3s ease-out',
      backgroundColor: 'var(--spectrum-background-layer-2)',
      border: '1px solid',
    };

    const typeStyles = {
      success: {
        borderColor: 'var(--spectrum-positive-color)',
        color: 'var(--spectrum-positive-color)',
      },
      error: {
        borderColor: 'var(--spectrum-negative-color)',
        color: 'var(--spectrum-negative-color)',
      },
      info: {
        borderColor: '#4069FD',
        color: '#4069FD',
      },
      warning: {
        borderColor: 'var(--spectrum-notice-color)',
        color: 'var(--spectrum-notice-color)',
      },
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = (type: ToastType) => {
    const iconMap = {
      success: <CheckCircle size={20} />,
      error: <AlertCircle size={20} />,
      info: <Info size={20} />,
      warning: <AlertCircle size={20} />,
    };
    return iconMap[type];
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: 'var(--spectrum-spacing-400)',
        right: 'var(--spectrum-spacing-400)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={getToastStyles(toast.type)}>
            <div style={{ 
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              {getIcon(toast.type)}
            </div>
            <div style={{ 
              flex: 1,
              fontSize: 'var(--spectrum-body-text-size)',
              color: 'var(--spectrum-body-color)',
              lineHeight: 1.5,
              paddingTop: '1px'
            }}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close-button"
              style={{
                background: 'none',
                border: 'none',
                color: '#6d6d6d',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
