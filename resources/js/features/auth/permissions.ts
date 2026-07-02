import { useAuthStore } from "@/features/auth/authStore";

export function hasPermission(
    permissions: string[] | undefined,
    permission: string,
) {
    return permissions?.includes(permission) ?? false;
}

export function useCan(permission: string) {
    return useAuthStore((state) =>
        hasPermission(state.user?.permissions, permission),
    );
}
