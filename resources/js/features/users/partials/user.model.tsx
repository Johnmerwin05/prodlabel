import * as React from "react";
import { CheckCircle2Icon, LockIcon, UserRoundIcon } from "lucide-react";
import { z } from "zod";

export type Role = {
    id: number;
    name: string;
    slug: string;
    permission_ids: number[];
};

export type Permission = {
    id: number;
    name: string;
    slug: string;
    module: string;
};

export type User = {
    id: number;
    employee_code: string | null;
    username: string;
    name: string;
    email: string;
    status: "active" | "inactive" | "locked";
    locked_at: string | null;
    deleted_at: string | null;
    roles: Role[];
    permission_ids: number[];
    uses_custom_permissions: boolean;
    created_at: string;
    updated_at: string;
};

export type PaginatedUsers = {
    data: User[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type UserFilters = {
    search: string;
    roles: string[];
    statuses: Array<User["status"]>;
    withTrashed: boolean;
    page: number;
    perPage: number;
};

export type UserColumnKey = "username" | "roles" | "status" | "updated_at";

export type ConfirmAction = {
    kind: "delete" | "restore" | "lock" | "unlock";
    user: User;
    title: string;
    description: string;
    confirmLabel: string;
    successMessage: string;
    destructive?: boolean;
};

export type UserResourceResponse = {
    data: User;
};

export const userSchema = z.object({
    employee_code: z.string().max(60).optional(),
    username: z
        .string()
        .min(3, "Username is required")
        .max(80)
        .regex(
            /^[A-Za-z0-9_-]+$/,
            "Use letters, numbers, dashes, or underscores",
        ),
    name: z.string().min(2, "Name is required").max(255),
    email: z.string().email("Enter a valid email"),
    password: z.string().optional(),
    status: z.enum(["active", "inactive", "locked"]),
    role_ids: z.array(z.number()).min(1, "Select at least one role"),
    permission_ids: z.array(z.number()),
});

export type UserFormValues = z.infer<typeof userSchema>;

export const passwordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export const defaultFilters: UserFilters = {
    search: "",
    roles: [],
    statuses: [],
    withTrashed: false,
    page: 1,
    perPage: 10,
};

export const userColumnLabels: Record<UserColumnKey, string> = {
    username: "Username",
    roles: "Roles",
    status: "Status",
    updated_at: "Updated",
};

export const statusOptions: Array<{
    label: string;
    value: User["status"];
    icon: React.ReactNode;
}> = [
    {
        label: "Active",
        value: "active",
        icon: <CheckCircle2Icon className="size-4 text-emerald-600" />,
    },
    {
        label: "Inactive",
        value: "inactive",
        icon: <UserRoundIcon className="size-4 text-muted-foreground" />,
    },
    {
        label: "Locked",
        value: "locked",
        icon: <LockIcon className="size-4 text-amber-600" />,
    },
];

export class UserPresenter {
    static buildIndexParams(filters: UserFilters) {
        return {
            page: filters.page,
            per_page: filters.perPage,
            search: filters.search || undefined,
            role: filters.roles.length > 0 ? filters.roles : undefined,
            status: filters.statuses.length > 0 ? filters.statuses : undefined,
            with_trashed: filters.withTrashed ? 1 : undefined,
        };
    }

    static getStats(users: User[]) {
        return {
            active: users.filter(
                (user) => user.status === "active" && !user.deleted_at,
            ).length,
            locked: users.filter(
                (user) => user.status === "locked" && !user.deleted_at,
            ).length,
            inactive: users.filter(
                (user) => user.status === "inactive" && !user.deleted_at,
            ).length,
            deleted: users.filter((user) => Boolean(user.deleted_at)).length,
        };
    }

    static getDefaults(user: User | null): UserFormValues {
        return {
            employee_code: user?.employee_code ?? "",
            username: user?.username ?? "",
            name: user?.name ?? "",
            email: user?.email ?? "",
            password: "",
            status: user?.status ?? "active",
            role_ids: user?.roles.map((role) => role.id) ?? [],
            permission_ids: user?.permission_ids ?? [],
        };
    }

    static buildSchema(user: User | null) {
        return userSchema.superRefine((values, context) => {
            if (!user && !values.password) {
                context.addIssue({
                    code: "custom",
                    message: "Password is required",
                    path: ["password"],
                });
            }

            if (values.password && values.password.length < 8) {
                context.addIssue({
                    code: "custom",
                    message: "Password must be at least 8 characters",
                    path: ["password"],
                });
            }
        });
    }

    static buildConfirm(kind: ConfirmAction["kind"], user: User): ConfirmAction {
        const map = {
            delete: {
                title: "Delete user?",
                description: `${user.name} will be archived and can be restored later.`,
                confirmLabel: "Delete",
                successMessage: "User deleted",
                destructive: true,
            },
            restore: {
                title: "Restore user?",
                description: `${user.name} will be restored to the active user list.`,
                confirmLabel: "Restore",
                successMessage: "User restored",
            },
            lock: {
                title: "Lock user?",
                description: `${user.name} will be blocked from signing in until unlocked.`,
                confirmLabel: "Lock",
                successMessage: "User locked",
            },
            unlock: {
                title: "Unlock user?",
                description: `${user.name} will be allowed to sign in again.`,
                confirmLabel: "Unlock",
                successMessage: "User unlocked",
            },
        } satisfies Record<
            ConfirmAction["kind"],
            Omit<ConfirmAction, "kind" | "user">
        >;

        return { kind, user, ...map[kind] };
    }

    static formatDate(value?: string | null) {
        if (!value) return "Never";

        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(new Date(value));
    }

    static getInitials(name: string) {
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }
}

export function permissionGroup(permission: Permission) {
    return ["product.print", "product.reprint"].includes(permission.slug)
        ? "printing"
        : permission.module;
}

export function permissionLabel(permission: Permission) {
    const action = permission.slug.split(".").at(-1) ?? permission.name;
    const labels: Record<string, string> = {
        view: "View",
        create: "Create",
        update: "Edit",
        delete: "Delete",
        restore: "Restore",
        print: "Print",
        reprint: "Reprint",
        export: "Export Data",
        manage: "Create / Edit",
        archive: "Delete / Archive",
        lock: "Lock / Unlock",
        "reset-password": "Reset Password",
    };

    return labels[action] ?? toTitleCase(action);
}

export function toTitleCase(value: string) {
    return value
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
