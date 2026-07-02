import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    ArrowLeftIcon,
    BarcodeIcon,
    BringToFrontIcon,
    CircleIcon,
    EyeIcon,
    FileImageIcon,
    ImageIcon,
    MinusIcon,
    QrCodeIcon,
    SaveIcon,
    SendToBackIcon,
    SquareDashedIcon,
    SquareIcon,
    TableIcon,
    TypeIcon,
    VariableIcon,
    MoveDownIcon,
    MoveUpIcon,
    ZoomInIcon,
    ZoomOutIcon,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputNumber } from "@/components/ui/input-number";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Customer } from "@/features/customers/partials/customer.model";
import {
    areaOptions,
    type Area,
} from "@/features/products/partials/product.model";
import { api } from "@/shared/services/api";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

import { TemplatePreviewDialog } from "./partials/TemplateDialogs";
import { TemplatePreview } from "./partials/TemplatePreview";
import {
    type CanvasSettings,
    type CustomerTemplateAssignment,
    type ElementVisibilityCondition,
    type PaperSize,
    type Template,
    type TemplateElement,
    type TemplateElementPayload,
    type TemplateElementType,
    type TemplateResourceResponse,
    defaultCanvasSettings,
    paperDimensions,
    placeholderOptions,
    TemplatePresenter,
} from "./partials/template.model";

