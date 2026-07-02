import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    EyeIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PlusIcon,
    RefreshCwIcon,
    SearchIcon,
    Trash2Icon,
    XIcon,
} from "lucide-react";

import { DataTablePagination, DataTableSurface } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCan } from "@/features/auth/permissions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api } from "@/shared/services/api";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

import { RoleFormSheet } from "./partials/RoleFormSheet";
import {
    type PaginatedRoles,
    type Role,
    type RoleFilters,
    type RoleFormValues,
    defaultRoleFilters,
} from "./partials/role.model";

export function RoleManagementPage() {
    const canCreate = useCan("role.create");
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const [filters, setFilters] =
        React.useState<RoleFilters>(defaultRoleFilters);
    const [draftSearch, setDraftSearch] = React.useState("");
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = React.useState<Role | null>(null);

    const rolesQuery = useQuery({
        queryKey: ["roles", filters],
        queryFn: async () => {
            const response = await api.get<PaginatedRoles>("/roles", {
                params: {
                    search: filters.search || undefined,
                    page: filters.page,
                    per_page: filters.perPage,
                },
            });
            return response.data;
        },
    });
    const createRole = useMutation({
        mutationFn: (values: RoleFormValues) => api.post("/roles", values),
        onSuccess: () => {
            notify({ variant: "success", title: "Role created" });
            setIsCreateOpen(false);
            invalidateRoleQueries(queryClient);
        },
        onError: (error) => showApiError(error, notify),
    });
    const updateRole = useMutation({
        mutationFn: (values: RoleFormValues) => {
            if (!editingRole) throw new Error("No role selected");
            return api.put(`/roles/${editingRole.id}`, values);
        },
        onSuccess: () => {
            notify({ variant: "success", title: "Role updated" });
            setEditingRole(null);
            invalidateRoleQueries(queryClient);
        },
        onError: (error) => showApiError(error, notify),
    });
    const deleteRole = useMutation({
        mutationFn: async (role: Role) => api.delete(`/roles/${role.id}`),
        onSuccess: () => {
            notify({ variant: "success", title: "Role deleted" });
            setDeletingRole(null);
            invalidateRoleQueries(queryClient);
        },
        onError: (error) => showApiError(error, notify),
    });

    async function refreshRoles() {
        await invalidateRoleQueries(queryClient);
        await rolesQuery.refetch();
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Role Management"
                description="Create and maintain role labels used to organize users by responsibility. Individual access is configured in User Management."
                actions={
                    <Button disabled={!canCreate} onClick={() => setIsCreateOpen(true)}>
                        <PlusIcon className="size-4" />
                        Create Role
                    </Button>
                }
            />

            <div className="space-y-0">
                <form
                    className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setFilters((current) => ({
                            ...current,
                            search: draftSearch,
                            page: 1,
                        }));
                    }}
                >
                    <div className="flex flex-1 items-center gap-2">
                        <div className="relative w-full sm:w-72">
                            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={draftSearch}
                                className="pl-8"
                                placeholder="Filter roles..."
                                onChange={(event) =>
                                    setDraftSearch(event.target.value)
                                }
                            />
                        </div>
                        <Button type="submit">Apply</Button>
                        {draftSearch || filters.search ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="px-3"
                                onClick={() => {
                                    setDraftSearch("");
                                    setFilters(defaultRoleFilters);
                                }}
                            >
                                Reset
                                <XIcon className="size-4" />
                            </Button>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={rolesQuery.isFetching}
                        onClick={refreshRoles}
                    >
                        <RefreshCwIcon
                            className={`size-4 ${rolesQuery.isFetching ? "animate-spin" : ""}`}
                        />
                        {rolesQuery.isFetching ? "Refreshing..." : "Refresh"}
                    </Button>
                </form>

                <DataTableSurface>
                    {rolesQuery.isLoading ? (
                        <RoleTableSkeleton />
                    ) : rolesQuery.isError ? (
                        <EmptyState
                            title="Unable to load roles"
                            description="Please refresh the page or verify your role management permission."
                            action={<Button onClick={refreshRoles}>Retry</Button>}
                        />
                    ) : (rolesQuery.data?.data.length ?? 0) === 0 ? (
                        <EmptyState
                            title="No roles found"
                            description="Create a role or adjust your search."
                            action={
                                <Button disabled={!canCreate} onClick={() => setIsCreateOpen(true)}>
                                    Create Role
                                </Button>
                            }
                        />
                    ) : (
                        <RolesTable
                            roles={rolesQuery.data?.data ?? []}
                            onEdit={setEditingRole}
                            onDelete={setDeletingRole}
                        />
                    )}
                </DataTableSurface>
                {rolesQuery.data ? (
                    <DataTablePagination
                        meta={rolesQuery.data.meta}
                        selectedCount={0}
                        totalRows={rolesQuery.data.data.length}
                        onPageChange={(page) =>
                            setFilters((current) => ({ ...current, page }))
                        }
                        onPageSizeChange={(perPage) =>
                            setFilters((current) => ({
                                ...current,
                                page: 1,
                                perPage,
                            }))
                        }
                    />
                ) : null}
            </div>

            <RoleFormSheet
                open={isCreateOpen || Boolean(editingRole)}
                role={editingRole}
                isSaving={createRole.isPending || updateRole.isPending}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateOpen(false);
                        setEditingRole(null);
                    }
                }}
                onSubmit={(values) => {
                    if (editingRole) updateRole.mutate(values);
                    else createRole.mutate(values);
                }}
            />

            <AlertDialog
                open={Boolean(deletingRole)}
                onOpenChange={(open) => {
                    if (!open) setDeletingRole(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete role?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletingRole?.users_count
                                ? `${deletingRole.name} is assigned to ${deletingRole.users_count} user(s) and must be unassigned before deletion.`
                                : `This will permanently delete ${deletingRole?.name ?? "this role"}.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={
                                deleteRole.isPending ||
                                Boolean(deletingRole?.users_count)
                            }
                            onClick={(event) => {
                                event.preventDefault();
                                if (deletingRole) deleteRole.mutate(deletingRole);
                            }}
                        >
                            {deleteRole.isPending ? "Deleting..." : "Delete Role"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function RolesTable({
    roles,
    onEdit,
    onDelete,
}: {
    roles: Role[];
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
}) {
    const canUpdate = useCan("role.update");
    const canDelete = useCan("role.delete");
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-64">Role</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {roles.map((role) => {
                    return (
                        <TableRow key={role.id}>
                            <TableCell>
                                <div className="flex items-start gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-xs font-semibold">
                                        {role.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 font-medium">
                                            {role.name}
                                            {role.is_system ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="rounded-sm"
                                                >
                                                    System
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {role.slug}
                                        </div>
                                        <div className="mt-1 max-w-sm truncate text-xs text-muted-foreground">
                                            {role.description ?? "No description"}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{role.users_count}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {new Intl.DateTimeFormat(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                }).format(new Date(role.updated_at))}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Actions for ${role.name}`}
                                        >
                                            <MoreHorizontalIcon className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem disabled={!role.is_system && !canUpdate} onClick={() => onEdit(role)}>
                                            {role.is_system ? (
                                                <EyeIcon className="size-4" />
                                            ) : (
                                                <PencilIcon className="size-4" />
                                            )}
                                            {role.is_system
                                                ? "View Role"
                                                : "Edit Role"}
                                        </DropdownMenuItem>
                                        {!role.is_system ? (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    disabled={!canDelete}
                                                    variant="destructive"
                                                    onClick={() => onDelete(role)}
                                                >
                                                    <Trash2Icon className="size-4" />
                                                    Delete Role
                                                </DropdownMenuItem>
                                            </>
                                        ) : null}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function RoleTableSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
            ))}
        </div>
    );
}

async function invalidateRoleQueries(
    queryClient: ReturnType<typeof useQueryClient>,
) {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roles"] }),
        queryClient.invalidateQueries({ queryKey: ["user-role-options"] }),
    ]);
}

function showApiError(
    error: unknown,
    notify: (toast: {
        title: string;
        description?: string;
        variant?: ToastVariant;
    }) => void,
) {
    const description = axios.isAxiosError(error)
        ? (error.response?.data?.message ??
          Object.values(error.response?.data?.errors ?? {}).flat().at(0))
        : error instanceof Error
          ? error.message
          : "The request could not be completed";

    notify({
        variant: "error",
        title: "Request failed",
        description: String(description),
    });
}
