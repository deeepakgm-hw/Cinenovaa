import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

const Toast = ({ id, type, title, message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const icons = {
    success: <CheckCircle size={20} color="#22c55e" />,
    error: <AlertCircle size={20} color="var(--brand-red)" />,
    info: <Info size={20} color="var(--color-info, #3b82f6)" />
  };

  return (
    <div style={{
      minWidth: 300,
      maxWidth: 400,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      animation: 'slideIn 0.3s ease forwards',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
      <div style={{ flexShrink: 0 }}>
        {icons[type] || icons.info}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
        {message && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{message}</div>}
      </div>
      <button 
        onClick={() => onDismiss(id)}
        style={{
          width: 20, height: 20, padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <X size={14} />
      </button>
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 4,
        background: 'var(--brand-gradient, linear-gradient(90deg, var(--brand-red), var(--brand-purple)))',
        animation: 'progress 4000ms linear forwards',
        transformOrigin: 'left'
      }} />
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type, title, message }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16
      }}>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
