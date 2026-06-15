import * as React from "react";
import { ListFilterIcon, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";

import { DataTablePagination, DataTableSurface } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { type MultiSelectOption, MultiSelect } from "@/components/multi-select";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { UserActions } from "./UserDialogs";
import {
    type ConfirmAction,
    type PaginatedUsers,
    type Role,
    type User,
    type UserColumnKey,
    type UserFilters,
    statusOptions,
    userColumnLabels,
    UserPresenter,
} from "./user.model";

type UsersDataTableProps = {
    users: User[];
    meta: PaginatedUsers["meta"] | undefined;
    roles: Role[];
    filters: UserFilters;
    draftFilters: UserFilters;
    visibleColumns: Record<UserColumnKey, boolean>;
    selectedRows: Set<number>;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    allPageRowsSelected: boolean;
    somePageRowsSelected: boolean;
    selectedCount: number;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<UserFilters>>;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    onFiltersChange: React.Dispatch<React.SetStateAction<UserFilters>>;
    onVisibleColumnsChange: React.Dispatch<
        React.SetStateAction<Record<UserColumnKey, boolean>>
    >;
    onRefresh: () => void | Promise<unknown>;
    onToggleRowSelection: (userId: number, selected: boolean) => void;
    onTogglePageSelection: (selected: boolean) => void;
    onCreate: () => void;
    onEdit: (user: User) => void;
    onResetPassword: (user: User) => void;
    onConfirm: (action: ConfirmAction) => void;
};

export function UsersDataTable({
    users,
    meta,
    roles,
    filters,
    draftFilters,
    visibleColumns,
    selectedRows,
    isLoading,
    isError,
    isFetching,
    allPageRowsSelected,
    somePageRowsSelected,
    selectedCount,
    onDraftFiltersChange,
    onApplyFilters,
    onResetFilters,
    onFiltersChange,
    onVisibleColumnsChange,
    onRefresh,
    onToggleRowSelection,
    onTogglePageSelection,
    onCreate,
    onEdit,
    onResetPassword,
    onConfirm,
}: UsersDataTableProps) {
    const roleOptions = roles.map((role) => ({
        label: role.name,
        value: role.slug,
    }));
    const isFiltered =
        draftFilters.search ||
        draftFilters.roles.length > 0 ||
        draftFilters.statuses.length > 0;

    return (
        <div className="space-y-0">
            <div className="mb-4">
                <DataTableToolbar
                    roles={roleOptions}
                    draftFilters={draftFilters}
                    visibleColumns={visibleColumns}
                    isFiltered={Boolean(isFiltered)}
                    isFetching={isFetching}
                    onDraftFiltersChange={onDraftFiltersChange}
                    onApplyFilters={onApplyFilters}
                    onResetFilters={onResetFilters}
                    onVisibleColumnsChange={onVisibleColumnsChange}
                    onRefresh={onRefresh}
                />
            </div>

            <DataTableSurface>
                {isLoading ? (
                    <UsersTableSkeleton />
                ) : isError ? (
                    <EmptyState
                        title="Unable to load users"
                        description="Please refresh the page or check your connection."
                        action={<Button onClick={onRefresh}>Retry</Button>}
                    />
                ) : users.length === 0 ? (
                    <EmptyState
                        title="No users found"
                        description="Create a user or adjust your filters to find archived accounts."
                        action={
                            <Button onClick={onCreate}>
                                Create User
                            </Button>
                        }
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={
                                            allPageRowsSelected
                                                ? true
                                                : somePageRowsSelected
                                                  ? "indeterminate"
                                                  : false
                                        }
                                        aria-label="Select all"
                                        onCheckedChange={(checked) =>
                                            onTogglePageSelection(
                                                checked === true,
                                            )
                                        }
                                    />
                                </TableHead>
                                <TableHead className="min-w-70">User</TableHead>
                                {visibleColumns.username ? (
                                    <TableHead>Username</TableHead>
                                ) : null}
                                {visibleColumns.roles ? (
                                    <TableHead>Roles</TableHead>
                                ) : null}
                                {visibleColumns.status ? (
                                    <TableHead>Status</TableHead>
                                ) : null}
                                {visibleColumns.updated_at ? (
                                    <TableHead>Updated</TableHead>
                                ) : null}
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    data-state={
                                        selectedRows.has(user.id)
                                            ? "selected"
                                            : undefined
                                    }
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.has(user.id)}
                                            aria-label={`Select ${user.name}`}
                                            onCheckedChange={(checked) =>
                                                onToggleRowSelection(
                                                    user.id,
                                                    checked === true,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-xs font-semibold">
                                                {UserPresenter.getInitials(
                                                    user.name,
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium">
                                                    {user.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    {visibleColumns.username ? (
                                        <TableCell>
                                            <div className="font-medium">
                                                {user.username}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {user.employee_code ??
                                                    "No employee code"}
                                            </div>
                                        </TableCell>
                                    ) : null}
                                    {visibleColumns.roles ? (
                                        <TableCell>
                                            <div className="flex max-w-64 flex-wrap gap-1">
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <Badge
                                                            key={role.id}
                                                            variant="secondary"
                                                            className="rounded-sm"
                                                        >
                                                            {role.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        No roles
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    ) : null}
                                    {visibleColumns.status ? (
                                        <TableCell>
                                            <div className="flex flex-col items-start gap-1">
                                                <StatusBadge
                                                    status={
                                                        user.deleted_at
                                                            ? "deleted"
                                                            : user.status
                                                    }
                                                />
                                                {user.locked_at ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        Locked{" "}
                                                        {UserPresenter.formatDate(
                                                            user.locked_at,
                                                        )}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    ) : null}
                                    {visibleColumns.updated_at ? (
                                        <TableCell className="text-muted-foreground">
                                            {UserPresenter.formatDate(
                                                user.updated_at,
                                            )}
                                        </TableCell>
                                    ) : null}
                                    <TableCell className="text-right">
                                        <UserActions
                                            user={user}
                                            onEdit={() => onEdit(user)}
                                            onResetPassword={() =>
                                                onResetPassword(user)
                                            }
                                            onConfirm={onConfirm}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataTableSurface>

            <DataTablePagination
                meta={meta}
                totalRows={users.length}
                selectedCount={selectedCount}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageChange={(page) =>
                    onFiltersChange((current) => ({ ...current, page }))
                }
                onPageSizeChange={(perPage) =>
                    onFiltersChange((current) => ({
                        ...current,
                        page: 1,
                        perPage,
                    }))
                }
            />
        </div>
    );
}

function DataTableToolbar({
    roles,
    draftFilters,
    visibleColumns,
    isFiltered,
    isFetching,
    onDraftFiltersChange,
    onApplyFilters,
    onResetFilters,
    onVisibleColumnsChange,
    onRefresh,
}: {
    roles: MultiSelectOption[];
    draftFilters: UserFilters;
    visibleColumns: Record<UserColumnKey, boolean>;
    isFiltered: boolean;
    isFetching: boolean;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<UserFilters>>;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    onVisibleColumnsChange: React.Dispatch<
        React.SetStateAction<Record<UserColumnKey, boolean>>
    >;
    onRefresh: () => void | Promise<unknown>;
}) {
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    async function handleRefresh() {
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    }

    return (
        <form
            className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
            onSubmit={(event) => {
                event.preventDefault();
                onApplyFilters();
            }}
        >
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:w-72">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={draftFilters.search}
                        onChange={(event) =>
                            onDraftFiltersChange((current) => ({
                                ...current,
                                search: event.target.value,
                            }))
                        }
                        className="pl-8"
                        placeholder="Filter users..."
                    />
                </div>
                <Button type="submit">
                    Apply
                </Button>
                <DataTableFacetedFilter
                    title="Status"
                    options={statusOptions}
                    values={draftFilters.statuses}
                    onValuesChange={(statuses) =>
                        onDraftFiltersChange((current) => ({
                            ...current,
                            statuses: statuses as Array<User["status"]>,
                        }))
                    }
                />
                <DataTableFacetedFilter
                    title="Role"
                    options={roles}
                    values={draftFilters.roles}
                    onValuesChange={(nextRoles) =>
                        onDraftFiltersChange((current) => ({
                            ...current,
                            roles: nextRoles,
                        }))
                    }
                />
                {isFiltered ? (
                    <Button
                        type="button"
                        variant="ghost"
                        className="px-3"
                        onClick={onResetFilters}
                    >
                        Reset
                        <XIcon className="size-4" />
                    </Button>
                ) : null}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isFetching || isRefreshing}
                >
                    <RefreshCwIcon
                        className={`size-4 ${
                            isFetching || isRefreshing ? "animate-spin" : ""
                        }`}
                    />
                    {isFetching || isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
            </div>
        </form>
    );
}

function DataTableFacetedFilter({
    title,
    options,
    values,
    onValuesChange,
}: {
    title: string;
    options: MultiSelectOption[];
    values: string[];
    onValuesChange: (values: string[]) => void;
}) {
    return (
        <MultiSelect
            options={options}
            values={values}
            searchPlaceholder={title}
            clearLabel="Clear filters"
            onValuesChange={onValuesChange}
        >
            {({ selectedValues, selectedOptions }) => (
                <Button
                    type="button"
                    variant="outline"
                    className="border-dashed"
                >
                    <ListFilterIcon className="size-4" />
                    {title}
                    {selectedValues.size > 0 ? (
                        <>
                            <Separator
                                orientation="vertical"
                                className="mx-1 h-4"
                            />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden gap-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    selectedOptions.map((option) => (
                                        <Badge
                                            key={option.value}
                                            variant="secondary"
                                            className="rounded-sm px-1 font-normal"
                                        >
                                            {option.label}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </>
                    ) : null}
                </Button>
            )}
        </MultiSelect>
    );
}

function UsersTableSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_120px_120px_32px]"
                >
                    {Array.from({ length: 6 }).map((__, column) => (
                        <Skeleton key={column} className="h-10" />
                    ))}
                </div>
            ))}
        </div>
    );
}
