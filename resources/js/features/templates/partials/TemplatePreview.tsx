import {
    BarcodeIcon,
    ImageIcon,
    QrCodeIcon,
    SquareDashedIcon,
    Trash2Icon,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import {
    type CanvasSettings,
    type TemplateElement,
    type TemplateElementPayload,
    TemplatePresenter,
} from "./template.model";

type TemplatePreviewProps = {
    settings: CanvasSettings;
    elements: TemplateElement[];
    selectedElementId?: string | null;
    selectedElementIds?: Set<string>;
    editable?: boolean;
    onSelectElement?: (
        id: string,
        event:
            | React.MouseEvent<HTMLDivElement>
            | React.PointerEvent<HTMLDivElement>,
    ) => void;
    onElementDragStart?: (id: string | null) => void;
    onElementMove?: (id: string, position: { x: number; y: number }) => void;
    onElementResize?: (
        id: string,
        patch: Pick<TemplateElementPayload, "width" | "height">,
    ) => void;
    onElementDelete?: (id: string) => void;
    onSelectElements?: (ids: string[]) => void;
    onCanvasDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
};

const CANVAS_SCALE = 2.25;

export function TemplatePreview({
    settings,
    elements,
    selectedElementId,
    selectedElementIds,
    editable,
    onSelectElement,
    onElementDragStart,
    onElementMove,
    onElementResize,
    onElementDelete,
    onSelectElements,
    onCanvasDrop,
}: TemplatePreviewProps) {
    const [selectionRect, setSelectionRect] = React.useState<SelectionRect | null>(
        null,
    );
    const canvas = TemplatePresenter.getCanvasSize(settings);
    const canvasWidth = canvas.width * CANVAS_SCALE;
    const canvasHeight = canvas.height * CANVAS_SCALE;
    const margin = settings.margin;
    const gridSize = Math.max(settings.gridSize, 4);
    const repeatColumns = settings.repeatGrid.enabled
        ? Math.max(settings.repeatGrid.columns, 1)
        : 1;
    const repeatRows = settings.repeatGrid.enabled
        ? Math.max(settings.repeatGrid.rows, 1)
        : 1;
    const cellWidth = canvas.width / repeatColumns;
    const cellHeight = canvas.height / repeatRows;
    const mirroredCells = Array.from({ length: repeatRows }).flatMap((_, row) =>
        Array.from({ length: repeatColumns }).map((__, column) => ({
            row,
            column,
            isEditableCell: row === 0 && column === 0,
            offsetX: column * cellWidth,
            offsetY: row * cellHeight,
        })),
    );
    const layeredElements = elements
        .map((element, index) => ({ element, index }))
        .sort(
            (first, second) =>
                first.element.z_index - second.element.z_index ||
                first.index - second.index,
        )
        .map(({ element }) => element);

    function getPointerPosition(event: React.PointerEvent<HTMLDivElement>) {
        const bounds = event.currentTarget.getBoundingClientRect();

        return {
            x:
                (event.clientX - bounds.left) /
                settings.zoom /
                CANVAS_SCALE,
            y:
                (event.clientY - bounds.top) /
                settings.zoom /
                CANVAS_SCALE,
        };
    }

    function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (!editable || event.button !== 0) return;
        if (event.target !== event.currentTarget) return;

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = getPointerPosition(event);
        setSelectionRect({
            startX: point.x,
            startY: point.y,
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
        });
    }

    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (!selectionRect) return;

        const point = getPointerPosition(event);
        setSelectionRect((current) =>
            current
                ? {
                      ...current,
                      x: Math.min(current.startX, point.x),
                      y: Math.min(current.startY, point.y),
                      width: Math.abs(point.x - current.startX),
                      height: Math.abs(point.y - current.startY),
                  }
                : current,
        );
    }

    function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
        if (!selectionRect) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        const selectedIds =
            selectionRect.width < 2 && selectionRect.height < 2
                ? []
                : layeredElements
                      .filter((element) =>
                          intersectsRect(selectionRect, element.payload),
                      )
                      .map((element) => element.payload.id);

        onSelectElements?.(selectedIds);
        setSelectionRect(null);
    }

    return (
        <div
            className={cn(
                "relative shrink-0 overflow-hidden border bg-background shadow-sm",
                editable && "cursor-crosshair",
            )}
            style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${settings.zoom})`,
                transformOrigin: "top left",
                backgroundImage: settings.showGrid
                    ? "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)"
                    : undefined,
                backgroundSize: settings.showGrid
                    ? `${gridSize * CANVAS_SCALE}px ${gridSize * CANVAS_SCALE}px`
                    : undefined,
            }}
            onDragOver={(event) => {
                if (editable) event.preventDefault();
            }}
            onDrop={onCanvasDrop}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => setSelectionRect(null)}
        >
            {settings.showRulers ? (
                <>
                    <div className="absolute inset-x-0 top-0 z-10 h-5 border-b bg-muted/70" />
                    <div className="absolute inset-y-0 left-0 z-10 w-5 border-r bg-muted/70" />
                    {Array.from({
                        length: Math.floor(canvas.width / 20) + 1,
                    }).map((_, index) => (
                        <div
                            key={`x-${index}`}
                            className="absolute top-0 z-20 h-5 border-l border-foreground/20 pl-0.5 text-[9px] text-muted-foreground"
                            style={{ left: index * 20 * CANVAS_SCALE }}
                        >
                            {index * 20}
                        </div>
                    ))}
                    {Array.from({
                        length: Math.floor(canvas.height / 20) + 1,
                    }).map((_, index) => (
                        <div
                            key={`y-${index}`}
                            className="absolute left-0 z-20 w-5 border-t border-foreground/20 pt-0.5 text-[9px] text-muted-foreground"
                            style={{ top: index * 20 * CANVAS_SCALE }}
                        >
                            {index * 20}
                        </div>
                    ))}
                </>
            ) : null}
            <div
                className="pointer-events-none absolute border border-dashed border-primary/40"
                style={{
                    inset: `${margin.top * CANVAS_SCALE}px ${margin.right * CANVAS_SCALE}px ${margin.bottom * CANVAS_SCALE}px ${margin.left * CANVAS_SCALE}px`,
                }}
            />
            <div
                className="pointer-events-none absolute border border-dotted border-muted-foreground/40"
                style={{
                    inset: `${(margin.top + settings.padding) * CANVAS_SCALE}px ${(margin.right + settings.padding) * CANVAS_SCALE}px ${(margin.bottom + settings.padding) * CANVAS_SCALE}px ${(margin.left + settings.padding) * CANVAS_SCALE}px`,
                }}
            />
            {settings.repeatGrid.enabled ? (
                <div className="pointer-events-none absolute inset-0 z-10">
                    {mirroredCells.map((cell) => (
                        <div
                            key={`${cell.row}-${cell.column}`}
                            className={cn(
                                "absolute border border-primary/25",
                                cell.isEditableCell && "bg-primary/[0.03]",
                            )}
                            style={{
                                left: cell.offsetX * CANVAS_SCALE,
                                top: cell.offsetY * CANVAS_SCALE,
                                width: cellWidth * CANVAS_SCALE,
                                height: cellHeight * CANVAS_SCALE,
                            }}
                        >
                            {cell.isEditableCell ? (
                                <span className="absolute left-1 top-1 rounded-sm bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground">
                                    Editable
                                </span>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}
            <div className="absolute inset-0 z-20">
                {settings.repeatGrid.enabled
                    ? mirroredCells
                          .filter((cell) => !cell.isEditableCell)
                          .flatMap((cell) =>
                              layeredElements.map((element) => (
                                  <CanvasElement
                                      key={`${element.payload.id}-${cell.row}-${cell.column}`}
                                      element={element}
                                      selected={false}
                                      editable={false}
                                      mirror
                                      zoom={settings.zoom}
                                      offsetX={cell.offsetX}
                                      offsetY={cell.offsetY}
                                  />
                              )),
                          )
                    : null}
                {layeredElements.map((element) => (
                    <CanvasElement
                        key={element.payload.id}
                        element={element}
                        selected={
                            selectedElementIds?.has(element.payload.id) ??
                            selectedElementId === element.payload.id
                        }
                        editable={Boolean(editable)}
                        zoom={settings.zoom}
                        offsetX={0}
                        offsetY={0}
                        onSelectElement={onSelectElement}
                        onElementDragStart={onElementDragStart}
                        onElementMove={onElementMove}
                        onElementResize={onElementResize}
                        onElementDelete={onElementDelete}
                    />
                ))}
            </div>
            {selectionRect ? (
                <div
                    className="pointer-events-none absolute z-[999] border border-primary bg-primary/10"
                    style={{
                        left: selectionRect.x * CANVAS_SCALE,
                        top: selectionRect.y * CANVAS_SCALE,
                        width: selectionRect.width * CANVAS_SCALE,
                        height: selectionRect.height * CANVAS_SCALE,
                    }}
                />
            ) : null}
        </div>
    );
}

type SelectionRect = {
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

function intersectsRect(rect: SelectionRect, payload: TemplateElementPayload) {
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;
    const elementRight = payload.x + payload.width;
    const elementBottom = payload.y + payload.height;

    return (
        payload.x < right &&
        elementRight > rect.x &&
        payload.y < bottom &&
        elementBottom > rect.y
    );
}

function CanvasElement({
    element,
    selected,
    editable,
    mirror,
    zoom,
    offsetX,
    offsetY,
    onSelectElement,
    onElementDragStart,
    onElementMove,
    onElementResize,
    onElementDelete,
}: {
    element: TemplateElement;
    selected: boolean;
    editable: boolean;
    mirror?: boolean;
    zoom: number;
    offsetX: number;
    offsetY: number;
    onSelectElement?: (
        id: string,
        event:
            | React.MouseEvent<HTMLDivElement>
            | React.PointerEvent<HTMLDivElement>,
    ) => void;
    onElementDragStart?: (id: string | null) => void;
    onElementMove?: (id: string, position: { x: number; y: number }) => void;
    onElementResize?: (
        id: string,
        patch: Pick<TemplateElementPayload, "width" | "height">,
    ) => void;
    onElementDelete?: (id: string) => void;
}) {
    const payload = element.payload;
    const commonStyle = {
        left: (payload.x + offsetX) * CANVAS_SCALE,
        top: (payload.y + offsetY) * CANVAS_SCALE,
        width: payload.width * CANVAS_SCALE,
        height: payload.height * CANVAS_SCALE,
        transform: `rotate(${payload.rotation}deg)`,
        opacity: mirror ? (payload.opacity ?? 1) * 0.72 : payload.opacity ?? 1,
    };

    function startMove(event: React.PointerEvent<HTMLDivElement>) {
        if (!editable || mirror || event.button !== 0) return;
        if ((event.target as HTMLElement).closest("button")) return;

        event.preventDefault();
        event.stopPropagation();
        onSelectElement?.(payload.id, event);
        onElementDragStart?.(payload.id);
        event.currentTarget.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startY = event.clientY;
        const startPayloadX = payload.x;
        const startPayloadY = payload.y;

        function handlePointerMove(moveEvent: PointerEvent) {
            onElementMove?.(payload.id, {
                x:
                    startPayloadX +
                    (moveEvent.clientX - startX) / CANVAS_SCALE / zoom,
                y:
                    startPayloadY +
                    (moveEvent.clientY - startY) / CANVAS_SCALE / zoom,
            });
        }

        function stopMove() {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopMove);
            onElementDragStart?.(null);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopMove);
    }

    function startResize(event: React.PointerEvent<HTMLButtonElement>) {
        event.preventDefault();
        event.stopPropagation();

        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = payload.width;
        const startHeight = payload.height;

        function handlePointerMove(moveEvent: PointerEvent) {
            onElementResize?.(payload.id, {
                width: Math.max(
                    8,
                    Math.round(
                        startWidth +
                            (moveEvent.clientX - startX) / CANVAS_SCALE / zoom,
                    ),
                ),
                height: Math.max(
                    8,
                    Math.round(
                        startHeight +
                            (moveEvent.clientY - startY) / CANVAS_SCALE / zoom,
                    ),
                ),
            });
        }

        function stopResize() {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopResize);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopResize);
    }

    return (
        <div
            className={cn(
                "absolute select-none",
                editable && "cursor-move",
                mirror && "pointer-events-none",
                selected && "ring-2 ring-primary ring-offset-2",
            )}
            style={commonStyle}
            draggable={false}
            onPointerDown={startMove}
            onClick={(event) => {
                event.stopPropagation();
            }}
        >
            <ElementBody element={element} />
            {editable && selected ? (
                <>
                    <button
                        type="button"
                        className="absolute -right-3 -top-3 z-50 flex size-6 items-center justify-center rounded-full border bg-background text-destructive shadow-sm"
                        aria-label={`Delete ${payload.label}`}
                        draggable={false}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onElementDelete?.(payload.id);
                        }}
                    >
                        <Trash2Icon className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        className="absolute -bottom-2 -right-2 z-50 size-4 cursor-se-resize rounded-sm border border-primary bg-background shadow-sm"
                        aria-label={`Resize ${payload.label}`}
                        draggable={false}
                        onPointerDown={startResize}
                    />
                </>
            ) : null}
        </div>
    );
}

function ElementBody({ element }: { element: TemplateElement }) {
    const payload = element.payload;

    if (element.type === "text" || element.type === "variable") {
        return (
            <div
                className="flex h-full w-full items-center overflow-hidden whitespace-pre-wrap"
                style={{
                    color: payload.color ?? "#111827",
                    fontFamily: payload.fontFamily ?? "Figtree",
                    fontSize: payload.fontSize ?? 14,
                    fontWeight: payload.fontWeight ?? "500",
                    justifyContent:
                        payload.textAlign === "center"
                            ? "center"
                            : payload.textAlign === "right"
                              ? "flex-end"
                              : "flex-start",
                    textAlign: payload.textAlign ?? "left",
                }}
            >
                {payload.value ?? payload.label}
            </div>
        );
    }

    if (element.type === "barcode") {
        return (
            <div className="flex h-full w-full flex-col justify-end gap-1 overflow-hidden text-center text-[10px] text-black">
                <div
                    className="min-h-6 flex-1"
                    style={{
                        background:
                            "repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 4px, #111 4px 5px, transparent 5px 8px)",
                    }}
                />
                {payload.showLabel !== false ? (
                    <span className="truncate">{payload.valueSource}</span>
                ) : null}
            </div>
        );
    }

    if (element.type === "qr") {
        return (
            <div className="flex h-full w-full flex-col gap-1 overflow-hidden text-center text-[10px] text-black">
                <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-5 gap-px">
                    {Array.from({ length: 25 }).map((_, index) => (
                        <div
                            key={index}
                            className={
                                [
                                    0, 1, 3, 5, 6, 8, 12, 16, 18, 19, 21, 22,
                                    24,
                                ].includes(index)
                                    ? "bg-black"
                                    : "bg-transparent"
                            }
                        />
                    ))}
                </div>
                {payload.showLabel ? (
                    <span className="truncate">{payload.valueSource}</span>
                ) : null}
            </div>
        );
    }

    if (element.type === "line") {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div
                    className="bg-current"
                    style={{
                        color: payload.borderColor ?? "#111827",
                        width:
                            payload.lineDirection === "vertical"
                                ? payload.borderWidth ?? 2
                                : "100%",
                        height:
                            payload.lineDirection === "vertical"
                                ? "100%"
                                : payload.borderWidth ?? 2,
                    }}
                />
            </div>
        );
    }

    if (element.type === "image") {
        return payload.src ? (
            <img
                src={payload.src}
                alt={payload.label}
                className="h-full w-full object-contain"
            />
        ) : (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed bg-muted/40 text-muted-foreground">
                <ImageIcon className="size-5" />
            </div>
        );
    }

    if (element.type === "table") {
        const columns = payload.columns ?? ["Item", "Qty", "Total"];
        const rows = payload.rows ?? 3;

        return (
            <div className="grid h-full w-full overflow-hidden rounded-sm border text-[10px]">
                <div
                    className="grid bg-muted font-semibold"
                    style={{
                        gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                    }}
                >
                    {columns.map((column) => (
                        <div key={column} className="border-r px-1 py-0.5">
                            {column}
                        </div>
                    ))}
                </div>
                {Array.from({ length: rows }).map((_, row) => (
                    <div
                        key={row}
                        className="grid border-t"
                        style={{
                            gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {columns.map((column) => (
                            <div key={column} className="border-r px-1 py-0.5">
                                -
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (element.type === "container") {
        return (
            <div
                className="flex h-full w-full items-center justify-center border border-dashed text-xs text-muted-foreground"
                style={{
                    borderColor: payload.borderColor ?? "#6b7280",
                    backgroundColor: payload.fillColor ?? "transparent",
                    borderWidth: payload.borderWidth ?? 1,
                    borderRadius: payload.radius ?? 8,
                }}
            >
                <SquareDashedIcon className="mr-1 size-4" />
                {payload.label}
            </div>
        );
    }

    if (element.type === "circle" || element.type === "rectangle") {
        return (
            <div
                className="h-full w-full"
                style={{
                    borderColor: payload.borderColor ?? "#111827",
                    backgroundColor: payload.fillColor ?? "transparent",
                    borderWidth: payload.borderWidth ?? 1,
                    borderStyle: "solid",
                    borderRadius:
                        element.type === "circle" ? "999px" : payload.radius ?? 0,
                }}
            />
        );
    }

    return (
        <div className="flex h-full w-full items-center justify-center rounded border bg-muted text-muted-foreground">
            {element.type === "qr" ? <QrCodeIcon /> : <BarcodeIcon />}
        </div>
    );
}
