import * as React from "react";
import {
    ArchiveIcon,
    BoxesIcon,
    CheckCircle2Icon,
    FileTextIcon,
    PackageIcon,
} from "lucide-react";
import { z } from "zod";

import type { Customer } from "@/features/customers/partials/customer.model";

export type UnitOfMeasure =
    | "Piece"
    | "Box"
    | "Pack"
    | "Set"
    | "Kg"
    | "Gram"
    | "Liter"
    | "Milliliter"
    | "Meter";

export const areaOptions = [
    "Assembly",
    "Molding",
    "Inspection",
    "Injection",
] as const;
export type Area = (typeof areaOptions)[number];

export type Product = {
    id: number;
    product_id: string;
    part_number: string | null;
    pi_number: string | null;
    customer: Customer | null;
    area: Area;
    sku: string;
    name: string;
    description: string | null;
    unit_of_measure: UnitOfMeasure | null;
    products_per_box: number | null;
    packing_quantity: number;
    batch_number: string | null;
    lot_number: string | null;
    manufacturing_date: string | null;
    expiration_date: string | null;
    created_at?: string;
    updated_at?: string;
};

export type PaginatedProducts = {
    data: Product[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type ProductFilters = {
    search: string;
    customerId: string;
    page: number;
    perPage: number;
};

export type ProductColumnKey =
    | "customer"
    | "part_number"
    | "pi_number"
    | "unit_of_measure";

export type ProductResourceResponse = {
    data: Product;
};

export const productSchema = z.object({
    part_number: z.string().min(1, "Part number is required").max(120),
    pi_number: z.string().min(1, "PI number is required").max(120),
    customer_id: z.coerce.number().min(1, "Customer is required"),
    area: z.enum(areaOptions),
    name: z.string().min(2, "Product name is required").max(255),
    description: z.string().optional(),
    unit_of_measure: z.enum([
        "Piece",
        "Box",
        "Pack",
        "Set",
        "Kg",
        "Gram",
        "Liter",
        "Milliliter",
        "Meter",
    ]),
    packing_quantity: z.coerce.number().int().min(1, "Packing quantity is required"),
    batch_number: z.string().max(120).optional(),
    lot_number: z.string().max(120).optional(),
    manufacturing_date: z.string().optional(),
    expiration_date: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const defaultProductFilters: ProductFilters = {
    search: "",
    customerId: "all",
    page: 1,
    perPage: 10,
};

export const unitOfMeasureOptions: Array<{
    label: string;
    value: UnitOfMeasure;
    icon: React.ReactNode;
    description?: string;
}> = [
    {
        label: "Piece",
        value: "Piece",
        icon: <PackageIcon className="size-4 text-muted-foreground" />,
        description: "Individual item",
    },
    {
        label: "Box",
        value: "Box",
        icon: <BoxesIcon className="size-4 text-primary" />,
        description: "Boxed unit",
    },
    {
        label: "Pack",
        value: "Pack",
        icon: <ArchiveIcon className="size-4 text-muted-foreground" />,
    },
    {
        label: "Set",
        value: "Set",
        icon: <CheckCircle2Icon className="size-4 text-emerald-600" />,
    },
    { label: "Kg", value: "Kg", icon: <PackageIcon className="size-4 text-muted-foreground" /> },
    { label: "Gram", value: "Gram", icon: <PackageIcon className="size-4 text-muted-foreground" /> },
    { label: "Liter", value: "Liter", icon: <PackageIcon className="size-4 text-muted-foreground" /> },
    { label: "Milliliter", value: "Milliliter", icon: <PackageIcon className="size-4 text-muted-foreground" /> },
    { label: "Meter", value: "Meter", icon: <PackageIcon className="size-4 text-muted-foreground" /> },
];

export class ProductPresenter {
    static buildIndexParams(filters: ProductFilters) {
        return {
            page: filters.page,
            per_page: filters.perPage,
            search: filters.search || undefined,
            customer_id:
                filters.customerId !== "all" ? filters.customerId : undefined,
        };
    }

    static toPayload(values: ProductFormValues) {
        const blankToNull = (value?: string) => {
            const trimmed = value?.trim();
            return trimmed ? trimmed : null;
        };

        return {
            customer_id: values.customer_id,
            area: values.area,
            part_number: values.part_number.trim(),
            pi_number: values.pi_number.trim(),
            unit_of_measure: values.unit_of_measure.trim(),
            name: values.name.trim(),
            description: blankToNull(values.description),
            batch_number: blankToNull(values.batch_number),
            lot_number: blankToNull(values.lot_number),
            manufacturing_date: blankToNull(values.manufacturing_date),
            expiration_date: blankToNull(values.expiration_date),
            packing_quantity: values.packing_quantity,
        };
    }

    static getDefaults(): ProductFormValues {
        return {
            part_number: "",
            pi_number: "",
            customer_id: 0,
            area: "Assembly",
            name: "",
            description: "",
            unit_of_measure: "Piece",
            packing_quantity: 1,
            batch_number: "",
            lot_number: "",
            manufacturing_date: "",
            expiration_date: "",
        };
    }

    static fromProduct(product: Product): ProductFormValues {
        return {
            part_number: product.part_number ?? "",
            pi_number: product.pi_number ?? "",
            customer_id: product.customer?.id ?? 0,
            area: product.area ?? "Assembly",
            name: product.name,
            description: product.description ?? "",
            unit_of_measure: product.unit_of_measure ?? "Piece",
            packing_quantity: product.packing_quantity ?? 1,
            batch_number: product.batch_number ?? "",
            lot_number: product.lot_number ?? "",
            manufacturing_date: product.manufacturing_date ?? "",
            expiration_date: product.expiration_date ?? "",
        };
    }

    static getStats(products: Product[]) {
        const customerIds = new Set(
            products
                .map((product) => product.customer?.id)
                .filter((id): id is number => Boolean(id)),
        );

        return {
            total: products.length,
            customers: customerIds.size,
            boxed: products.filter((product) => product.unit_of_measure === "Box")
                .length,
        };
    }

    static formatDate(value?: string | null) {
        if (!value) return "Never";

        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(new Date(value));
    }

    static isPrintable(_product: Product) {
        return true;
    }
}

export const productMetricCards = [
    { key: "total", label: "Total Products", icon: FileTextIcon },
    { key: "customers", label: "Customers", icon: CheckCircle2Icon },
    { key: "boxed", label: "Box UOM", icon: BoxesIcon },
] as const;
