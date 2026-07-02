import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/shared/services/api";
import { useCan } from "@/features/auth/permissions";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

import {
    ConfirmTemplateActionDialog,
    TemplatePreviewDialog,
} from "./partials/TemplateDialogs";
import { TemplateStats } from "./partials/TemplateStats";
import { TemplatesDataTable } from "./partials/TemplatesDataTable";
import {
    type ConfirmTemplateAction,
    type PaginatedTemplates,
    type Template,
    type TemplateFilters,
    defaultTemplateFilters,
    TemplatePresenter,
} from "./partials/template.model";

export function TemplateListPage() {
    const canManage = useCan("template.manage");
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const [filters, setFilters] = React.useState<TemplateFilters>(
        defaultTemplateFilters,
    );
    const [draftFilters, setDraftFilters] = React.useState<TemplateFilters>(
        defaultTemplateFilters,
    );
    const [previewTemplate, setPreviewTemplate] =
        React.useState<Template | null>(null);
    const [confirmAction, setConfirmAction] =
        React.useState<ConfirmTemplateAction | null>(null);

    const templatesQuery = useQuery({
        queryKey: ["templates", filters],
        queryFn: async () => {
            const response = await api.get<PaginatedTemplates>("/templates", {
                params: TemplatePresenter.buildIndexParams(filters),
            });
            return response.data;
        },
    });

    const templates = templatesQuery.data?.data ?? [];
    const meta = templatesQuery.data?.meta;
    const stats = React.useMemo(
        () => TemplatePresenter.getStats(templates),
        [templates],
    );

    const duplicateTemplate = useMutation({
        mutationFn: async (template: Template) =>
            api.post(`/templates/${template.id}/duplicate`),
        onSuccess: () => {
            notify({ variant: "success", title: "Template duplicated" });
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
        onError: (error) => showApiError(error, notify),
    });

    const actionMutation = useMutation({
        mutationFn: async (action: ConfirmTemplateAction) => {
            if (action.kind === "delete")
                return api.delete(`/templates/${action.template.id}`);

            return api.post(`/templates/${action.template.id}/restore`);
        },
        onSuccess: (_, action) => {
            notify({ variant: "success", title: action.successMessage });
            setConfirmAction(null);
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
        onError: (error) => showApiError(error, notify),
    });

    function applyFilters() {
        setFilters({ ...draftFilters, page: 1 });
    }

    function resetFilters() {
        setDraftFilters(defaultTemplateFilters);
        setFilters(defaultTemplateFilters);
    }

    function applyColumnFilters(next: Partial<TemplateFilters>) {
        const updated = { ...draftFilters, ...next, page: 1 };
        setDraftFilters(updated);
        setFilters(updated);
    }

    async function refreshTemplates() {
        await queryClient.invalidateQueries({ queryKey: ["templates"] });
        await templatesQuery.refetch();
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Template Management"
                description="Create printable templates, assign customers, duplicate layouts, preview output, and manage publishing status."
                actions={
                    <Button disabled={!canManage} onClick={() => navigate("/templates/designer")}>
                        <PlusIcon className="size-4" />
                        Create Template
                    </Button>
                }
            />

            <TemplateStats stats={stats} />

            <TemplatesDataTable
                templates={templates}
                meta={meta}
                filters={filters}
                draftFilters={draftFilters}
                isLoading={templatesQuery.isLoading}
                isError={templatesQuery.isError}
                isFetching={templatesQuery.isFetching}
                onDraftFiltersChange={setDraftFilters}
                onApplyFilters={applyFilters}
                onCustomerFilterChange={(customerId) =>
                    applyColumnFilters({ customerId })
                }
                onStatusFilterChange={(statuses) =>
                    applyColumnFilters({ statuses })
                }
                onResetFilters={resetFilters}
                onFiltersChange={setFilters}
                onRefresh={refreshTemplates}
                onCreate={() => navigate("/templates/designer")}
                onEdit={(template) => {
                    queryClient.setQueryData(
                        ["template", String(template.id)],
                        template,
                    );
                    navigate(`/templates/designer?id=${template.id}`);
                }}
                onPreview={setPreviewTemplate}
                onDuplicate={(template) => duplicateTemplate.mutate(template)}
                onConfirm={setConfirmAction}
            />

            <TemplatePreviewDialog
                template={previewTemplate}
                open={Boolean(previewTemplate)}
                onOpenChange={(open) => {
                    if (!open) setPreviewTemplate(null);
                }}
            />

            <ConfirmTemplateActionDialog
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
