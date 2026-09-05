import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
}

interface ToastContextType {
  toast: (options: { type: 'success' | 'error' | 'info'; message: string; details?: string }) => void;
  success: (message: string, details?: string) => void;
  error: (message: string, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(({ type, message, details }: { type: 'success' | 'error' | 'info'; message: string; details?: string }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, details }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (message: string, details?: string) => addToast({ type: 'success', message, details });
  const error = (message: string, details?: string) => addToast({ type: 'error', message, details });

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-200 animate-in slide-in-from-right ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
            <div className="flex-1 text-sm">
              <p className="font-semibold leading-snug">{t.message}</p>
              {t.details && <p className="text-xs opacity-80 mt-0.5">{t.details}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-100 p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
