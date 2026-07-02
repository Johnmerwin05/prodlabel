import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    CheckIcon,
    ImageIcon,
    MonitorCogIcon,
    PaletteIcon,
    SaveIcon,
    ShieldCheckIcon,
    TagIcon,
    Trash2Icon,
    UploadIcon,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/shared/services/api";
import { useToastStore } from "@/stores/toastStore";
import {
    colorPalettes,
    type ColorPalette,
    type SystemSettings,
    useSystemSettings,
} from "./system-settings";

type SettingsDraft = Pick<
    SystemSettings,
    "system_name" | "system_tagline" | "footer_content" | "color_palette"
>;

export function SettingsPage() {
    const settings = useSystemSettings();
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const faviconInputRef = React.useRef<HTMLInputElement>(null);
    const [draft, setDraft] = React.useState<SettingsDraft>(() => toDraft(settings));
    const [favicon, setFavicon] = React.useState<File | null>(null);
    const [removeFavicon, setRemoveFavicon] = React.useState(false);
    const [faviconPreview, setFaviconPreview] = React.useState<string | null>(null);

    React.useEffect(() => setDraft(toDraft(settings)), [settings]);

    React.useEffect(() => {
        if (!favicon) {
            setFaviconPreview(null);
            return;
        }

        const preview = URL.createObjectURL(favicon);
        setFaviconPreview(preview);
        return () => URL.revokeObjectURL(preview);
    }, [favicon]);

    const saveSettings = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("system_name", draft.system_name.trim());
            formData.append("system_tagline", draft.system_tagline.trim());
            formData.append("footer_content", draft.footer_content.trim());
            formData.append("color_palette", draft.color_palette);
            if (favicon) formData.append("favicon", favicon);
            if (removeFavicon) formData.append("remove_favicon", "1");

            const response = await api.post<{ data: SystemSettings }>(
                "/system-settings",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );
            return response.data.data;
        },
        onSuccess: (savedSettings) => {
            queryClient.setQueryData(["system-settings"], savedSettings);
            setFavicon(null);
            setRemoveFavicon(false);
            if (faviconInputRef.current) faviconInputRef.current.value = "";
            notify({ variant: "success", title: "System settings saved" });
        },
        onError: (error) => {
            notify({
                variant: "error",
                title: "Unable to save settings",
                description: getErrorMessage(error),
            });
        },
    });

    const hasChanges =
        favicon !== null ||
        removeFavicon ||
        JSON.stringify(draft) !== JSON.stringify(toDraft(settings));
    const displayedFavicon = removeFavicon
        ? null
        : (faviconPreview ?? settings.favicon_url);

    return (
        <div className="space-y-6">
            <PageHeader
                title="System Settings"
                description="Control the identity and visual language used throughout the production workspace."
                actions={
                    <Button
                        disabled={!hasChanges || saveSettings.isPending}
                        onClick={() => saveSettings.mutate()}
                    >
                        <SaveIcon className="size-4" />
                        {saveSettings.isPending ? "Saving..." : "Save changes"}
                    </Button>
                }
            />

            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <ShieldCheckIcon className="size-4 text-primary" />
                <span className="font-medium">Administrator controls</span>
                <span className="text-muted-foreground">
                    Changes apply to every user and workstation.
                </span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                    <MonitorCogIcon className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Application identity</CardTitle>
                                    <CardDescription>
                                        Set the name and supporting copy shown across the application.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
                            <Field
                                id="system-name"
                                label="System name"
                                description="Replaces “ProdLabel” in the navigation and browser title."
                            >
                                <Input
                                    id="system-name"
                                    maxLength={80}
                                    value={draft.system_name}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            system_name: event.target.value,
                                        }))
                                    }
                                />
                            </Field>
                            <Field
                                id="system-tagline"
                                label="System tagline"
                                description="Replaces “Production label control” beneath the name."
                            >
                                <Input
                                    id="system-tagline"
                                    maxLength={140}
                                    value={draft.system_tagline}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            system_tagline: event.target.value,
                                        }))
                                    }
                                />
                            </Field>
                            <div className="md:col-span-2">
                                <Field
                                    id="footer-content"
                                    label="Footer content"
                                    description="Displayed after the current copyright year on every page."
                                >
                                    <Input
                                        id="footer-content"
                                        maxLength={255}
                                        value={draft.footer_content}
                                        onChange={(event) =>
                                            setDraft((current) => ({
                                                ...current,
                                                footer_content: event.target.value,
                                            }))
                                        }
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                    <PaletteIcon className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Application color palette</CardTitle>
                                    <CardDescription>
                                        Choose the global accent used by buttons, navigation, focus states, and charts.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
                            {colorPalettes.map((palette, index) => {
                                const selected = draft.color_palette === palette.id;

                                return (
                                    <button
                                        key={palette.id}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() =>
                                            setDraft((current) => ({
                                                ...current,
                                                color_palette: palette.id,
                                            }))
                                        }
                                        className={cn(
                                            "rounded-xl border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            selected &&
                                                "border-primary ring-2 ring-primary/15",
                                        )}
                                    >
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        style={{ backgroundColor: palette.colors[1] }}
                                                        className="border-0 text-white"
                                                    >
                                                        Palette {index + 1}
                                                    </Badge>
                                                    {index === 0 ? (
                                                        <Badge variant="outline">Default</Badge>
                                                    ) : null}
                                                </div>
                                                <div className="mt-2 font-semibold">{palette.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {palette.description}
                                                </div>
                                            </div>
                                            <span
                                                className={cn(
                                                    "flex size-6 items-center justify-center rounded-full border",
                                                    selected
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "text-transparent",
                                                )}
                                            >
                                                <CheckIcon className="size-3.5" />
                                            </span>
                                        </div>
                                        <PaletteSwatches title="Primary colors" colors={palette.colors} />
                                        <div className="mt-3 border-t pt-3">
                                            <PaletteSwatches title="Neutral colors" colors={palette.neutrals} compact />
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ImageIcon className="size-4 text-primary" />
                                <CardTitle>Browser favicon</CardTitle>
                            </div>
                            <CardDescription>
                                Upload a square PNG, JPG, WebP, or ICO file up to 2 MB.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input
                                ref={faviconInputRef}
                                className="hidden"
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp,.ico,image/png,image/jpeg,image/webp,image/x-icon"
                                onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    setFavicon(file);
                                    if (file) setRemoveFavicon(false);
                                }}
                            />
                            <button
                                type="button"
                                className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center transition hover:border-primary/50 hover:bg-primary/5"
                                onClick={() => faviconInputRef.current?.click()}
                            >
                                <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                                    {displayedFavicon ? (
                                        <img
                                            src={displayedFavicon}
                                            alt="Favicon preview"
                                            className="size-full object-contain p-2"
                                        />
                                    ) : (
                                        <TagIcon className="size-7 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                                        <UploadIcon className="size-4" />
                                        {favicon ? "Choose another file" : "Choose favicon"}
                                    </div>
                                    <div className="mt-1 max-w-52 truncate text-xs text-muted-foreground">
                                        {favicon?.name ?? "Recommended size: 32 × 32 px"}
                                    </div>
                                </div>
                            </button>
                            {displayedFavicon ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-3 w-full text-destructive hover:text-destructive"
                                    onClick={() => {
                                        setFavicon(null);
                                        setRemoveFavicon(true);
                                        if (faviconInputRef.current) {
                                            faviconInputRef.current.value = "";
                                        }
                                    }}
                                >
                                    <Trash2Icon className="size-4" />
                                    Remove favicon
                                </Button>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>Live brand preview</CardTitle>
                            <CardDescription>
                                A quick look at the saved workspace identity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                                <div className="flex items-center gap-3 border-b bg-card p-4">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        {displayedFavicon ? (
                                            <img
                                                src={displayedFavicon}
                                                alt=""
                                                className="size-7 object-contain"
                                            />
                                        ) : (
                                            <TagIcon className="size-5" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold">
                                            {draft.system_name || "System name"}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {draft.system_tagline || "System tagline"}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 p-4">
                                    <div className="h-2 w-2/3 rounded-full bg-primary/25" />
                                    <div className="h-2 w-full rounded-full bg-muted" />
                                    <Button size="sm" tabIndex={-1}>Primary action</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Field({
    id,
    label,
    description,
    children,
}: {
    id: string;
    label: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
    );
}

function PaletteSwatches({
    title,
    colors,
    compact = false,
}: {
    title: string;
    colors: string[];
    compact?: boolean;
}) {
    return (
        <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </div>
            <div className="flex gap-2">
                {colors.map((color) => (
                    <div key={color} className="min-w-0 flex-1">
                        <div
                            className={cn(
                                "w-full rounded-md border shadow-inner",
                                compact ? "h-5" : "h-9",
                            )}
                            style={{ backgroundColor: color }}
                        />
                        {!compact ? (
                            <div className="mt-1 truncate text-center font-mono text-[9px] text-muted-foreground">
                                {color}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

function toDraft(settings: SystemSettings): SettingsDraft {
    return {
        system_name: settings.system_name,
        system_tagline: settings.system_tagline,
        footer_content: settings.footer_content,
        color_palette: settings.color_palette as ColorPalette,
    };
}

function getErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) return "Please try again.";

    const errors = error.response?.data?.errors as Record<string, string[]> | undefined;
    return errors ? Object.values(errors).flat()[0] : error.response?.data?.message;
}
