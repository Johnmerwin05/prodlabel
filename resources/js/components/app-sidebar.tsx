import {
    BarChart3Icon,
    BoxesIcon,
    Building2Icon,
    ChevronRightIcon,
    PrinterIcon,
    Settings2Icon,
    ShieldCheckIcon,
    TagIcon,
    TagsIcon,
    UsersIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const navGroups = [
    {
        label: "Workspace",
        items: [
            { to: "/dashboard", label: "Dashboard", icon: BarChart3Icon },
            { to: "/print", label: "Print", icon: PrinterIcon },
            { to: "/products", label: "Product", icon: BoxesIcon },
            { to: "/customers", label: "Customer", icon: Building2Icon },
            { to: "/templates", label: "Template", icon: TagsIcon },
            { to: "/reports", label: "Reports", icon: ShieldCheckIcon },
        ],
    },
    {
        label: "Maintenance",
        items: [
            { to: "/users", label: "Users", icon: UsersIcon },
            { to: "/audit-logs", label: "Audit Logs", icon: ShieldCheckIcon },
            { to: "/settings", label: "Settings", icon: Settings2Icon },
        ],
    },
];

type AppSidebarProps = {
    className?: string;
    onNavigate?: () => void;
};

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
    const location = useLocation();

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-border bg-white dark:bg-background",
                className,
            )}
        >
            <div className="flex h-16 items-center gap-3 border-b border-border px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <TagIcon className="size-5" />
                </div>
                <div className="min-w-0">
                    <div className="truncate font-semibold">ProdLabel</div>
                    <div className="truncate text-xs text-foreground/50">
                        Production label control
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
                            {group.items.map((item) => (
                                <NavLink
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
                                >
                                    <item.icon className="size-4" />
                                    <span className="min-w-0 flex-1 truncate">
                                        {item.label}
                                    </span>
                                    <ChevronRightIcon className="size-4 opacity-0 transition group-hover:opacity-50" />
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
