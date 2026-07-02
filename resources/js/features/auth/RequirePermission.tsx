import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useCan } from "@/features/auth/permissions";

export function RequirePermission({
    permission,
    children,
}: {
    permission: string;
    children: ReactNode;
}) {
    const allowed = useCan(permission);
    const location = useLocation();

    return allowed ? (
        children
    ) : (
        <Navigate
            to="/no-access"
            replace
            state={{ deniedPath: `${location.pathname}${location.search}` }}
        />
    );
}
