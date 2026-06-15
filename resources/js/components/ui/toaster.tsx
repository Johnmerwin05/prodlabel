import {
    AlertCircle,
    CheckCircle2,
    Info,
    TriangleAlert,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

const toastMeta: Record<
    ToastVariant,
    { icon: typeof CheckCircle2; className: string; bar: string }
> = {
    success: {
        icon: CheckCircle2,
        className: "bg-background text-emerald-950",
        bar: "bg-emerald-500",
    },
    error: {
        icon: AlertCircle,
        className: "bg-background text-red-950",
        bar: "bg-red-500",
    },
    warning: {
        icon: TriangleAlert,
        className: "bg-background text-amber-950",
        bar: "bg-amber-500",
    },
    info: {
        icon: Info,
        className: "bg-background text-foreground",
        bar: "bg-primary",
    },
};

export function Toaster() {
    const { toasts, dismiss } = useToastStore();

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-3">
            {toasts.map((toast) => {
                const meta = toastMeta[toast.variant];
                const Icon = meta.icon;

                return (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto relative overflow-hidden rounded-lg border p-4 pr-12 shadow-lg animate-in slide-in-from-right-5 fade-in",
                            meta.className,
                        )}
                    >
                        <div
                            className={cn(
                                "absolute left-0 top-0 h-full w-1",
                                meta.bar,
                            )}
                        />
                        <div className="flex gap-3">
                            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                            <div className="min-w-0">
                                <div className="font-semibold">
                                    {toast.title}
                                </div>
                                {toast.description ? (
                                    <div className="mt-1 text-sm opacity-75">
                                        {toast.description}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <Button
                            className="absolute right-2 top-2 h-8 w-8"
                            size="icon"
                            variant="ghost"
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss notification"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div
                            className={cn(
                                "absolute bottom-0 left-0 h-0.5 animate-[toast-progress_4.5s_linear_forwards]",
                                meta.bar,
                            )}
                        />
                    </div>
                );
            })}
        </div>
    );
}
