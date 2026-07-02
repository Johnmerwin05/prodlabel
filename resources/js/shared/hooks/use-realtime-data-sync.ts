import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/authStore";
import { createEcho } from "@/shared/services/echo";
import { api } from "@/shared/services/api";

type DataChangedEvent = {
    entity: "customer" | "product" | "template" | "print" | "user" | "role" | "permission";
    action: "created" | "updated" | "deleted" | "restored";
    id: number | string;
};

const entityQueryKeys: Record<DataChangedEvent["entity"], string[]> = {
    customer: ["customers", "product-customers", "print-filter-customers", "template-customer-options", "template-designer-customers", "templates"],
    product: ["products", "request-print-products", "prints"],
    template: ["templates", "template", "request-print-customer-template"],
    print: ["prints"],
    user: ["users"],
    role: ["roles", "user-role-options", "users"],
    permission: ["roles", "user-permission-options", "users"],
};

const sharedQueryKeys = ["dashboard", "printing-report", "audit-logs"];

export function useRealtimeDataSync() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    React.useEffect(() => {
        if (!user) return;

        const echo = createEcho();
        const channel = echo.private("application.data");
        const pendingKeys = new Set<string>();
        let invalidationTimer: ReturnType<typeof setTimeout> | undefined;

        channel.listen(".application.data.changed", (event: DataChangedEvent) => {
            const keys = [...(entityQueryKeys[event.entity] ?? []), ...sharedQueryKeys];
            for (const key of new Set(keys)) {
                pendingKeys.add(key);
            }

            clearTimeout(invalidationTimer);
            invalidationTimer = setTimeout(() => {
                for (const key of pendingKeys) {
                    void queryClient.invalidateQueries({ queryKey: [key] });
                }
                pendingKeys.clear();
            }, 150);

            if (event.entity === "user" && Number(event.id) === user.id) {
                void api.get("/auth/me").then((response) => setUser(response.data));
            }
        });

        return () => {
            clearTimeout(invalidationTimer);
            echo.leave("application.data");
            echo.disconnect();
        };
    }, [queryClient, setUser, user]);
}
