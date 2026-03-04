import * as React from "react";

// Toast types
export type ToastVariant = "default" | "destructive";
export type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number; // ms
};

type ToastState = { toasts: Toast[] };

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "DISMISS"; id?: string }
  | { type: "REMOVE"; id?: string }
  | { type: "UPDATE"; toast: Partial<Toast> & { id: string } };

const TOAST_DURATION = 4000;
const TOAST_LIMIT = 10;

let state: ToastState = { toasts: [] };
const listeners = new Set<(state: ToastState) => void>();
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  for (const l of listeners) l(state);
}

function addToast(input: Omit<Toast, "id"> & { id?: string }) {
  const id = input.id ?? Math.random().toString(36).slice(2, 10);
  const toast: Toast = {
    id,
    title: input.title,
    description: input.description,
    action: input.action,
    variant: input.variant ?? "default",
    duration: input.duration ?? TOAST_DURATION,
  };
  state = {
    toasts: [toast, ...state.toasts].slice(0, TOAST_LIMIT),
  };
  if (toast.duration && toast.duration > 0) {
    const t = setTimeout(() => dismissToast(id), toast.duration);
    timeouts.set(id, t);
  }
  emit();
  return id;
}

function updateToast(partial: Partial<Toast> & { id: string }) {
  state = {
    toasts: state.toasts.map((t) =>
      t.id === partial.id ? { ...t, ...partial } : t,
    ),
  };
  emit();
}

function dismissToast(id?: string) {
  if (id) {
    const t = timeouts.get(id);
    if (t) clearTimeout(t);
    timeouts.delete(id);
  }
  state = {
    toasts: state.toasts.filter((t) => (id ? t.id !== id : false)),
  };
  emit();
}

function removeToast(id?: string) {
  dismissToast(id);
}

// Public toast API
export function toast(options: Omit<Toast, "id"> & { id?: string } = {}) {
  return addToast(options);
}

export function useToast() {
  const [current, setCurrent] = React.useState<ToastState>(state);
  React.useEffect(() => {
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  return React.useMemo(
    () => ({
      ...current,
      toast,
      dismiss: dismissToast,
      remove: removeToast,
      update: updateToast,
    }),
    [current],
  );
}
