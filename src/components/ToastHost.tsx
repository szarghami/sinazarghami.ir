import React, { useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ToastApi {
  toast: ToastItem | null;
  notify: (message: string, kind?: ToastKind) => void;
  notifyError: (message: string) => void;
  dismiss: () => void;
}

/**
 * فقط یک پیام در هر لحظه نمایش داده می‌شود تا صفحه با پاپ‌آپ‌های پشت‌سرهم پر نشود.
 */
export function useToasts(): ToastApi {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    setToast({ id: Date.now(), kind, message });
    window.setTimeout(() => {
      setToast((current) => (current && current.message === message ? null : current));
    }, kind === 'error' ? 9000 : 5000);
  }, []);

  const notifyError = useCallback((message: string) => notify(message, 'error'), [notify]);
  const dismiss = useCallback(() => setToast(null), []);

  return { toast, notify, notifyError, dismiss };
}

const STYLES: Record<ToastKind, string> = {
  success: 'bg-emerald-50 border-emerald-300 text-emerald-950',
  error: 'bg-red-50 border-red-300 text-red-950',
  info: 'bg-stone-900 border-stone-700 text-stone-50',
};

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  error: <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />,
  info: <Info className="w-4 h-4 text-amber-300 shrink-0" />,
};

export const ToastHost: React.FC<{ toast: ToastItem | null; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[min(92vw,32rem)]">
      <div
        role="status"
        className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs sm:text-sm font-medium leading-relaxed ${STYLES[toast.kind]}`}
      >
        {ICONS[toast.kind]}
        <p className="flex-1 whitespace-pre-line">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="opacity-60 hover:opacity-100 cursor-pointer shrink-0"
          aria-label="بستن پیام"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
