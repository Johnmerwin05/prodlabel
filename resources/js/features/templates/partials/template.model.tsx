import * as React from "react";
import {
    CheckCircle2Icon,
    FileTextIcon,
    PencilIcon,
    Trash2Icon,
} from "lucide-react";

import type { Customer } from "@/features/customers/partials/customer.model";
import type { Area } from "@/features/products/partials/product.model";

export type CustomerTemplateAssignment = {
    customer_id: number;
    area: Area;
};

export type TemplateStatus = "draft" | "published" | "archived";
export type PaperSize = "A3" | "A4" | "A5" | "Letter" | "Legal" | "Custom";
export type Orientation = "portrait" | "landscape";
export type PrintMode = "per_print" | "per_packing_quantity";
export type TemplateElementType =
    | "text"
    | "barcode"
    | "qr"
    | "line"
    | "rectangle"
    | "circle"
    | "image"
    | "table"
    | "variable"
    | "container";

export type ElementVisibilityCondition = {
    variable: string;
    operator: "equals" | "not_equals" | "is_empty" | "is_not_empty";
    value?: string;
};

export type CanvasSettings = {
    paperSize: PaperSize;
    orientation: Orientation;
    widthMm: number;
    heightMm: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    padding: number;
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
    showRulers: boolean;
    zoom: number;
    repeatGrid: {
        enabled: boolean;
        columns: number;
        rows: number;
        gap: number;
    };
    printMode: PrintMode;
    copiesPerPrint: number;
};

export type TemplateElementPayload = {
    id: string;
    type: TemplateElementType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    value?: string;
    valueSource?: string;
    showLabel?: boolean;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: "400" | "500" | "600" | "700";
    textAlign?: "left" | "center" | "right";
    color?: string;
    fillColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: "solid" | "dashed" | "dotted" | "double";
    radius?: number;
    opacity?: number;
    lineDirection?: "horizontal" | "vertical";
    columns?: string[];
    rows?: number;
    src?: string;
    serialNumberFormat?: string;
    serialNumberStart?: number;
    serialNumberResetsYearly?: boolean;
    visibilityCondition?: ElementVisibilityCondition;
};

export type TemplateElement = {
    id?: number;
    type: TemplateElementType;
    name: string | null;
    payload: TemplateElementPayload;
    z_index: number;
};

export type Template = {
    id: number;
    name: string;
    status: TemplateStatus;
    paper_size: PaperSize;
    orientation: Orientation;
    width_mm: number | null;
    height_mm: number | null;
    settings: CanvasSettings;
    current_version: number;
    customers: Array<Pick<Customer, "id" | "name" | "code">>;
    customer_assignments?: CustomerTemplateAssignment[];
    customers_count?: number;
    elements: TemplateElement[];
    created_by: {
        id: number;
        name: string;
        username: string;
    } | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
};

