import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/shared/services/api";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

import { ConfirmCustomerActionDialog } from "./partials/CustomerDialogs";
import { CustomerFormSheet } from "./partials/CustomerForms";
import { CustomerStats } from "./partials/CustomerStats";
import { CustomersDataTable } from "./partials/CustomersDataTable";
import {
    type ConfirmCustomerAction,
    type Customer,
    type CustomerColumnKey,
    type CustomerFilters,
    type CustomerFormValues,
    type CustomerResourceResponse,
    type PaginatedCustomers,
    CustomerPresenter,
    defaultCustomerFilters,
} from "./partials/customer.model";

export function CustomerListPage() {
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const [filters, setFilters] =
        React.useState<CustomerFilters>(defaultCustomerFilters);
    const [draftFilters, setDraftFilters] =
        React.useState<CustomerFilters>(defaultCustomerFilters);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingCustomer, setEditingCustomer] =
        React.useState<Customer | null>(null);
    const [confirmAction, setConfirmAction] =
        React.useState<ConfirmCustomerAction | null>(null);
    const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
        () => new Set(),
    );
    const [visibleColumns] = React.useState<
        Record<CustomerColumnKey, boolean>
    >({
        address: true,
        status: true,
        updated_at: true,
    });

    const customersQuery = useQuery({
        queryKey: ["customers", filters],
        queryFn: async () => {
            const response = await api.get<PaginatedCustomers>("/customers", {
                params: CustomerPresenter.buildIndexParams(filters),
            });
            return response.data;
        },
    });

    const customers = customersQuery.data?.data ?? [];
    const meta = customersQuery.data?.meta;
    const allPageRowsSelected =
        customers.length > 0 &&
        customers.every((customer) => selectedRows.has(customer.id));
    const somePageRowsSelected =
        customers.some((customer) => selectedRows.has(customer.id)) &&
        !allPageRowsSelected;
    const stats = React.useMemo(
        () => CustomerPresenter.getStats(customers),
        [customers],
    );

    React.useEffect(() => {
        setSelectedRows(new Set());
    }, [filters]);

    const createCustomer = useMutation({
        mutationFn: async (values: CustomerFormValues) => {
            const response = await api.post<CustomerResourceResponse>(
                "/customers",
                CustomerPresenter.toPayload(values),
            );
            return response.data.data;
        },
        onSuccess: () => {
            notify({ variant: "success", title: "Customer created" });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setIsCreateOpen(false);
        },
        onError: (error) => showApiError(error, notify),
    });

    const updateCustomer = useMutation({
        mutationFn: async (values: CustomerFormValues) => {
            if (!editingCustomer) throw new Error("No customer selected");
            const response = await api.put<CustomerResourceResponse>(
                `/customers/${editingCustomer.id}`,
                CustomerPresenter.toPayload(values),
            );
            return response.data.data;
        },
        onSuccess: () => {
            notify({ variant: "success", title: "Customer updated" });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setEditingCustomer(null);
        },
        onError: (error) => showApiError(error, notify),
    });

    const actionMutation = useMutation({
        mutationFn: async (action: ConfirmCustomerAction) => {
            if (action.kind === "delete")
                return api.delete(`/customers/${action.customer.id}`);

            return api.post(`/customers/${action.customer.id}/restore`);
        },
        onSuccess: (_, action) => {
            notify({ variant: "success", title: action.successMessage });
            setConfirmAction(null);
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
        onError: (error) => showApiError(error, notify),
    });

    function applyFilters() {
        setFilters({ ...draftFilters, page: 1 });
    }

    function resetFilters() {
        setDraftFilters(defaultCustomerFilters);
        setFilters(defaultCustomerFilters);
    }

    function toggleRowSelection(customerId: number, selected: boolean) {
        setSelectedRows((current) => {
            const next = new Set(current);
            if (selected) next.add(customerId);
            else next.delete(customerId);
            return next;
        });
    }

    function togglePageSelection(selected: boolean) {
        setSelectedRows((current) => {
            const next = new Set(current);
            customers.forEach((customer) => {
                if (selected) next.add(customer.id);
                else next.delete(customer.id);
            });
            return next;
        });
    }

    async function refreshCustomers() {
        await queryClient.invalidateQueries({ queryKey: ["customers"] });
        await customersQuery.refetch();
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Customer Management"
                description="Maintain customer names, customer codes, contact details, status, and production relationships."
                actions={
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusIcon className="size-4" />
                        Create Customer
                    </Button>
                }
            />

            <CustomerStats stats={stats} />

            <CustomersDataTable
                customers={customers}
                meta={meta}
                filters={filters}
                draftFilters={draftFilters}
                visibleColumns={visibleColumns}
                selectedRows={selectedRows}
                isLoading={customersQuery.isLoading}
                isError={customersQuery.isError}
                isFetching={customersQuery.isFetching}
                allPageRowsSelected={allPageRowsSelected}
                somePageRowsSelected={somePageRowsSelected}
                selectedCount={selectedRows.size}
                onDraftFiltersChange={setDraftFilters}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
                onFiltersChange={setFilters}
                onRefresh={refreshCustomers}
                onToggleRowSelection={toggleRowSelection}
                onTogglePageSelection={togglePageSelection}
                onEdit={setEditingCustomer}
                onConfirm={setConfirmAction}
                onCreate={() => setIsCreateOpen(true)}
            />

            <CustomerFormSheet
                open={isCreateOpen || Boolean(editingCustomer)}
                customer={editingCustomer}
                isSaving={createCustomer.isPending || updateCustomer.isPending}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateOpen(false);
                        setEditingCustomer(null);
                    }
                }}
                onSubmit={(values) => {
                    if (editingCustomer) updateCustomer.mutate(values);
                    else createCustomer.mutate(values);
                }}
            />

            <ConfirmCustomerActionDialog
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
