import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
    BellIcon,
    Building2Icon,
    CheckCheckIcon,
    PackageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { api } from "@/shared/services/api";
import { createEcho } from "@/shared/services/echo";

type NotificationType = "customer" | "product" | "system";

type AppNotification = {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    action_url: string | null;
    entity_id: number | null;
    actor: { id: number; name: string } | null;
    read_at: string | null;
    created_at: string;
};

type NotificationResponse = {
    data: AppNotification[];
    meta: { unread_count: number };
};

type NotificationGroup = {
    type: "customer" | "product";
    latest: AppNotification;
    unreadCount: number;
};

export function NotificationBell() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const queryKey = React.useMemo(
        () => ["notifications", user?.id] as const,
        [user?.id],
    );

    const notificationsQuery = useQuery({
        queryKey,
        enabled: Boolean(user),
        queryFn: async () => {
            const response = await api.get<NotificationResponse>(
                "/notifications",
            );
            return response.data;
        },
        staleTime: 30_000,
        refetchInterval: 60_000,
    });

    React.useEffect(() => {
        if (!user) return;

        const echo = createEcho();
        const channel = echo.private(`App.Models.User.${user.id}`);

        channel.listen(
            ".notification.created",
            (event: { notification: AppNotification }) => {
                queryClient.setQueryData<NotificationResponse>(
                    queryKey,
                    (current) => ({
                        data: [
                            event.notification,
                            ...(current?.data ?? []).filter(
                                (item) => item.id !== event.notification.id,
                            ),
                        ].slice(0, 50),
                        meta: {
                            unread_count:
                                (current?.meta.unread_count ?? 0) + 1,
                        },
                    }),
                );
            },
        );

        return () => {
            echo.leave(`App.Models.User.${user.id}`);
            echo.disconnect();
        };
    }, [queryClient, queryKey, user]);

    const readType = useMutation({
        mutationFn: (type: "customer" | "product") =>
            api.post("/notifications/read-type", { type }),
        onMutate: (type) => markTypeRead(queryClient, queryKey, type),
        onError: () =>
            queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });
    const readAll = useMutation({
        mutationFn: () => api.post("/notifications/read-all"),
        onMutate: () => markAllRead(queryClient, queryKey),
        onError: () =>
            queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });

    const response = notificationsQuery.data;
    const unreadCount = response?.meta.unread_count ?? 0;
    const groups = groupNotifications(response?.data ?? []);

    function openGroup(group: NotificationGroup) {
        if (group.unreadCount > 0) readType.mutate(group.type);
        navigate(group.latest.action_url ?? `/${group.type}s`);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                >
                    <BellIcon className="size-4" />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[min(24rem,calc(100vw-1rem))] p-0"
            >
                <div className="flex items-center justify-between px-4 py-3">
                    <DropdownMenuLabel className="p-0">
                        <div className="font-semibold">Notifications</div>
                        <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                            {unreadCount
                                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                                : "You’re all caught up"}
                        </div>
                    </DropdownMenuLabel>
                    {unreadCount > 0 ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            disabled={readAll.isPending}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                readAll.mutate();
                            }}
                        >
                            <CheckCheckIcon className="size-3.5" />
                            Mark all read
                        </Button>
                    ) : null}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-96 overflow-y-auto p-1.5">
                    {notificationsQuery.isLoading ? (
                        <NotificationSkeleton />
                    ) : groups.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
                                <BellIcon className="size-4 text-muted-foreground" />
                            </div>
                            <p className="mt-3 text-sm font-medium">
                                No notifications yet
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                New customers and products will appear here.
                            </p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <DropdownMenuItem
                                key={group.type}
                                className="items-start gap-3 rounded-lg px-3 py-3"
                                onSelect={() => openGroup(group)}
                            >
                                <div className="relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    {group.type === "product" ? (
                                        <PackageIcon className="size-4" />
                                    ) : (
                                        <Building2Icon className="size-4" />
                                    )}
                                    {group.unreadCount > 0 ? (
                                        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-popover" />
                                    ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-medium leading-5">
                                            {group.unreadCount > 0
                                                ? `${group.unreadCount} new ${group.type}${group.unreadCount === 1 ? "" : "s"}`
                                                : group.latest.title}
                                        </p>
                                        <span className="shrink-0 text-[11px] text-muted-foreground">
                                            {formatDistanceToNow(
                                                new Date(group.latest.created_at),
                                                { addSuffix: true },
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                        {group.latest.message}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function groupNotifications(items: AppNotification[]): NotificationGroup[] {
    return (["product", "customer"] as const)
        .map((type) => {
            const matching = items.filter((item) => item.type === type);
            if (!matching.length) return null;

            return {
                type,
                latest: matching[0],
                unreadCount: matching.filter((item) => !item.read_at).length,
            };
        })
        .filter((group): group is NotificationGroup => Boolean(group))
        .sort(
            (a, b) =>
                new Date(b.latest.created_at).getTime() -
                new Date(a.latest.created_at).getTime(),
        );
}

function markTypeRead(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: readonly [string, number | undefined],
    type: "customer" | "product",
) {
    const now = new Date().toISOString();
    queryClient.setQueryData<NotificationResponse>(queryKey, (current) => {
        if (!current) return current;
        const changed = current.data.filter(
            (item) => item.type === type && !item.read_at,
        ).length;
        return {
            data: current.data.map((item) =>
                item.type === type && !item.read_at
                    ? { ...item, read_at: now }
                    : item,
            ),
            meta: {
                unread_count: Math.max(
                    0,
                    current.meta.unread_count - changed,
                ),
            },
        };
    });
}

function markAllRead(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: readonly [string, number | undefined],
) {
    const now = new Date().toISOString();
    queryClient.setQueryData<NotificationResponse>(queryKey, (current) =>
        current
            ? {
                  data: current.data.map((item) => ({
                      ...item,
                      read_at: item.read_at ?? now,
                  })),
                  meta: { unread_count: 0 },
              }
            : current,
    );
}

function NotificationSkeleton() {
    return (
        <div className="space-y-2 p-2">
            {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 py-2">
                    <Skeleton className="size-9 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
