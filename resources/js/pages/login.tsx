import { LoginForm } from "@/components/login-form";
import { BarcodeIcon, CircleIcon, TagIcon } from "lucide-react";
import { useSystemSettings } from "@/features/settings/system-settings";

const metrics = [
    { label: "Today", value: "7,842" },
    { label: "Queued", value: "128" },
    { label: "Failed", value: "6" },
];

const statusItems = [
    "Print queue synced",
    "Template versions locked",
    "Audit trail live",
];

export default function LoginPage() {
    const settings = useSystemSettings();

    return (
        <main className="min-h-screen bg-muted px-4 py-8 text-foreground">
            <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-white shadow-sm lg:grid-cols-[1fr_0.95fr]">
                    <div className="hidden border-r border-border bg-primary p-8 text-white lg:flex lg:min-h-155 lg:flex-col lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
                                {settings.favicon_url ? (
                                    <img src={settings.favicon_url} alt="" className="size-7 object-contain" />
                                ) : (
                                    <TagIcon className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <div className="font-semibold">{settings.system_name}</div>
                                <div className="text-sm text-white/60">
                                    {settings.system_tagline}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h1 className="text-4xl font-semibold tracking-normal text-white">
                                    Fast printing, clean controls.
                                </h1>
                                <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
                                    A focused operator entry point for products,
                                    templates, print queues, customers, and
                                    realtime production activity.
                                </p>
                            </div>

                            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                <div className="grid grid-cols-3 gap-3">
                                    {metrics.map((metric) => (
                                        <div
                                            key={metric.label}
                                            className="rounded-md bg-white/10 p-3"
                                        >
                                            <div className="text-xs text-white/55">
                                                {metric.label}
                                            </div>
                                            <div className="mt-1 text-lg font-semibold text-white">
                                                {metric.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 space-y-2">
                                    {statusItems.map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm text-white"
                                        >
                                            <span>{item}</span>
                                            <CircleIcon className="h-2 w-2 fill-current text-white" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-white/45">
                            Secure production access for authorized staff.
                        </p>
                    </div>

                    <div className="flex min-h-155 items-center justify-center bg-white p-6 sm:p-10">
                        <div className="w-full max-w-sm">
                            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-muted text-foreground">
                                <BarcodeIcon className="h-5 w-5" />
                            </div>
                            <LoginForm />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
