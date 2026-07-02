import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/services/api";
import { resolveMediaUrl } from "@/shared/services/media-url";

export type ColorPalette = "blue" | "green" | "purple" | "amber";

export type SystemSettings = {
    system_name: string;
    system_tagline: string;
    footer_content: string;
    favicon_url: string | null;
    color_palette: ColorPalette;
    updated_at: string | null;
};

export const defaultSystemSettings: SystemSettings = {
    system_name: "ProdLabel",
    system_tagline: "Production label control",
    footer_content: "Tugon Technology Inc. All rights reserved.",
    favicon_url: null,
    color_palette: "blue",
    updated_at: null,
};

export const colorPalettes: Array<{
    id: ColorPalette;
    name: string;
    description: string;
    colors: string[];
    neutrals: string[];
}> = [
    {
        id: "blue",
        name: "Blue & Teal",
        description: "Primary palette",
        colors: ["#2563EB", "#1E3A8A", "#0D9488", "#F8FAFC"],
        neutrals: ["#111827", "#4B5563", "#9CA3AF", "#E5E7EB", "#F3F4F6"],
    },
    {
        id: "green",
        name: "Green & Forest",
        description: "Natural and operational",
        colors: ["#166534", "#22C55E", "#14B8A6", "#F0FDF4"],
        neutrals: ["#111827", "#4B5563", "#9CA3AF", "#E5E7EB", "#F9FAFB"],
    },
    {
        id: "purple",
        name: "Purple & Indigo",
        description: "Bold and technical",
        colors: ["#4F46E5", "#7C3AED", "#8B5CF6", "#FAFAFF"],
        neutrals: ["#111827", "#4B5563", "#9CA3AF", "#E5E7EB", "#F8FAFC"],
    },
    {
        id: "amber",
        name: "Amber & Orange",
        description: "Warm and energetic",
        colors: ["#C2410C", "#F97316", "#F59E0B", "#FFFBEB"],
        neutrals: ["#111827", "#4B5563", "#9CA3AF", "#E5E7EB", "#FFFCF5"],
    },
];

const SystemSettingsContext = React.createContext<SystemSettings>(defaultSystemSettings);

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
    const settingsQuery = useQuery({
        queryKey: ["system-settings"],
        queryFn: async () => {
            const response = await api.get<{ data: SystemSettings }>("/system-settings");
            return normalizeSettings(response.data.data);
        },
        staleTime: 5 * 60 * 1000,
    });
    const settings = settingsQuery.data ?? defaultSystemSettings;

    React.useEffect(() => {
        document.documentElement.dataset.palette = settings.color_palette;
        document.title = settings.system_name;

        const existing = document.querySelector<HTMLLinkElement>('link[data-system-favicon="true"]');
        if (!settings.favicon_url) {
            existing?.remove();
            return;
        }

        const favicon = existing ?? document.createElement("link");
        favicon.rel = "icon";
        favicon.dataset.systemFavicon = "true";
        favicon.href = `${settings.favicon_url}?v=${encodeURIComponent(settings.updated_at ?? "current")}`;
        if (!existing) document.head.appendChild(favicon);
    }, [settings]);

    return (
        <SystemSettingsContext.Provider value={settings}>
            {children}
        </SystemSettingsContext.Provider>
    );
}

export function useSystemSettings() {
    return React.useContext(SystemSettingsContext);
}

export function normalizeSettings(settings: SystemSettings): SystemSettings {
    return {
        ...settings,
        favicon_url: resolveMediaUrl(settings.favicon_url),
    };
}
