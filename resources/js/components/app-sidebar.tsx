import {
    BarChart3Icon,
    BoxesIcon,
    Building2Icon,
    ChevronRightIcon,
    PrinterIcon,
    Settings2Icon,
    ShieldCheckIcon,
    ShieldIcon,
    TagIcon,
    TagsIcon,
    UsersIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/authStore";
import { hasPermission } from "@/features/auth/permissions";
import { useSystemSettings } from "@/features/settings/system-settings";

const navGroups = [
    {
        label: "Workspace",
        items: [
            { to: "/dashboard", label: "Dashboard", icon: BarChart3Icon, permission: "report.view" },
            { to: "/print", label: "Print", icon: PrinterIcon, permission: "printing.view" },
            { to: "/products", label: "Product", icon: BoxesIcon, permission: "product.view" },
            { to: "/customers", label: "Customer", icon: Building2Icon, permission: "customer.view" },
            { to: "/templates", label: "Template", icon: TagsIcon, permission: "template.view" },
        ],
    },
    {
        label: "Maintenance",
        items: [
            { to: "/users", label: "Users", icon: UsersIcon, permission: "user.view" },
            { to: "/roles", label: "Role", icon: ShieldIcon, permission: "role.view" },
            { to: "/audit-logs", label: "Audit Logs", icon: ShieldCheckIcon, permission: "audit.view" },
            { to: "/settings", label: "Settings", icon: Settings2Icon, permission: "settings.manage" },
        ],
    },
];

type AppSidebarProps = {
    className?: string;
    onNavigate?: () => void;
};

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
    const location = useLocation();
    const permissions = useAuthStore((state) => state.user?.permissions);
    const settings = useSystemSettings();

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-border bg-white dark:bg-background",
                className,
            )}
        >
            <div className="flex h-16 items-center gap-3 border-b border-border px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {settings.favicon_url ? (
                        <img src={settings.favicon_url} alt="" className="size-7 object-contain" />
                    ) : (
                        <TagIcon className="size-5" />
                    )}
                </div>
                <div className="min-w-0">
                    <div className="truncate font-semibold">{settings.system_name}</div>
                    <div className="truncate text-xs text-foreground/50">
                        {settings.system_tagline}
                    </div>
                </div>
            </div>

            <nav className="min-h-0 flex-1 space-y-5 overflow-auto p-3">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <div className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-foreground/45">
                            {group.label}
                        </div>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const allowed = !item.permission || hasPermission(permissions, item.permission);
                                const content = (
                                    <>
                                        <item.icon className="size-4" />
                                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                        <ChevronRightIcon className="size-4 opacity-0 transition group-hover:opacity-50" />
                                    </>
                                );

                                return allowed ? <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={onNavigate}
                                    className={() =>
                                        cn(
                                            "group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground",
                                            location.pathname === item.to &&
                                                "bg-muted text-foreground",
                                        )
                                    }
                                >{content}</NavLink> : <div
                                    key={item.to}
                                    aria-disabled="true"
                                    title={`No ${item.label} access`}
                                    className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground/30"
                                >{content}</div>;
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