type Tool = {
    type: TemplateElementType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

type CustomerOption = Pick<Customer, "id" | "name" | "code">;
const CUSTOMER_BATCH_SIZE = 50;

const tools: Tool[] = [
    { type: "text", label: "Text", icon: TypeIcon },
    { type: "variable", label: "Variable", icon: VariableIcon },
    { type: "barcode", label: "Barcode", icon: BarcodeIcon },
    { type: "qr", label: "QR Code", icon: QrCodeIcon },
    { type: "line", label: "Line", icon: MinusIcon },
    { type: "rectangle", label: "Rectangle", icon: SquareIcon },
    { type: "circle", label: "Circle", icon: CircleIcon },
    { type: "image", label: "Image / Logo", icon: ImageIcon },
    { type: "table", label: "Table", icon: TableIcon },
    { type: "container", label: "Container", icon: SquareDashedIcon },
];

export function TemplateDesignerPage() {
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get("id");
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const [templateName, setTemplateName] = React.useState("");
    const [customerAssignments, setCustomerAssignments] = React.useState<
        CustomerTemplateAssignment[]
    >([]);
    const [settings, setSettings] = React.useState<CanvasSettings>(
        defaultCanvasSettings,
    );
    const [elements, setElements] = React.useState<TemplateElement[]>([]);
    const [selectedElementId, setSelectedElementId] = React.useState<
        string | null
    >(null);
    const [selectedElementIds, setSelectedElementIds] = React.useState<
        Set<string>
    >(() => new Set());
    const selectedElementIdRef = React.useRef<string | null>(null);
    const selectedElementIdsRef = React.useRef<Set<string>>(new Set());
    const [draggedElementId, setDraggedElementId] = React.useState<
        string | null
    >(null);
    const [previewTemplate, setPreviewTemplate] =
        React.useState<Template | null>(null);
    const isHydratingTemplateRef = React.useRef(false);

    const templateQuery = useQuery({
        queryKey: ["template", templateId],
        enabled: Boolean(templateId),
        queryFn: async () => {
            const response = await api.get<TemplateResourceResponse>(
                `/templates/${templateId}`,
            );
            return response.data.data;
        },
    });

    const customersQuery = useQuery({
        queryKey: ["template-designer-customers", "v4"],
        queryFn: async () => {
            const response = await api.get<unknown>("/customers/options");
            return normalizeCustomerOptions(response.data);
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnMount: false,
    });

    React.useEffect(() => {
        const template = templateQuery.data;
        if (!template) return;

        setTemplateName(template.name);
        setCustomerAssignments(
            template.customer_assignments?.map((assignment) => ({
                ...assignment,
                area: assignment.area ?? "Assembly",
            })) ??
                template.customers?.map((customer) => ({
                    customer_id: customer.id,
                    area: "Assembly" as Area,
                })) ??
                [],
        );
        isHydratingTemplateRef.current = true;
        setSettings(buildSettingsFromTemplate(template));
        setElements(
            (template.elements ?? []).map((element, index) => ({
                ...element,
                z_index: element.z_index ?? index,
                payload: normalizeElementPayload(element.payload, element.type),
            })),
        );
    }, [templateQuery.data]);

    const saveTemplate = useMutation({
        mutationFn: async (status: "draft" | "published") => {
            const payload = TemplatePresenter.toPayload(
                templateName,
                status,
                customerAssignments,
                settings,
                elements,
            );

            if (templateId) {
                const response = await api.put<TemplateResourceResponse>(
                    `/templates/${templateId}`,
                    payload,
                );
                return response.data.data;
            }

            const response = await api.post<TemplateResourceResponse>(
                "/templates",
                payload,
            );
            return response.data.data;
        },
        onSuccess: (template, status) => {
            notify({
                variant: "success",
                title:
                    status === "published"
                        ? "Template published"
                        : "Template saved",
            });
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            queryClient.invalidateQueries({ queryKey: ["template"] });
            navigate(`/templates/designer?id=${template.id}`, {
                replace: true,
            });
        },
        onError: (error) => showApiError(error, notify),
    });

    const selectedElement = elements.find(
        (element) => element.payload.id === selectedElementId,
    );
    const selectedIds = React.useMemo(() => {
        if (selectedElementIds.size > 0) return selectedElementIds;
        if (selectedElementId) return new Set([selectedElementId]);

        return new Set<string>();
    }, [selectedElementId, selectedElementIds]);
    const hasSelection = selectedIds.size > 0;

    React.useEffect(() => {
        selectedElementIdRef.current = selectedElementId;
        selectedElementIdsRef.current = selectedElementIds;
    }, [selectedElementId, selectedElementIds]);

    React.useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (selectedIds.size === 0 || isEditableTarget(event.target))
                return;

            if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                removeElements(selectedIds);
                return;
            }

            const movement: Record<string, { x: number; y: number }> = {
                ArrowUp: { x: 0, y: -1 },
                ArrowDown: { x: 0, y: 1 },
                ArrowLeft: { x: -1, y: 0 },
                ArrowRight: { x: 1, y: 0 },
            };
            const direction = movement[event.key];
            if (!direction) return;

            event.preventDefault();
            const step = event.shiftKey ? settings.gridSize : 1;

            setElements((current) =>
                current.map((element) =>
                    selectedIds.has(element.payload.id)
                        ? withPayload(
                              element,
                              {
                                  x: element.payload.x + direction.x * step,
                                  y: element.payload.y + direction.y * step,
                              },
                              settings,
                          )
                        : element,
                ),
            );
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIds, settings.gridSize]);

    React.useEffect(() => {
        if (isHydratingTemplateRef.current) {
            isHydratingTemplateRef.current = false;
            return;
        }

        setElements((current) =>
            current.map((element) => ({
                ...element,
                payload: constrainElementPayload(element.payload, settings),
            })),
        );
    }, [
        settings.paperSize,
        settings.orientation,
        settings.widthMm,
        settings.heightMm,
        settings.repeatGrid.enabled,
        settings.repeatGrid.columns,
        settings.repeatGrid.rows,
        settings.repeatGrid.gap,
        settings.margin.top,
        settings.margin.right,
        settings.margin.bottom,
        settings.margin.left,
        settings.padding,
    ]);

    function updateSettings(next: Partial<CanvasSettings>) {
        setSettings((current) =>
            TemplatePresenter.normalizeSettings({ ...current, ...next }),
        );
    }

    function updateMargin(key: keyof CanvasSettings["margin"], value: number) {
        setSettings((current) => ({
            ...current,
            margin: {
                ...current.margin,
                [key]: value,
            },
        }));
    }

    function addElement(type: TemplateElementType, x = 24, y = 24) {
        const payload = constrainElementPayload(
            createElementPayload(type, x, y),
            settings,
        );
        const element: TemplateElement = {
            type,
            name: payload.label,
            payload,
            z_index: elements.length,
        };

        setElements((current) => [...current, element]);
        selectSingleElement(payload.id);
    }

    function selectSingleElement(elementId: string) {
        const next = new Set([elementId]);
        selectedElementIdRef.current = elementId;
        selectedElementIdsRef.current = next;
        setSelectedElementId(elementId);
        setSelectedElementIds(next);
    }

    function handleCanvasElementSelect(
        elementId: string,
        event:
            | React.MouseEvent<HTMLDivElement>
            | React.PointerEvent<HTMLDivElement>,
    ) {
        if (event.ctrlKey || event.metaKey) {
            setSelectedElementIds((current) => {
                const next = new Set(current);

                if (next.has(elementId)) {
                    next.delete(elementId);
                } else {
                    next.add(elementId);
                }

                if (next.size === 0) {
                    selectedElementIdRef.current = null;
                    selectedElementIdsRef.current = next;
                    setSelectedElementId(null);
                    return next;
                }

                selectedElementIdRef.current = elementId;
                selectedElementIdsRef.current = next;
                setSelectedElementId(elementId);

                return next;
            });
            return;
        }

        selectSingleElement(elementId);
    }

    function handleCanvasElementsSelect(elementIds: string[]) {
        const next = new Set(elementIds);
        const lastElementId = elementIds.at(-1) ?? null;
        selectedElementIdRef.current = lastElementId;
        selectedElementIdsRef.current = next;
        setSelectedElementIds(next);
        setSelectedElementId(lastElementId);
    }

    function updateElement(
        elementId: string,
        patch: Partial<TemplateElementPayload>,
    ) {
        setElements((current) =>
            current.map((element) =>
                element.payload.id === elementId
                    ? withPayload(element, patch, settings)
                    : element,
            ),
        );
    }

    function moveCanvasElement(
        elementId: string,
        position: { x: number; y: number },
    ) {
        const nextPosition = toEditableCellPosition(
            snap(position.x, settings),
            snap(position.y, settings),
            settings,
        );
        const movingIds =
            selectedIds.has(elementId) && selectedIds.size > 1
                ? selectedIds
                : new Set([elementId]);

        setElements((current) => {
            const movingElement = current.find(
                (element) => element.payload.id === elementId,
            );
            if (!movingElement) return current;

            const deltaX = nextPosition.x - movingElement.payload.x;
            const deltaY = nextPosition.y - movingElement.payload.y;

            return current.map((element) =>
                movingIds.has(element.payload.id)
                    ? withPayload(
                          element,
                          {
                              x: element.payload.x + deltaX,
                              y: element.payload.y + deltaY,
                          },
                          settings,
                      )
                    : element,
            );
        });
    }

    function removeElement(elementId: string) {
        removeElements(new Set([elementId]));
    }

    function removeElements(elementIds: Set<string>) {
        setElements((current) =>
            current.filter((element) => !elementIds.has(element.payload.id)),
        );
        setSelectedElementIds((current) => {
            const next = new Set(current);
            elementIds.forEach((id) => next.delete(id));
            return next;
        });
        setSelectedElementId((current) =>
            current && elementIds.has(current) ? null : current,
        );
    }

    function duplicateElement(elementId: string) {
        const source = elements.find(
            (element) => element.payload.id === elementId,
        );
        if (!source) return;

        const duplicate: TemplateElement = {
            ...source,
            id: undefined,
            name: `${source.name ?? source.type} Copy`,
            z_index: elements.length,
            payload: {
                ...source.payload,
                id: crypto.randomUUID(),
                label: `${source.payload.label} Copy`,
                x: source.payload.x + 8,
                y: source.payload.y + 8,
            },
        };
        duplicate.payload = constrainElementPayload(
            duplicate.payload,
            settings,
        );

        setElements((current) => [...current, duplicate]);
        selectSingleElement(duplicate.payload.id);
    }

    function arrangeSelectedElement(
        direction: "forward" | "backward" | "front" | "back",
    ) {
        const activeSelectedIds =
            selectedElementIdsRef.current.size > 0
                ? selectedElementIdsRef.current
                : selectedElementIdRef.current
                  ? new Set([selectedElementIdRef.current])
                  : new Set<string>();

        if (activeSelectedIds.size === 0) return;

        setElements((current) => {
            const arranged = arrangeElementLayers(
                current,
                activeSelectedIds,
                direction,
            );

            return arranged ?? current;
        });
    }

    function handleDrop(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        const type = event.dataTransfer.getData(
            "application/x-template-tool",
        ) as TemplateElementType;
        const canvas = event.currentTarget.getBoundingClientRect();
        const rawX = snap(
            (event.clientX - canvas.left) / settings.zoom / 2.25,
            settings,
        );
        const rawY = snap(
            (event.clientY - canvas.top) / settings.zoom / 2.25,
            settings,
        );
        if (!isInsideEditableCell(rawX, rawY, settings)) {
            setDraggedElementId(null);
            return;
        }
        const { x, y } = toEditableCellPosition(rawX, rawY, settings);

        if (type) addElement(type, x, y);
    }

    function showPreview() {
        setPreviewTemplate({
            id: Number(templateId ?? 0),
            name: templateName || "Untitled Template",
            status: "draft",
            paper_size: settings.paperSize,
            orientation: settings.orientation,
            width_mm: settings.widthMm,
            height_mm: settings.heightMm,
            settings,
            current_version: templateQuery.data?.current_version ?? 1,
            customers:
                customersQuery.data?.filter((customer) =>
                    customerAssignments.some(
                        (assignment) => assignment.customer_id === customer.id,
                    ),
                ) ?? [],
            elements,
            created_by: templateQuery.data?.created_by ?? null,
            created_at:
                templateQuery.data?.created_at ?? new Date().toISOString(),
            updated_at:
                templateQuery.data?.updated_at ?? new Date().toISOString(),
        });
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title={templateId ? "Edit Template" : "Create Template"}
                description="Design customer-specific printable layouts with drag-and-drop elements, paper controls, margins, grid snapping, and live preview."
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/templates")}
                        >
                            <ArrowLeftIcon className="size-4" />
                            Back
                        </Button>
                        <Button variant="outline" onClick={showPreview}>
                            <EyeIcon className="size-4" />
                            Preview
                        </Button>
                        <Button
                            variant="outline"
                            disabled={saveTemplate.isPending}
                            onClick={() => saveTemplate.mutate("draft")}
                        >
                            <SaveIcon className="size-4" />
                            {saveTemplate.isPending &&
                            saveTemplate.variables === "draft"
                                ? "Saving..."
                                : "Save Draft"}
                        </Button>
                        <Button
                            disabled={saveTemplate.isPending}
                            onClick={() => saveTemplate.mutate("published")}
                        >
                            {saveTemplate.isPending &&
                            saveTemplate.variables === "published"
                                ? "Publishing..."
                                : "Publish"}
                        </Button>
                    </>
                }
            />

            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <Tabs defaultValue="elements">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="elements">Elements</TabsTrigger>
                            <TabsTrigger value="template">Template</TabsTrigger>
                        </TabsList>
                        <TabsContent value="elements" className="pt-4">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {tools.map((tool) => {
                                        const Icon = tool.icon;

                                        return (
                                            <Button
                                                key={tool.type}
                                                type="button"
                                                variant="outline"
                                                className="cursor-grab"
                                                draggable
                                                onDragStart={(event) => {
                                                    event.dataTransfer.setData(
                                                        "application/x-template-tool",
                                                        tool.type,
                                                    );
                                                }}
                                                onClick={() =>
                                                    addElement(tool.type)
                                                }
                                            >
                                                <Icon className="size-4" />
                                                {tool.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Dynamic Variables</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {placeholderOptions.map(
                                            (placeholder) => (
                                                <Button
                                                    key={placeholder}
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (selectedElement) {
                                                            updateElement(
                                                                selectedElement
                                                                    .payload.id,
                                                                {
                                                                    value: placeholder,
                                                                },
                                                            );
                                                        } else {
                                                            const payload =
                                                                createElementPayload(
                                                                    "variable",
                                                                    24,
                                                                    24,
                                                                );
                                                            payload.value =
                                                                placeholder;
                                                            setElements(
                                                                (current) => [
                                                                    ...current,
                                                                    {
                                                                        type: "variable",
                                                                        name: payload.label,
                                                                        payload,
                                                                        z_index:
                                                                            current.length,
                                                                    },
                                                                ],
                                                            );
                                                            selectSingleElement(
                                                                payload.id,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {placeholder}
                                                </Button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="template" className="pt-4">
                            <div className="max-h-[320px] min-w-0 space-y-5 overflow-x-hidden overflow-y-auto pr-2">
                                <TemplateSettingsPanel
                                    templateName={templateName}
                                    customerAssignments={customerAssignments}
                                    customers={
                                        Array.isArray(customersQuery.data)
                                            ? customersQuery.data
                                            : []
                                    }
                                    settings={settings}
                                    onNameChange={setTemplateName}
                                    onCustomerAssignmentsChange={
                                        setCustomerAssignments
                                    }
                                    onSettingsChange={updateSettings}
                                    onMarginChange={updateMargin}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="min-w-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Canvas</CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                                updateSettings({
                                    zoom: Math.max(settings.zoom - 0.1, 0.5),
                                })
                            }
                        >
                            <ZoomOutIcon className="size-4" />
                        </Button>
                        <span className="min-w-12 text-center text-xs text-muted-foreground">
                            {Math.round(settings.zoom * 100)}%
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                                updateSettings({
                                    zoom: Math.min(settings.zoom + 0.1, 1.8),
                                })
                            }
                        >
                            <ZoomInIcon className="size-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    <TooltipProvider>
                        <div className="absolute right-8 top-4 z-40 flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-md backdrop-blur">
                            <ArrangementButton
                                label="Send backward"
                                disabled={!hasSelection}
                                onClick={() =>
                                    arrangeSelectedElement("backward")
                                }
                            >
                                <MoveDownIcon className="size-4" />
                            </ArrangementButton>
                            <ArrangementButton
                                label="Bring forward"
                                disabled={!hasSelection}
                                onClick={() =>
                                    arrangeSelectedElement("forward")
                                }
                            >
                                <MoveUpIcon className="size-4" />
                            </ArrangementButton>
                            <Separator orientation="vertical" className="h-5" />
                            <ArrangementButton
                                label="Send to back"
                                disabled={!hasSelection}
                                onClick={() => arrangeSelectedElement("back")}
                            >
                                <SendToBackIcon className="size-4" />
                            </ArrangementButton>
                            <ArrangementButton
                                label="Bring to front"
                                disabled={!hasSelection}
                                onClick={() => arrangeSelectedElement("front")}
                            >
                                <BringToFrontIcon className="size-4" />
                            </ArrangementButton>
                        </div>
                    </TooltipProvider>
                    <ScrollArea className="h-[calc(100vh-360px)] min-h-[540px] rounded-lg border bg-muted/30">
                        <div className="min-h-[540px] min-w-max p-8">
                            <TemplatePreview
                                settings={settings}
                                elements={elements}
                                selectedElementId={selectedElementId}
                                selectedElementIds={selectedElementIds}
                                editable
                                onSelectElement={handleCanvasElementSelect}
                                onSelectElements={handleCanvasElementsSelect}
                                onElementDragStart={setDraggedElementId}
                                onElementMove={moveCanvasElement}
                                onElementResize={(id, patch) =>
                                    updateElement(id, patch)
                                }
                                renderElementContextMenu={(element) => (
                                    <ElementPropertiesPanel
                                        element={element}
                                        onChange={(patch) =>
                                            updateElement(
                                                element.payload.id,
                                                patch,
                                            )
                                        }
                                        onDuplicate={() =>
                                            duplicateElement(element.payload.id)
                                        }
                                        onDelete={() =>
                                            removeElement(element.payload.id)
                                        }
                                    />
                                )}
                                onElementDelete={(id) => {
                                    if (selectedIds.has(id)) {
                                        removeElements(selectedIds);
                                    } else {
                                        removeElement(id);
                                    }
                                }}
                                onCanvasDrop={handleDrop}
                            />
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <TemplatePreviewDialog
                template={previewTemplate}
                open={Boolean(previewTemplate)}
                onOpenChange={(open) => {
                    if (!open) setPreviewTemplate(null);
                }}
            />
        </div>
    );
}

function TemplateSettingsPanel({
    templateName,
    customerAssignments,
    customers,
    settings,
    onNameChange,
    onCustomerAssignmentsChange,
    onSettingsChange,
    onMarginChange,
}: {
    templateName: string;
    customerAssignments: CustomerTemplateAssignment[];
    customers: CustomerOption[];
    settings: CanvasSettings;
    onNameChange: (value: string) => void;
    onCustomerAssignmentsChange: (
        assignments: CustomerTemplateAssignment[],
    ) => void;
    onSettingsChange: (settings: Partial<CanvasSettings>) => void;
    onMarginChange: (
        key: keyof CanvasSettings["margin"],
        value: number,
    ) => void;
}) {
    const [customerSearch, setCustomerSearch] = React.useState("");
    const [visibleCustomerCount, setVisibleCustomerCount] =
        React.useState(CUSTOMER_BATCH_SIZE);
    const assignmentsByCustomerId = React.useMemo(
        () =>
            new Map(
                customerAssignments.map((assignment) => [
                    assignment.customer_id,
                    assignment,
                ]),
            ),
        [customerAssignments],
    );
    const filteredCustomers = React.useMemo(() => {
        const search = customerSearch.trim().toLowerCase();
        if (!search) return customers;

        return customers.filter(
            (customer) =>
                customer.name.toLowerCase().includes(search) ||
                customer.code.toLowerCase().includes(search),
        );
    }, [customerSearch, customers]);
    const visibleCustomers = filteredCustomers.slice(0, visibleCustomerCount);
    const allFilteredSelected =
        filteredCustomers.length > 0 &&
        filteredCustomers.every((customer) =>
            assignmentsByCustomerId.has(customer.id),
        );

    React.useEffect(() => {
        setVisibleCustomerCount(CUSTOMER_BATCH_SIZE);
    }, [customerSearch]);

    function toggleCustomer(customerId: number, checked: boolean) {
        onCustomerAssignmentsChange(
            checked
                ? [
                      ...customerAssignments,
                      { customer_id: customerId, area: "Assembly" },
                  ]
                : customerAssignments.filter(
                      (assignment) => assignment.customer_id !== customerId,
                  ),
        );
    }

    function changeCustomerArea(customerId: number, area: Area) {
        onCustomerAssignmentsChange(
            customerAssignments.map((assignment) =>
                assignment.customer_id === customerId
                    ? { ...assignment, area }
                    : assignment,
            ),
        );
    }

    function selectAllCustomers() {
        const assignedIds = new Set(
            customerAssignments.map((assignment) => assignment.customer_id),
        );
        const additions = filteredCustomers
            .filter((customer) => !assignedIds.has(customer.id))
            .map((customer) => ({
                customer_id: customer.id,
                area: "Assembly" as Area,
            }));

        onCustomerAssignmentsChange([...customerAssignments, ...additions]);
    }

    function changePaperSize(paperSize: PaperSize) {
        if (paperSize === "Custom") {
            onSettingsChange({ paperSize });
            return;
        }

        const dimensions = paperDimensions[paperSize];
        onSettingsChange({
            paperSize,
            widthMm: dimensions.width,
            heightMm: dimensions.height,
        });
    }

    return (
        <>
            <Field label="Template Name">
                <Input
                    value={templateName}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="Customer shipping label"
                />
            </Field>
            <Field label="Assigned Customers">
                <div className="min-w-0 space-y-2 overflow-x-hidden">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            value={customerSearch}
                            onChange={(event) =>
                                setCustomerSearch(event.target.value)
                            }
                            placeholder="Search customer name or code..."
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                                filteredCustomers.length === 0 ||
                                allFilteredSelected
                            }
                            onClick={selectAllCustomers}
                        >
                            Select All
                        </Button>
                    </div>
                    <div className="grid max-h-44 gap-2 overflow-auto rounded-md border p-2">
                        {visibleCustomers.map((customer) => {
                            const assignment = assignmentsByCustomerId.get(
                                customer.id,
                            );

                            return (
                                <div
                                    key={customer.id}
                                    className="flex min-w-0 items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/60"
                                >
                                    <Checkbox
                                        checked={Boolean(assignment)}
                                        onCheckedChange={(checked) =>
                                            toggleCustomer(
                                                customer.id,
                                                checked === true,
                                            )
                                        }
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate">
                                            {customer.name}
                                        </span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {customer.code}
                                        </span>
                                    </span>
                                    <Select
                                        value={assignment?.area ?? "Assembly"}
                                        disabled={!assignment}
                                        onValueChange={(area) =>
                                            changeCustomerArea(
                                                customer.id,
                                                area as Area,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-32 shrink-0 sm:w-36">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {areaOptions.map((area) => (
                                                <SelectItem
                                                    key={area}
                                                    value={area}
                                                >
                                                    {area}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        })}
                        {filteredCustomers.length === 0 ? (
                            <p className="px-2 py-1 text-sm text-muted-foreground">
                                {customers.length === 0
                                    ? "No customers available."
                                    : "No customers match your search."}
                            </p>
                        ) : null}
                        {visibleCustomerCount < filteredCustomers.length ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                    setVisibleCustomerCount((count) =>
                                        Math.min(
                                            count + CUSTOMER_BATCH_SIZE,
                                            filteredCustomers.length,
                                        ),
                                    )
                                }
                            >
                                Show More (
                                {filteredCustomers.length -
                                    visibleCustomerCount}{" "}
                                remaining)
                            </Button>
                        ) : null}
                    </div>
                </div>
            </Field>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Paper Size">
                    <Select
                        value={settings.paperSize}
                        onValueChange={(value) =>
                            changePaperSize(value as PaperSize)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[
                                "A3",
                                "A4",
                                "A5",
                                "Letter",
                                "Legal",
                                "Custom",
                            ].map((size) => (
                                <SelectItem key={size} value={size}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Orientation">
                    <Select
                        value={settings.orientation}
                        onValueChange={(value) =>
                            onSettingsChange({
                                orientation:
                                    value as CanvasSettings["orientation"],
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
                <NumberField
                    label="Width mm"
                    value={settings.widthMm}
                    disabled={settings.paperSize !== "Custom"}
                    onChange={(widthMm) => onSettingsChange({ widthMm })}
                />
                <NumberField
                    label="Height mm"
                    value={settings.heightMm}
                    disabled={settings.paperSize !== "Custom"}
                    onChange={(heightMm) => onSettingsChange({ heightMm })}
                />
            </div>
            <Separator />
            <ToggleRow
                label="Repeat layout grid"
                checked={settings.repeatGrid.enabled}
                onCheckedChange={(enabled) =>
                    onSettingsChange({
                        repeatGrid: {
                            ...settings.repeatGrid,
                            enabled,
                        },
                    })
                }
            />
            {settings.repeatGrid.enabled ? (
                <div className="grid grid-cols-2 gap-3">
                    <NumberField
                        label="Columns"
                        value={settings.repeatGrid.columns}
                        min={1}
                        max={24}
                        onChange={(columns) =>
                            onSettingsChange({
                                repeatGrid: {
                                    ...settings.repeatGrid,
                                    columns,
                                },
                            })
                        }
                    />
                    <NumberField
                        label="Rows"
                        value={settings.repeatGrid.rows}
                        min={1}
                        max={24}
                        onChange={(rows) =>
                            onSettingsChange({
                                repeatGrid: {
                                    ...settings.repeatGrid,
                                    rows,
                                },
                            })
                        }
                    />
                    <NumberField
                        label="Cell Gap"
                        value={settings.repeatGrid.gap}
                        min={0}
                        onChange={(gap) =>
                            onSettingsChange({
                                repeatGrid: {
                                    ...settings.repeatGrid,
                                    gap,
                                },
                            })
                        }
                    />
                </div>
            ) : null}
            <Separator />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Print Mode">
                    <Select
                        value={settings.printMode}
                        onValueChange={(printMode) =>
                            onSettingsChange({
                                printMode:
                                    printMode as CanvasSettings["printMode"],
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="per_print">Per Print</SelectItem>
                            <SelectItem value="per_packing_quantity">
                                Per Packing Quantity
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
                <NumberField
                    label="Copies Per Print"
                    value={settings.copiesPerPrint}
                    min={1}
                    onChange={(copiesPerPrint) =>
                        onSettingsChange({ copiesPerPrint })
                    }
                />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
                <NumberField
                    label="Margin Top"
                    value={settings.margin.top}
                    onChange={(value) => onMarginChange("top", value)}
                />
                <NumberField
                    label="Margin Right"
                    value={settings.margin.right}
                    onChange={(value) => onMarginChange("right", value)}
                />
                <NumberField
                    label="Margin Bottom"
                    value={settings.margin.bottom}
                    onChange={(value) => onMarginChange("bottom", value)}
                />
                <NumberField
                    label="Margin Left"
                    value={settings.margin.left}
                    onChange={(value) => onMarginChange("left", value)}
                />
                <NumberField
                    label="Padding"
                    value={settings.padding}
                    onChange={(padding) => onSettingsChange({ padding })}
                />
                <NumberField
                    label="Grid"
                    value={settings.gridSize}
                    onChange={(gridSize) => onSettingsChange({ gridSize })}
                />
            </div>
            <Separator />
            <ToggleRow
                label="Snap to grid"
                checked={settings.snapToGrid}
                onCheckedChange={(snapToGrid) =>
                    onSettingsChange({ snapToGrid })
                }
            />
            <ToggleRow
                label="Show grid"
                checked={settings.showGrid}
                onCheckedChange={(showGrid) => onSettingsChange({ showGrid })}
            />
            <ToggleRow
                label="Show rulers"
                checked={settings.showRulers}
                onCheckedChange={(showRulers) =>
                    onSettingsChange({ showRulers })
                }
            />
        </>
    );
}

function ElementPropertiesPanel({
    element,
    onChange,
    onDuplicate,
    onDelete,
}: {
    element: TemplateElement;
    onChange: (patch: Partial<TemplateElementPayload>) => void;
    onDuplicate: () => void;
    onDelete: () => void;
}) {
    const payload = element.payload;
    const isText = element.type === "text" || element.type === "variable";
    const isCode = element.type === "barcode" || element.type === "qr";
    const isShape = ["rectangle", "circle", "container", "line"].includes(
        element.type,
    );
    const imageInputId = React.useId();
    const notify = useToastStore((state) => state.notify);
    const [isImageUploading, setIsImageUploading] = React.useState(false);
    const visibilityCondition = payload.visibilityCondition;
    const conditionNeedsValue =
        visibilityCondition?.operator === "equals" ||
        visibilityCondition?.operator === "not_equals";

    async function attachImage(file: File | null) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            notify({
                variant: "error",
                title: "Invalid image",
                description: "Please choose an image file.",
            });
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        setIsImageUploading(true);
        try {
            const response = await api.post<{
                data: { url: string; path: string };
            }>("/templates/images", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onChange({ src: response.data.data.url });
        } catch (error) {
            showApiError(error, notify);
        } finally {
            setIsImageUploading(false);
        }
    }

    return (
        <div className="flex max-h-[min(620px,calc(100vh-3rem))] flex-col">
            <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">{payload.label}</p>
                <p className="text-xs capitalize text-muted-foreground">
                    {element.type} element
                </p>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                <Field label="Element Name">
                    <Input
                        value={payload.label}
                        onChange={(event) =>
                            onChange({ label: event.target.value })
                        }
                    />
                </Field>
                <NumberField
                    label="X"
                    value={payload.x}
                    onChange={(x) => onChange({ x })}
                />
                <NumberField
                    label="Y"
                    value={payload.y}
                    onChange={(y) => onChange({ y })}
                />
                <NumberField
                    label="Width"
                    value={payload.width}
                    onChange={(width) => onChange({ width })}
                />
                <NumberField
                    label="Height"
                    value={payload.height}
                    onChange={(height) => onChange({ height })}
                />
                <NumberField
                    label="Rotation"
                    value={payload.rotation}
                    onChange={(rotation) => onChange({ rotation })}
                />
                <NumberField
                    label="Opacity"
                    value={payload.opacity ?? 1}
                    step="0.1"
                    onChange={(opacity) => onChange({ opacity })}
                />
                <div className="space-y-4">
                    <Separator />
                    <ToggleRow
                        label="Conditional display"
                        checked={Boolean(visibilityCondition)}
                        onCheckedChange={(checked) =>
                            onChange({
                                visibilityCondition: checked
                                    ? {
                                          variable: "product_name",
                                          operator: "equals",
                                          value: "",
                                      }
                                    : undefined,
                            })
                        }
                    />
                    {visibilityCondition ? (
                        <div className="space-y-4 rounded-md border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                                This element is included only when the product
                                value matches this rule.
                            </p>
                            <Field label="Product Field">
                                <Select
                                    value={visibilityCondition.variable}
                                    onValueChange={(variable) =>
                                        onChange({
                                            visibilityCondition: {
                                                ...visibilityCondition,
                                                variable,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {placeholderOptions.map((option) => {
                                            const variable = option.replace(
                                                /^\{\{|\}\}$/g,
                                                "",
                                            );

                                            return (
                                                <SelectItem
                                                    key={variable}
                                                    value={variable}
                                                >
                                                    {dynamicVariableLabel(
                                                        option,
                                                    )}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Condition">
                                <Select
                                    value={visibilityCondition.operator}
                                    onValueChange={(operator) =>
                                        onChange({
                                            visibilityCondition: {
                                                ...visibilityCondition,
                                                operator:
                                                    operator as ElementVisibilityCondition["operator"],
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="equals">
                                            Equals
                                        </SelectItem>
                                        <SelectItem value="not_equals">
                                            Does not equal
                                        </SelectItem>
                                        <SelectItem value="is_empty">
                                            Is empty
                                        </SelectItem>
                                        <SelectItem value="is_not_empty">
                                            Is not empty
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            {conditionNeedsValue ? (
                                <Field label="Value">
                                    <Input
                                        value={visibilityCondition.value ?? ""}
                                        onChange={(event) =>
                                            onChange({
                                                visibilityCondition: {
                                                    ...visibilityCondition,
                                                    value: event.target.value,
                                                },
                                            })
                                        }
                                        placeholder="Circle"
                                    />
                                </Field>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {isText ? (
                    <div className="space-y-4">
                        <Separator />
                        {element.type === "variable" ? (
                            <Field label="Text Value">
                                <Select
                                    value={
                                        payload.value ?? placeholderOptions[0]
                                    }
                                    onValueChange={(value) =>
                                        onChange(
                                            value === "{{serial_number}}"
                                                ? {
                                                      value,
                                                      serialNumberFormat:
                                                          payload.serialNumberFormat ??
                                                          "{yy}-{seq:5}",
                                                      serialNumberStart:
                                                          payload.serialNumberStart ??
                                                          1,
                                                      serialNumberResetsYearly:
                                                          payload.serialNumberResetsYearly ??
                                                          false,
                                                  }
                                                : { value },
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {placeholderOptions.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {dynamicVariableLabel(option)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        ) : (
                            <Field label="Text Value">
                                <Input
                                    value={payload.value ?? ""}
                                    onChange={(event) =>
                                        onChange({ value: event.target.value })
                                    }
                                />
                            </Field>
                        )}
                        {element.type === "variable" &&
                        payload.value === "{{serial_number}}" ? (
                            <div className="space-y-4 rounded-md border bg-muted/20 p-3">
                                <div>
                                    <div className="text-sm font-medium">
                                        Serial Number Configuration
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Applied when this template generates
                                        serial numbers.
                                    </p>
                                </div>
                                <Field label="Serial Format">
                                    <Input
                                        value={
                                            payload.serialNumberFormat ??
                                            "{yy}-{seq:5}"
                                        }
                                        onChange={(event) =>
                                            onChange({
                                                serialNumberFormat:
                                                    event.target.value,
                                            })
                                        }
                                        placeholder="{yy}-{seq:5}"
                                    />
                                </Field>
                                <NumberField
                                    label="Starting Sequence"
                                    value={payload.serialNumberStart ?? 1}
                                    min={1}
                                    onChange={(serialNumberStart) =>
                                        onChange({ serialNumberStart })
                                    }
                                />
                                <div className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                                    Use <code>{"{seq:5}"}</code> for 00001,
                                    <code>{" {rand:8}"}</code> for random text,
                                    and <code>{"{yy}"}</code> for the year.
                                </div>
                                <ToggleRow
                                    label="Reset sequence every year"
                                    checked={Boolean(
                                        payload.serialNumberResetsYearly,
                                    )}
                                    onCheckedChange={(
                                        serialNumberResetsYearly,
                                    ) =>
                                        onChange({
                                            serialNumberResetsYearly,
                                        })
                                    }
                                />
                            </div>
                        ) : null}
                        <Field label="Font Family">
                            <Select
                                value={payload.fontFamily ?? "Figtree"}
                                onValueChange={(fontFamily) =>
                                    onChange({ fontFamily })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Figtree">
                                        Figtree
                                    </SelectItem>
                                    <SelectItem value="Arial">Arial</SelectItem>
                                    <SelectItem value="Courier New">
                                        Courier New
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <NumberField
                            label="Font Size"
                            value={payload.fontSize ?? 14}
                            onChange={(fontSize) => onChange({ fontSize })}
                        />
                        <Field label="Weight">
                            <Select
                                value={payload.fontWeight ?? "500"}
                                onValueChange={(fontWeight) =>
                                    onChange({
                                        fontWeight:
                                            fontWeight as TemplateElementPayload["fontWeight"],
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="400">Regular</SelectItem>
                                    <SelectItem value="500">Medium</SelectItem>
                                    <SelectItem value="600">
                                        SemiBold
                                    </SelectItem>
                                    <SelectItem value="700">Bold</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Align">
                            <Select
                                value={payload.textAlign ?? "left"}
                                onValueChange={(textAlign) =>
                                    onChange({
                                        textAlign:
                                            textAlign as TemplateElementPayload["textAlign"],
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="left">Left</SelectItem>
                                    <SelectItem value="center">
                                        Center
                                    </SelectItem>
                                    <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Color">
                            <Input
                                type="color"
                                value={payload.color ?? "#111827"}
                                onChange={(event) =>
                                    onChange({ color: event.target.value })
                                }
                            />
                        </Field>
                    </div>
                ) : null}
                {isCode ? (
                    <div className="space-y-4">
                        <Separator />
                        <Field label="Value Source">
                            <Input
                                value={payload.valueSource ?? ""}
                                onChange={(event) =>
                                    onChange({
                                        valueSource: event.target.value,
                                    })
                                }
                            />
                        </Field>
                        <ToggleRow
                            label="Show value label"
                            checked={
                                element.type === "barcode"
                                    ? payload.showLabel !== false
                                    : Boolean(payload.showLabel)
                            }
                            onCheckedChange={(showLabel) =>
                                onChange({ showLabel })
                            }
                        />
                    </div>
                ) : null}
                {isShape ? (
                    <div className="space-y-4">
                        <Separator />
                        <Field label="Border">
                            <Input
                                type="color"
                                value={payload.borderColor ?? "#111827"}
                                onChange={(event) =>
                                    onChange({
                                        borderColor: event.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field label="Fill">
                            <Input
                                type="color"
                                value={payload.fillColor ?? "#ffffff"}
                                onChange={(event) =>
                                    onChange({ fillColor: event.target.value })
                                }
                            />
                        </Field>
                        <NumberField
                            label="Border Width"
                            value={payload.borderWidth ?? 1}
                            onChange={(borderWidth) =>
                                onChange({ borderWidth })
                            }
                        />
                        {element.type === "container" ? (
                            <Field label="Border Type">
                                <Select
                                    value={payload.borderStyle ?? "solid"}
                                    onValueChange={(borderStyle) =>
                                        onChange({
                                            borderStyle:
                                                borderStyle as TemplateElementPayload["borderStyle"],
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solid">
                                            Solid
                                        </SelectItem>
                                        <SelectItem value="dashed">
                                            Dashed
                                        </SelectItem>
                                        <SelectItem value="dotted">
                                            Dotted
                                        </SelectItem>
                                        <SelectItem value="double">
                                            Double
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        ) : null}
                        <NumberField
                            label="Radius"
                            value={payload.radius ?? 0}
                            onChange={(radius) => onChange({ radius })}
                        />
                    </div>
                ) : null}
                {element.type === "table" ? (
                    <div className="space-y-4">
                        <Separator />
                        <Field label="Columns">
                            <Input
                                value={(payload.columns ?? []).join(", ")}
                                onChange={(event) =>
                                    onChange({
                                        columns: event.target.value
                                            .split(",")
                                            .map((column) => column.trim())
                                            .filter(Boolean),
                                    })
                                }
                            />
                        </Field>
                        <NumberField
                            label="Rows"
                            value={payload.rows ?? 3}
                            onChange={(rows) => onChange({ rows })}
                        />
                    </div>
                ) : null}
                {element.type === "image" ? (
                    <div className="space-y-4">
                        <Separator />
                        {payload.src ? (
                            <div className="overflow-hidden rounded-md border bg-muted/30 p-2">
                                <img
                                    src={payload.src}
                                    alt={payload.label}
                                    className="max-h-32 w-full object-contain"
                                />
                            </div>
                        ) : null}
                        <input
                            id={imageInputId}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                void attachImage(
                                    event.target.files?.[0] ?? null,
                                );
                                event.currentTarget.value = "";
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isImageUploading}
                            onClick={() =>
                                document.getElementById(imageInputId)?.click()
                            }
                        >
                            <FileImageIcon className="size-4" />
                            {isImageUploading ? "Uploading..." : "Attach Photo"}
                        </Button>
                        <Field label="Image URL">
                            <Input
                                value={payload.src ?? ""}
                                onChange={(event) =>
                                    onChange({ src: event.target.value })
                                }
                                placeholder="/storage/logos/customer.png"
                            />
                        </Field>
                        {payload.src ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-destructive hover:text-destructive"
                                onClick={() => onChange({ src: "" })}
                            >
                                Remove Image
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>
            <div className="flex gap-2 border-t bg-popover p-3">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onDuplicate}
                >
                    Duplicate
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={onDelete}
                >
                    Delete
                </Button>
            </div>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2.5">
            <Label className="text-xs font-medium text-muted-foreground">
                {label}
            </Label>
            {children}
        </div>
    );
}

function NumberField({
    label,
    value,
    onChange,
    disabled,
    min,
    max,
    step = "1",
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: string;
}) {
    return (
        <Field label={label}>
            <InputNumber
                step={step}
                min={min}
                max={max}
                value={Number.isFinite(value) ? value : 0}
                disabled={disabled}
                allowDecimal={step.includes(".")}
                onValueChange={onChange}
            />
        </Field>
    );
}

function ToggleRow({
    label,
    checked,
    onCheckedChange,
}: {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <Label>{label}</Label>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}

function ArrangementButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={disabled}
                        aria-label={label}
                        onClick={onClick}
                    >
                        {children}
                    </Button>
                </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

function createElementPayload(
    type: TemplateElementType,
    x: number,
    y: number,
): TemplateElementPayload {
    const base = {
        id: crypto.randomUUID(),
        type,
        label: labelForType(type),
        x,
        y,
        width: 44,
        height: 18,
        rotation: 0,
        opacity: 1,
        borderColor: "#111827",
        fillColor: "#ffffff",
        borderWidth: 1,
        borderStyle: "solid",
        radius: 0,
    } satisfies TemplateElementPayload;

    if (type === "text") {
        return {
            ...base,
            width: 70,
            height: 18,
            value: "Sample text",
            fontFamily: "Figtree",
            fontSize: 14,
            fontWeight: "600",
            textAlign: "left",
            color: "#111827",
        };
    }

    if (type === "variable") {
        return {
            ...base,
            width: 76,
            height: 18,
            value: "{{customer_name}}",
            fontFamily: "Figtree",
            fontSize: 13,
            fontWeight: "500",
            color: "#111827",
        };
    }

    if (type === "barcode") {
        return {
            ...base,
            width: 82,
            height: 30,
            valueSource: "{{reference_number}}",
            showLabel: true,
        };
    }

    if (type === "qr") {
        return {
            ...base,
            width: 34,
            height: 34,
            valueSource: "{{reference_number}}",
            showLabel: false,
        };
    }

    if (type === "line") {
        return {
            ...base,
            width: 80,
            height: 8,
            lineDirection: "horizontal",
            borderWidth: 2,
        };
    }

    if (type === "circle") {
        return { ...base, width: 28, height: 28 };
    }

    if (type === "image") {
        return { ...base, width: 44, height: 32 };
    }

    if (type === "table") {
        return {
            ...base,
            width: 100,
            height: 58,
            columns: ["Item", "Qty", "Total"],
            rows: 3,
        };
    }

    if (type === "container") {
        return { ...base, width: 94, height: 52, radius: 6 };
    }

    return base;
}

function normalizeElementPayload(
    payload: TemplateElementPayload,
    type: TemplateElementType,
) {
    return {
        ...createElementPayload(type, payload?.x ?? 24, payload?.y ?? 24),
        ...(payload ?? {}),
        id: payload?.id ?? crypto.randomUUID(),
        type,
    };
}

function buildSettingsFromTemplate(template: Template) {
    const paperSize = template.paper_size ?? template.settings?.paperSize;
    const dimensions =
        paperSize && paperSize !== "Custom" ? paperDimensions[paperSize] : null;

    return TemplatePresenter.normalizeSettings({
        ...template.settings,
        paperSize,
        orientation: template.orientation ?? template.settings?.orientation,
        widthMm:
            template.width_mm ??
            template.settings?.widthMm ??
            dimensions?.width,
        heightMm:
            template.height_mm ??
            template.settings?.heightMm ??
            dimensions?.height,
    });
}

function labelForType(type: TemplateElementType) {
    const labels: Record<TemplateElementType, string> = {
        text: "Text",
        variable: "Variable",
        barcode: "Barcode",
        qr: "QR Code",
        line: "Line",
        rectangle: "Rectangle",
        circle: "Circle",
        image: "Image",
        table: "Table",
        container: "Container",
    };

    return labels[type];
}

function dynamicVariableLabel(value: string) {
    return value
        .replace(/^\{\{|\}\}$/g, "")
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function normalizeCustomerOptions(payload: unknown): CustomerOption[] {
    let current = payload;

    for (let depth = 0; depth < 3; depth++) {
        if (
            typeof current === "object" &&
            current !== null &&
            !Array.isArray(current) &&
            "data" in current
        ) {
            current = current.data;
            continue;
        }

        const rows = Array.isArray(current)
            ? current
            : typeof current === "object" && current !== null
              ? Object.values(current)
              : [];

        return rows.flatMap((customer) => {
            if (typeof customer !== "object" || customer === null) return [];

            const row = customer as Record<string, unknown>;
            const id = Number(row.id);
            if (
                !Number.isInteger(id) ||
                typeof row.name !== "string" ||
                typeof row.code !== "string"
            ) {
                return [];
            }

            return [{ id, name: row.name, code: row.code }];
        });
    }

    return [];
}

function snap(value: number, settings: CanvasSettings) {
    if (!settings.snapToGrid) return Math.max(0, Math.round(value));

    return Math.max(
        0,
        Math.round(value / settings.gridSize) * settings.gridSize,
    );
}

function normalizeElementLayers(elements: TemplateElement[]) {
    return [...elements]
        .sort((first, second) => first.z_index - second.z_index)
        .map((element, index) => ({ ...element, z_index: index }));
}

function arrangeElementLayers(
    elements: TemplateElement[],
    selectedIds: Set<string>,
    direction: "forward" | "backward" | "front" | "back",
) {
    const stack = normalizeElementLayers(elements);
    const hasSelectedElement = stack.some((element) =>
        selectedIds.has(element.payload.id),
    );
    if (!hasSelectedElement) return null;

    if (direction === "front" || direction === "back") {
        const selected = stack.filter((element) =>
            selectedIds.has(element.payload.id),
        );
        const rest = stack.filter(
            (element) => !selectedIds.has(element.payload.id),
        );

        return normalizeElementLayers(
            direction === "front"
                ? [...rest, ...selected]
                : [...selected, ...rest],
        );
    }

    if (direction === "forward") {
        for (let index = stack.length - 2; index >= 0; index -= 1) {
            const current = stack[index];
            const next = stack[index + 1];

            if (
                selectedIds.has(current.payload.id) &&
                !selectedIds.has(next.payload.id)
            ) {
                stack[index] = next;
                stack[index + 1] = current;
            }
        }
    }

    if (direction === "backward") {
        for (let index = 1; index < stack.length; index += 1) {
            const previous = stack[index - 1];
            const current = stack[index];

            if (
                selectedIds.has(current.payload.id) &&
                !selectedIds.has(previous.payload.id)
            ) {
                stack[index - 1] = current;
                stack[index] = previous;
            }
        }
    }

    return normalizeElementLayers(stack);
}

function withPayload(
    element: TemplateElement,
    patch: Partial<TemplateElementPayload>,
    settings: CanvasSettings,
): TemplateElement {
    const payload = constrainElementPayload(
        { ...element.payload, ...patch },
        settings,
    );

    return {
        ...element,
        name: patch.label ?? element.name,
        payload,
    };
}

function getRepeatGridMetrics(settings: CanvasSettings) {
    const canvas = TemplatePresenter.getCanvasSize(settings);
    const columns = settings.repeatGrid.enabled
        ? Math.max(settings.repeatGrid.columns, 1)
        : 1;
    const rows = settings.repeatGrid.enabled
        ? Math.max(settings.repeatGrid.rows, 1)
        : 1;
    const gap = getRepeatGap(
        settings.repeatGrid.enabled ? settings.repeatGrid.gap : 0,
        canvas,
        columns,
        rows,
    );

    return {
        columns,
        rows,
        gap,
        width: Math.max(1, (canvas.width - gap * (columns - 1)) / columns),
        height: Math.max(1, (canvas.height - gap * (rows - 1)) / rows),
    };
}

function getEditableContentBounds(settings: CanvasSettings) {
    const canvas = TemplatePresenter.getCanvasSize(settings);
    const cell = getRepeatGridMetrics(settings);
    const source = settings.repeatGrid.enabled ? cell : canvas;
    const left = Math.max(0, settings.margin.left + settings.padding);
    const top = Math.max(0, settings.margin.top + settings.padding);
    const right = Math.max(0, settings.margin.right + settings.padding);
    const bottom = Math.max(0, settings.margin.bottom + settings.padding);

    const width = Math.max(8, source.width - left - right);
    const height = Math.max(8, source.height - top - bottom);

    return {
        x: Math.min(left, Math.max(0, source.width - width)),
        y: Math.min(top, Math.max(0, source.height - height)),
        width,
        height,
    };
}

function getRepeatGap(
    gap: number,
    canvas: { width: number; height: number },
    columns: number,
    rows: number,
) {
    const maxColumnGap =
        columns > 1
            ? Math.max(0, (canvas.width - columns) / (columns - 1))
            : Infinity;
    const maxRowGap =
        rows > 1 ? Math.max(0, (canvas.height - rows) / (rows - 1)) : Infinity;

    return Math.min(Math.max(gap, 0), maxColumnGap, maxRowGap);
}

function toEditableCellPosition(
    x: number,
    y: number,
    settings: CanvasSettings,
) {
    const bounds = getEditableContentBounds(settings);

    return {
        x: Math.min(
            Math.max(bounds.x, x),
            Math.max(bounds.x, bounds.x + bounds.width - 8),
        ),
        y: Math.min(
            Math.max(bounds.y, y),
            Math.max(bounds.y, bounds.y + bounds.height - 8),
        ),
    };
}

function isInsideEditableCell(x: number, y: number, settings: CanvasSettings) {
    const bounds = getEditableContentBounds(settings);

    return (
        x >= bounds.x &&
        y >= bounds.y &&
        x <= bounds.x + bounds.width &&
        y <= bounds.y + bounds.height
    );
}

function constrainElementPayload(
    payload: TemplateElementPayload,
    settings: CanvasSettings,
): TemplateElementPayload {
    const bounds = getEditableContentBounds(settings);
    const width = Math.min(Math.max(8, payload.width), bounds.width);
    const height = Math.min(Math.max(8, payload.height), bounds.height);

    return {
        ...payload,
        width,
        height,
        x: Math.min(
            Math.max(bounds.x, payload.x),
            Math.max(bounds.x, bounds.x + bounds.width - width),
        ),
        y: Math.min(
            Math.max(bounds.y, payload.y),
            Math.max(bounds.y, bounds.y + bounds.height - height),
        ),
    };
}

function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
        target.closest(
            "input, textarea, select, [contenteditable='true'], [role='textbox']",
        ),
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
