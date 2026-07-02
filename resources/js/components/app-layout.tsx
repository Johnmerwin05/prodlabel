import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    ChevronDownIcon,
    LogOutIcon,
    MoonIcon,
    PanelLeftIcon,
    Settings2Icon,
    SunIcon,
    XIcon,
} from "lucide-react";
import { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/utils";
import { api } from "@/shared/services/api";
import { useRealtimeDataSync } from "@/shared/hooks/use-realtime-data-sync";
import { useSystemSettings } from "@/features/settings/system-settings";

const pageLabels: Record<string, string> = {
    dashboard: "Dashboard",
    customers: "Customers",
    users: "Users",
    products: "Products",
    printing: "Printing",
    mass: "Mass Printing",
    templates: "Templates",
    designer: "Designer",
    roles: "Role Management",
    "audit-logs": "Audit Logs",
    settings: "Settings",
    profile: "My Profile",
    "no-access": "No Access",
};

export function AppLayout() {
    useRealtimeDataSync();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const systemSettings = useSystemSettings();
    const segments = location.pathname.split("/").filter(Boolean);
    const currentLabel =
        pageLabels[segments.at(-1) ?? "dashboard"] ?? "Workspace";

    function toggleSidebar() {
        if (window.matchMedia("(min-width: 1024px)").matches) {
            setSidebarCollapsed((value) => !value);
            return;
        }

        setSidebarOpen((value) => !value);
    }

    return (
        <div
            className={cn(
                "fixed inset-0 grid overflow-hidden bg-background transition-[grid-template-columns] duration-200 lg:grid-cols-[280px_1fr]",
                sidebarCollapsed && "lg:grid-cols-[0_1fr]",
            )}
        >
            <div className="hidden overflow-hidden lg:block">
                <AppSidebar />
            </div>

            {sidebarOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        className="absolute inset-0 bg-black/30"
                        aria-label="Close navigation"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative h-full w-[min(86vw,320px)] bg-white shadow-xl dark:bg-background">
                        <Button
                            className="absolute right-3 top-3 z-10"
                            size="icon"
                            variant="ghost"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Close navigation"
                        >
                            <XIcon className="size-5" />
                        </Button>
                        <AppSidebar onNavigate={() => setSidebarOpen(false)} />
                    </div>
                </div>
            ) : null}

            <main className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background">
                <header className="flex h-16 shrink-0 items-center justify-between bg-white px-4 dark:bg-background">
                    <div className="flex min-w-0 items-center gap-2">
                        <Button
                            className="h-8 w-8"
                            size="icon"
                            variant="ghost"
                            aria-label="Toggle sidebar"
                            onClick={toggleSidebar}
                        >
                            <PanelLeftIcon className="size-5" />
                        </Button>
                        <div className="mx-1 h-5 w-px bg-border" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden sm:inline-flex">
                                    <span>
                                        {segments[0] === "printing"
                                            ? "Production"
                                            : "Workspace"}
                                    </span>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {currentLabel}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <NotificationBell />
                        <HeaderAccountMenu />
                    </div>
                </header>
                <div className="min-h-0 overflow-auto">
                    <div className="space-y-6 p-4 md:p-6">
                        <Outlet />
                    </div>
                </div>
                <footer className="shrink-0 border-t bg-background px-4 py-5 text-center text-xs text-muted-foreground md:px-6">
                    Copyright © {new Date().getFullYear()} {systemSettings.footer_content}
                </footer>
            </main>
        </div>
    );
}

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
        >
            {isDark ? (
                <SunIcon className="size-4" />
            ) : (
                <MoonIcon className="size-4" />
            )}
        </Button>
    );
}

function HeaderAccountMenu() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const clearSession = useAuthStore((state) => state.clearSession);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const systemSettings = useSystemSettings();
    const profile = {
        name: user?.name ?? "User",
        displayName: getFirstName(user?.name ?? "User"),
        email: user?.email ?? "",
        avatar: "",
    };

    async function logout() {
        setIsLoggingOut(true);
        try {
            await api.post("/auth/logout");
        } finally {
            clearSession();
            setIsLoggingOut(false);
            setIsLogoutOpen(false);
            navigate("/login", { replace: true });
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-9 cursor-pointer gap-2 rounded-lg px-2 hover:bg-transparent hover:text-foreground"
                        aria-label="Open account menu"
                    >
                        <Avatar className="size-7 rounded-lg">
                            <AvatarImage
                                src={profile.avatar}
                                alt={profile.name}
                            />
                            <AvatarFallback className="rounded-lg text-xs">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                            {profile.displayName}
                        </span>
                        <ChevronDownIcon className="size-4 text-foreground/50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                        <div className="truncate text-sm font-medium">
                            {profile.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                            {profile.email}
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <Settings2Icon className="size-4" />
                        Profile settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        disabled={isLoggingOut}
                        onSelect={(event) => {
                            event.preventDefault();
                            setIsLogoutOpen(true);
                        }}
                    >
                        <LogOutIcon className="size-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogMedia>
                            <LogOutIcon className="size-5" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            Log out of {systemSettings.system_name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You will be returned to the login page and must sign
                            in again to access the production console.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoggingOut}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isLoggingOut}
                            onClick={(event) => {
                                event.preventDefault();
                                logout();
                            }}
                        >
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getFirstName(name: string) {
    return name.trim().split(/\s+/)[0] || "User";
}
