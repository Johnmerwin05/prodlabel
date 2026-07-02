import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/shared/services/api";
import { useCan } from "@/features/auth/permissions";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

import {
    ConfirmUserActionDialog,
    PasswordResetSheet,
} from "./partials/UserDialogs";
import { UserFormSheet } from "./partials/UserForms";
import { UserStats } from "./partials/UserStats";
import { UsersDataTable } from "./partials/UsersDataTable";
import {
    type ConfirmAction,
    type PaginatedUsers,
    type PasswordFormValues,
    type Permission,
    type Role,
    type User,
    type UserColumnKey,
    type UserFilters,
    type UserFormValues,
    type UserResourceResponse,
    defaultFilters,
    UserPresenter,
} from "./partials/user.model";

export function UserListPage() {
    const canCreate = useCan("user.create");
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const [filters, setFilters] = React.useState<UserFilters>(defaultFilters);
    const [draftFilters, setDraftFilters] =
        React.useState<UserFilters>(defaultFilters);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [passwordUser, setPasswordUser] = React.useState<User | null>(null);
    const [confirmAction, setConfirmAction] =
        React.useState<ConfirmAction | null>(null);
    const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
        () => new Set(),
    );
    const [visibleColumns, setVisibleColumns] = React.useState<
        Record<UserColumnKey, boolean>
    >({
        username: true,
        roles: true,
        status: true,
        updated_at: true,
    });

    const usersQuery = useQuery({
        queryKey: ["users", filters],
        queryFn: async () => {
            const response = await api.get<PaginatedUsers>("/users", {
                params: UserPresenter.buildIndexParams(filters),
            });
            return response.data;
        },
    });

    const rolesQuery = useUserRolesQuery();
    const permissionsQuery = useUserPermissionsQuery();
    const users = usersQuery.data?.data ?? [];
    const meta = usersQuery.data?.meta;
    const allPageRowsSelected =
        users.length > 0 && users.every((user) => selectedRows.has(user.id));
    const somePageRowsSelected =
        users.some((user) => selectedRows.has(user.id)) && !allPageRowsSelected;
    const stats = React.useMemo(() => UserPresenter.getStats(users), [users]);

    React.useEffect(() => {
        setSelectedRows(new Set());
    }, [filters]);

    const updateUser = useMutation({
        mutationFn: async (values: UserFormValues) => {
            if (!editingUser) throw new Error("No user selected");
            const response = await api.put<UserResourceResponse>(
                `/users/${editingUser.id}`,
                values,
            );
            return response.data.data;
        },
        onSuccess: () => {
            notify({ variant: "success", title: "User updated" });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setEditingUser(null);
        },
        onError: (error) => showApiError(error, notify),
    });

    const createUser = useMutation({
        mutationFn: async (values: UserFormValues) => {
            const response = await api.post<UserResourceResponse>(
                "/users",
                values,
            );
            return response.data.data;
        },
        onSuccess: () => {
            notify({ variant: "success", title: "User created" });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsCreateOpen(false);
        },
        onError: (error) => showApiError(error, notify),
    });

    const actionMutation = useMutation({
        mutationFn: async (action: ConfirmAction) => {
            if (action.kind === "delete")
                return api.delete(`/users/${action.user.id}`);
            if (action.kind === "restore")
                return api.post(`/users/${action.user.id}/restore`);
            if (action.kind === "lock")
                return api.post(`/users/${action.user.id}/lock`);
            return api.post(`/users/${action.user.id}/unlock`);
        },
        onSuccess: (_, action) => {
            notify({ variant: "success", title: action.successMessage });
            setConfirmAction(null);
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onError: (error) => showApiError(error, notify),
    });

    const resetPassword = useMutation({
        mutationFn: async (values: PasswordFormValues) => {
            if (!passwordUser) throw new Error("No user selected");
            return api.post(`/users/${passwordUser.id}/reset-password`, values);
        },
        onSuccess: () => {
            notify({ variant: "success", title: "Password reset" });
            setPasswordUser(null);
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onError: (error) => showApiError(error, notify),
    });

    function applyFilters() {
        setFilters({ ...draftFilters, page: 1 });
    }

    function resetFilters() {
        setDraftFilters(defaultFilters);
        setFilters(defaultFilters);
    }

    function applyColumnFilters(next: Partial<UserFilters>) {
        const updated = { ...draftFilters, ...next, page: 1 };
        setDraftFilters(updated);
        setFilters(updated);
    }

    function toggleRowSelection(userId: number, selected: boolean) {
        setSelectedRows((current) => {
            const next = new Set(current);
            if (selected) next.add(userId);
            else next.delete(userId);
            return next;
        });
    }

    function togglePageSelection(selected: boolean) {
        setSelectedRows((current) => {
            const next = new Set(current);
            users.forEach((user) => {
                if (selected) next.add(user.id);
                else next.delete(user.id);
            });
            return next;
        });
    }

    async function refreshUsers() {
        await queryClient.invalidateQueries({ queryKey: ["users"] });
        await usersQuery.refetch();
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="User Management"
                description="Manage team access, role assignments, account status, and secure recovery actions."
                actions={
                    <>
                        <Button disabled={!canCreate} onClick={() => setIsCreateOpen(true)}>
                            <PlusIcon className="size-4" />
                            Create User
                        </Button>
                    </>
                }
            />

            <UserStats stats={stats} />

            <UsersDataTable
                users={users}
                meta={meta}
                filters={filters}
                draftFilters={draftFilters}
                visibleColumns={visibleColumns}
                selectedRows={selectedRows}
                isLoading={usersQuery.isLoading}
                isError={usersQuery.isError}
                isFetching={usersQuery.isFetching}
                allPageRowsSelected={allPageRowsSelected}
                somePageRowsSelected={somePageRowsSelected}
                selectedCount={selectedRows.size}
                onDraftFiltersChange={setDraftFilters}
                onApplyFilters={applyFilters}
                onRoleFilterChange={(roles) => applyColumnFilters({ roles })}
                onStatusFilterChange={(statuses) =>
                    applyColumnFilters({ statuses })
                }
                onResetFilters={resetFilters}
                onFiltersChange={setFilters}
                onVisibleColumnsChange={setVisibleColumns}
                onRefresh={refreshUsers}
                onToggleRowSelection={toggleRowSelection}
                onTogglePageSelection={togglePageSelection}
                onEdit={setEditingUser}
                onResetPassword={setPasswordUser}
                onConfirm={setConfirmAction}
                onCreate={() => setIsCreateOpen(true)}
            />

            <UserFormSheet
                open={isCreateOpen || Boolean(editingUser)}
                user={editingUser}
                roles={rolesQuery.data ?? []}
                permissions={permissionsQuery.data ?? []}
                isSaving={createUser.isPending || updateUser.isPending}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateOpen(false);
                        setEditingUser(null);
                    }
                }}
                onSubmit={(values) => {
                    if (editingUser) updateUser.mutate(values);
                    else createUser.mutate(values);
                }}
            />

            <PasswordResetSheet
                user={passwordUser}
                isSaving={resetPassword.isPending}
                onOpenChange={(open) => {
                    if (!open) setPasswordUser(null);
                }}
                onSubmit={(values) => resetPassword.mutate(values)}
            />

            <ConfirmUserActionDialog
                action={confirmAction}
                isSaving={actionMutation.isPending}
                onOpenChange={(open) => {
                    if (!open) setConfirmAction(null);
                }}
                onConfirm={() => {
                    if (confirmAction) actionMutation.mutate(confirmAction);
                }}
            />
        </div>
    );
}

function useUserRolesQuery() {
    return useQuery({
        queryKey: ["user-role-options"],
        queryFn: async () => {
            const response = await api.get<{ data: Role[] }>(
                "/users/roles/options",
            );
            return response.data.data;
        },
    });
}

function useUserPermissionsQuery() {
    return useQuery({
        queryKey: ["user-permission-options"],
        queryFn: async () => {
            const response = await api.get<{ data: Permission[] }>(
                "/users/permissions/options",
            );
            return response.data.data;
        },
    });
}

function showApiError(
    error: unknown,
    notify: (toast: {
        title: string;
        description?: string;
        variant?: ToastVariant;
    }) => void,
) {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        notify({
            variant: "error",
            title: "Request failed",
            description: message ?? "The request could not be completed",
        });
        return;
    }

    notify({
        variant: "error",
        title: "Request failed",
        description:
            error instanceof Error
                ? error.message
                : "The request could not be completed",
    });
}
