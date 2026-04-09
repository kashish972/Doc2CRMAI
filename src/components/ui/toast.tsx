"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
}

const toastVariants = {
  default: "border bg-white text-gray-900",
  destructive: "border-red-500 bg-red-50 text-red-900",
  success: "border-green-500 bg-green-50 text-green-900",
};

function ToastElement({ id, title, description, action, variant = "default", onDismiss }: Toast & { onDismiss: () => void }) {
  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-96 rounded-lg border p-4 shadow-lg",
        toastVariants[variant]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="text-sm text-gray-600 mt-1">{description}</div>}
          {action && <div className="mt-2">{action}</div>}
        </div>
        <button
          onClick={onDismiss}
          className="rounded p-1 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const ToastContext = React.createContext<{
  toasts: Toast[];
  toast: (props: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
} | null>(null);

ToastContext.displayName = "ToastContext";

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...props, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  React.useEffect(() => {
    toastFn = toast;
    return () => {
      toastFn = null;
    };
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {toasts.map((t) => (
        <ToastElement
          key={t.id}
          {...t}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

let toastFn: ((props: Omit<Toast, "id">) => void) | null = null;

export function toast(props: Omit<Toast, "id">) {
  if (toastFn) {
    toastFn(props);
  }
}
