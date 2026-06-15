import { create } from "zustand";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type Toast = {
    id: string;
    title: string;
    description?: string;
    variant: ToastVariant;
};

type ToastState = {
    toasts: Toast[];
    notify: (
        toast: Omit<Toast, "id" | "variant"> & { variant?: ToastVariant },
    ) => void;
    dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    notify: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({
            toasts: [
                ...state.toasts.slice(-4),
                {
                    id,
                    variant: toast.variant ?? "info",
                    title: toast.title,
                    description: toast.description,
                },
            ],
        }));
        window.setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((item) => item.id !== id),
            }));
        }, 4500);
    },
    dismiss: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
}));