export type PaginatedTemplates = {
    data: Template[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type TemplateFilters = {
    search: string;
    statuses: TemplateStatus[];
    customerId: string;
    withTrashed: boolean;
    page: number;
    perPage: number;
};

export type ConfirmTemplateAction = {
    kind: "delete" | "restore";
    template: Template;
    title: string;
    description: string;
    confirmLabel: string;
    successMessage: string;
    destructive?: boolean;
};

export type TemplateResourceResponse = {
    data: Template;
};

export type TemplatePayload = {
    name: string;
    status: TemplateStatus;
    paper_size: PaperSize;
    orientation: Orientation;
    width_mm: number | null;
    height_mm: number | null;
    settings: CanvasSettings;
    customer_assignments: CustomerTemplateAssignment[];
    elements: Array<{
        type: TemplateElementType;
        name: string | null;
        payload: TemplateElementPayload;
        z_index: number;
    }>;
};

export const paperDimensions: Record<Exclude<PaperSize, "Custom">, { width: number; height: number }> = {
    A3: { width: 297, height: 420 },
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 },
};

export const defaultTemplateFilters: TemplateFilters = {
    search: "",
    statuses: [],
    customerId: "all",
    withTrashed: false,
    page: 1,
    perPage: 10,
};

export const defaultCanvasSettings: CanvasSettings = {
    paperSize: "A4",
    orientation: "portrait",
    widthMm: 210,
    heightMm: 297,
    margin: {
        top: 8,
        right: 8,
        bottom: 8,
        left: 8,
    },
    padding: 4,
    gridSize: 8,
    snapToGrid: true,
    showGrid: true,
    showRulers: true,
    zoom: 1,
    repeatGrid: {
        enabled: false,
        columns: 1,
        rows: 1,
        gap: 0,
    },
    printMode: "per_print",
    copiesPerPrint: 1,
};

export const templateStatusOptions: Array<{
    label: string;
    value: TemplateStatus;
    icon: React.ReactNode;
}> = [
    {
        label: "Draft",
        value: "draft",
        icon: <PencilIcon className="size-4 text-muted-foreground" />,
    },
    {
        label: "Published",
        value: "published",
        icon: <CheckCircle2Icon className="size-4 text-emerald-600" />,
    },
    {
        label: "Archived",
        value: "archived",
        icon: <Trash2Icon className="size-4 text-destructive" />,
    },
];

export const placeholderOptions = [
    "{{customer_name}}",
    "{{customer_code}}",
    "{{date}}",
    "{{reference_number}}",
    "{{part_number}}",
    "{{pi_number}}",
    "{{product_name}}",
    "{{unit_of_measure}}",
    "{{products_per_box}}",
    "{{packing_quantity}}",
    "{{label_quantity}}",
    "{{production_date}}",
    "{{serial_number}}",
    "{{operator_name}}",
];

export class TemplatePresenter {
    static buildIndexParams(filters: TemplateFilters) {
        return {
            page: filters.page,
            per_page: filters.perPage,
            search: filters.search || undefined,
            status: filters.statuses.length > 0 ? filters.statuses : undefined,
            customer_id:
                filters.customerId !== "all" ? filters.customerId : undefined,
            with_trashed: filters.withTrashed ? 1 : undefined,
        };
    }

    static getCanvasSize(settings: CanvasSettings) {
        const source =
            settings.paperSize === "Custom"
                ? { width: settings.widthMm, height: settings.heightMm }
                : paperDimensions[settings.paperSize];

        if (settings.orientation === "landscape") {
            return {
                width: Math.max(source.width, source.height),
                height: Math.min(source.width, source.height),
            };
        }

        return {
            width: Math.min(source.width, source.height),
            height: Math.max(source.width, source.height),
        };
    }

    static normalizeSettings(settings?: Partial<CanvasSettings> | null) {
        const merged = {
            ...defaultCanvasSettings,
            ...(settings ?? {}),
            margin: {
                ...defaultCanvasSettings.margin,
                ...(settings?.margin ?? {}),
            },
            repeatGrid: {
                ...defaultCanvasSettings.repeatGrid,
                ...(settings?.repeatGrid ?? {}),
            },
        };

        return {
            ...merged,
            widthMm: Number(merged.widthMm) || defaultCanvasSettings.widthMm,
            heightMm: Number(merged.heightMm) || defaultCanvasSettings.heightMm,
            gridSize: Number(merged.gridSize) || defaultCanvasSettings.gridSize,
            zoom: Number(merged.zoom) || defaultCanvasSettings.zoom,
            repeatGrid: {
                enabled: Boolean(merged.repeatGrid.enabled),
                columns: clampWholeNumber(merged.repeatGrid.columns, 1, 24),
                rows: clampWholeNumber(merged.repeatGrid.rows, 1, 24),
                gap: clampNumber(merged.repeatGrid.gap, 0, 100),
            },
            printMode:
                merged.printMode === "per_packing_quantity"
                    ? "per_packing_quantity"
                    : "per_print",
            copiesPerPrint: clampWholeNumber(merged.copiesPerPrint, 1, 1000),
        } satisfies CanvasSettings;
    }

    static toPayload(
        templateName: string,
        status: TemplateStatus,
        customerAssignments: CustomerTemplateAssignment[],
        settings: CanvasSettings,
        elements: TemplateElement[],
    ): TemplatePayload {
        return {
            name: templateName.trim(),
            status,
            paper_size: settings.paperSize,
            orientation: settings.orientation,
            width_mm: settings.paperSize === "Custom" ? settings.widthMm : null,
            height_mm:
                settings.paperSize === "Custom" ? settings.heightMm : null,
            settings,
            customer_assignments: customerAssignments,
            elements: elements.map((element, index) => ({
                type: element.type,
                name: element.name,
                payload: element.payload,
                z_index: index,
            })),
        };
    }

    static buildConfirm(
        kind: ConfirmTemplateAction["kind"],
        template: Template,
    ): ConfirmTemplateAction {
        const map = {
            delete: {
                title: "Delete template?",
                description: `${template.name} will be archived and can be restored later.`,
                confirmLabel: "Delete",
                successMessage: "Template deleted",
                destructive: true,
            },
            restore: {
                title: "Restore template?",
                description: `${template.name} will be restored as a draft template.`,
                confirmLabel: "Restore",
                successMessage: "Template restored",
            },
        } satisfies Record<
            ConfirmTemplateAction["kind"],
            Omit<ConfirmTemplateAction, "kind" | "template">
        >;

        return { kind, template, ...map[kind] };
    }

    static formatDate(value?: string | null) {
        if (!value) return "Never";

        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(new Date(value));
    }

    static paperLabel(template: Template) {
        const width = template.width_mm ?? template.settings?.widthMm;
        const height = template.height_mm ?? template.settings?.heightMm;

        if (template.paper_size === "Custom" && width && height) {
            return `Custom ${width} x ${height} mm`;
        }

        return `${template.paper_size} ${template.orientation}`;
    }

    static getStats(templates: Template[]) {
        return {
            draft: templates.filter(
                (template) => template.status === "draft" && !template.deleted_at,
            ).length,
            published: templates.filter(
                (template) =>
                    template.status === "published" && !template.deleted_at,
            ).length,
            archived: templates.filter(
                (template) =>
                    template.status === "archived" || Boolean(template.deleted_at),
            ).length,
            assigned: templates.reduce(
                (total, template) =>
                    total +
                    (template.customers_count ?? template.customers?.length ?? 0),
                0,
            ),
        };
    }
}

export const templateMetricCards = [
    {
        key: "published",
        label: "Published",
        icon: CheckCircle2Icon,
    },
    {
        key: "draft",
        label: "Drafts",
        icon: FileTextIcon,
    },
    {
        key: "assigned",
        label: "Assignments",
        icon: CheckCircle2Icon,
    },
    {
        key: "archived",
        label: "Archived",
        icon: Trash2Icon,
    },
] as const;

function clampWholeNumber(value: unknown, min: number, max: number) {
    const numeric = Math.round(Number(value));

    if (!Number.isFinite(numeric)) return min;

    return Math.min(max, Math.max(min, numeric));
}

function clampNumber(value: unknown, min: number, max: number) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) return min;

    return Math.min(max, Math.max(min, numeric));
}
