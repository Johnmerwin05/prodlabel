import * as React from "react";
import { CheckCircle2Icon, Trash2Icon, UserRoundIcon } from "lucide-react";
import { z } from "zod";

export type CustomerStatus = "active" | "inactive";

export type Customer = {
    id: number;
    name: string;
    code: string;
    customer_code?: string;
    address: string | null;
    contact_person: string | null;
    contact_number: string | null;
    email: string | null;
    status: CustomerStatus;
    remarks: string | null;
    products_count?: number;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type PaginatedCustomers = {
    data: Customer[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type CustomerFilters = {
    search: string;
    statuses: CustomerStatus[];
    withTrashed: boolean;
    page: number;
    perPage: number;
};

export type CustomerColumnKey =
    | "address"
    | "status"
    | "updated_at";

export type ConfirmCustomerAction = {
    kind: "delete" | "restore";
    customer: Customer;
    title: string;
    description: string;
    confirmLabel: string;
    successMessage: string;
    destructive?: boolean;
};

export type CustomerResourceResponse = {
    data: Customer;
};

export const customerSchema = z.object({
    name: z.string().min(2, "Customer name is required").max(255),
    customer_code: z.string().min(2, "Customer code is required").max(60),
    address: z.string().optional(),
    contact_person: z.string().max(255).optional(),
    contact_number: z.string().max(60).optional(),
    email: z
        .string()
        .optional()
        .refine((value) => !value || z.string().email().safeParse(value).success, {
            message: "Enter a valid email",
        }),
    status: z.enum(["active", "inactive"]),
    remarks: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const defaultCustomerFilters: CustomerFilters = {
    search: "",
    statuses: [],
    withTrashed: false,
    page: 1,
    perPage: 25,
};

export const customerColumnLabels: Record<CustomerColumnKey, string> = {
    address: "Address",
    status: "Status",
    updated_at: "Updated",
};

export const customerStatusOptions: Array<{
    label: string;
    value: CustomerStatus;
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
];

export class CustomerPresenter {
    static buildIndexParams(filters: CustomerFilters) {
        return {
            page: filters.page,
            per_page: filters.perPage,
            search: filters.search || undefined,
            status:
                filters.statuses.length > 0 ? filters.statuses : undefined,
            with_trashed: filters.withTrashed ? 1 : undefined,
        };
    }

    static toPayload(values: CustomerFormValues) {
        const blankToNull = (value?: string) => {
            const trimmed = value?.trim();
            return trimmed ? trimmed : null;
        };

        return {
            name: values.name,
            code: values.customer_code,
            customer_code: values.customer_code,
            address: blankToNull(values.address),
            contact_person: blankToNull(values.contact_person),
            contact_number: blankToNull(values.contact_number),
            email: blankToNull(values.email),
            status: values.status,
            remarks: blankToNull(values.remarks),
            template_ids: [],
        };
    }

    static getDefaults(customer: Customer | null): CustomerFormValues {
        return {
            name: customer?.name ?? "",
            customer_code: customer?.customer_code ?? customer?.code ?? "",
            address: customer?.address ?? "",
            contact_person: customer?.contact_person ?? "",
            contact_number: customer?.contact_number ?? "",
            email: customer?.email ?? "",
            status: customer?.status ?? "active",
            remarks: customer?.remarks ?? "",
        };
    }

    static getStats(customers: Customer[]) {
        return {
            active: customers.filter(
                (customer) =>
                    customer.status === "active" && !customer.deleted_at,
            ).length,
            inactive: customers.filter(
                (customer) =>
                    customer.status === "inactive" && !customer.deleted_at,
            ).length,
            deleted: customers.filter((customer) =>
                Boolean(customer.deleted_at),
            ).length,
            products: customers.reduce(
                (total, customer) => total + (customer.products_count ?? 0),
                0,
            ),
        };
    }

    static buildConfirm(
        kind: ConfirmCustomerAction["kind"],
        customer: Customer,
    ): ConfirmCustomerAction {
        const map = {
            delete: {
                title: "Delete customer?",
                description: `${customer.name} will be archived and can be restored later.`,
                confirmLabel: "Delete",
                successMessage: "Customer deleted",
                destructive: true,
            },
            restore: {
                title: "Restore customer?",
                description: `${customer.name} will be restored to the customer list.`,
                confirmLabel: "Restore",
                successMessage: "Customer restored",
            },
        } satisfies Record<
            ConfirmCustomerAction["kind"],
            Omit<ConfirmCustomerAction, "kind" | "customer">
        >;

        return { kind, customer, ...map[kind] };
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
