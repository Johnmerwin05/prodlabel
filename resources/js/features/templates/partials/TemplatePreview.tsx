import {
    BarcodeIcon,
    ImageIcon,
    QrCodeIcon,
    Trash2Icon,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import * as React from "react";

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
    renderMode?: "designer" | "print";
    repeatInstances?: TemplateElement[][];
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
    renderElementContextMenu?: (element: TemplateElement) => React.ReactNode;
    onElementDelete?: (id: string) => void;
    onSelectElements?: (ids: string[]) => void;
    onCanvasDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
};

const CANVAS_SCALE = 2.25;

export function TemplatePreview({
    settings,
    elements,
    renderMode = "designer",
    repeatInstances,
    selectedElementId,
    selectedElementIds,
    editable,
    onSelectElement,
    onElementDragStart,
    onElementMove,
    onElementResize,
    renderElementContextMenu,
    onElementDelete,
    onSelectElements,
    onCanvasDrop,
}: TemplatePreviewProps) {
    const [selectionRect, setSelectionRect] =
        React.useState<SelectionRect | null>(null);
    const isPrintMode = renderMode === "print";
    const canvas = TemplatePresenter.getCanvasSize(settings);
    const unit = isPrintMode ? "mm" : "px";
    const unitScale = isPrintMode ? 1 : CANVAS_SCALE;
    const canvasWidth = canvas.width * unitScale;
    const canvasHeight = canvas.height * unitScale;
    const margin = settings.margin;
    const gridSize = Math.max(settings.gridSize, 4);
    const repeatColumns = settings.repeatGrid.enabled
        ? Math.max(settings.repeatGrid.columns, 1)
        : 1;
    const repeatRows = settings.repeatGrid.enabled
        ? Math.max(settings.repeatGrid.rows, 1)
        : 1;
    const repeatGap = getRepeatGap(
        settings.repeatGrid.enabled ? settings.repeatGrid.gap : 0,
        canvas,
        repeatColumns,
        repeatRows,
    );
    const cellWidth = Math.max(
        1,
        (canvas.width - repeatGap * (repeatColumns - 1)) / repeatColumns,
    );
    const cellHeight = Math.max(
        1,
        (canvas.height - repeatGap * (repeatRows - 1)) / repeatRows,
    );
    const mirroredCells = Array.from({ length: repeatRows }).flatMap((_, row) =>
        Array.from({ length: repeatColumns }).map((__, column) => ({
            row,
            column,
            isEditableCell: row === 0 && column === 0,
            offsetX: column * (cellWidth + repeatGap),
            offsetY: row * (cellHeight + repeatGap),
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
            x: (event.clientX - bounds.left) / settings.zoom / CANVAS_SCALE,
            y: (event.clientY - bounds.top) / settings.zoom / CANVAS_SCALE,
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
                "relative shrink-0 overflow-hidden bg-background",
                !isPrintMode && "border shadow-sm",
                isPrintMode && "bg-white",
                editable && "cursor-crosshair",
            )}
            style={{
                width: `${canvasWidth}${unit}`,
                height: `${canvasHeight}${unit}`,
                transform: isPrintMode
                    ? undefined
                    : `scale(${settings.zoom})`,
                transformOrigin: "top left",
                backgroundImage: settings.showGrid && !isPrintMode
                    ? "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)"
                    : undefined,
                backgroundSize: settings.showGrid && !isPrintMode
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
            {settings.showRulers && !isPrintMode ? (
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
            {!settings.repeatGrid.enabled && !isPrintMode ? (
                <>
                    <MarginGuide margin={margin} />
                    <PaddingGuide margin={margin} padding={settings.padding} />
                </>
            ) : null}
            {settings.repeatGrid.enabled && !isPrintMode ? (
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
                            <MarginGuide margin={margin} />
                            <PaddingGuide
                                margin={margin}
                                padding={settings.padding}
                            />
                            {/* {cell.isEditableCell ? (
                                <span className="absolute left-1 top-1 rounded-sm bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground">
                                    Editable
                                </span>
                            ) : null} */}
                        </div>
                    ))}
                </div>
            ) : null}
            <div className="absolute inset-0 z-20">
                {settings.repeatGrid.enabled && repeatInstances?.length
                    ? mirroredCells.flatMap((cell, cellIndex) => {
                          const elementsForCell = repeatInstances[cellIndex];
                          if (!elementsForCell) return [];

                          return sortElements(elementsForCell).map((element) => (
                              <CanvasElement
                                  key={`${element.payload.id}-${cell.row}-${cell.column}`}
                                  element={element}
                                  selected={false}
                                  editable={false}
                                  mirror={renderMode !== "print" && !cell.isEditableCell}
                                  zoom={settings.zoom}
                                  renderMode={renderMode}
                                  unit={unit}
                                  unitScale={unitScale}
                                  offsetX={cell.offsetX}
                                  offsetY={cell.offsetY}
                              />
                          ));
                      })
                    : settings.repeatGrid.enabled
                      ? mirroredCells
                            .filter((cell) => !cell.isEditableCell)
                            .flatMap((cell) =>
                                layeredElements.map((element) => (
                                  <CanvasElement
                                      key={`${element.payload.id}-${cell.row}-${cell.column}`}
                                      element={element}
                                      selected={false}
                                      editable={false}
                                      mirror={renderMode !== "print"}
                                      zoom={settings.zoom}
                                      renderMode={renderMode}
                                      unit={unit}
                                      unitScale={unitScale}
                                      offsetX={cell.offsetX}
                                      offsetY={cell.offsetY}
                                  />
                                )),
                            )
                      : null}
                {(!settings.repeatGrid.enabled || !repeatInstances?.length) && layeredElements.map((element) => (
                    <CanvasElement
                        key={element.payload.id}
                        element={element}
                        selected={
                            selectedElementIds?.has(element.payload.id) ??
                            selectedElementId === element.payload.id
                        }
                        editable={Boolean(editable)}
                        zoom={settings.zoom}
                        renderMode={renderMode}
                        unit={unit}
                        unitScale={unitScale}
                        offsetX={0}
                        offsetY={0}
                        onSelectElement={onSelectElement}
                        onElementDragStart={onElementDragStart}
                        onElementMove={onElementMove}
                        onElementResize={onElementResize}
                        renderElementContextMenu={renderElementContextMenu}
                        onElementDelete={onElementDelete}
                    />
                ))}
            </div>
            {selectionRect && !isPrintMode ? (
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

function sortElements(elements: TemplateElement[]) {
    return elements
        .map((element, index) => ({ element, index }))
        .sort(
            (first, second) =>
                first.element.z_index - second.element.z_index ||
                first.index - second.index,
        )
        .map(({ element }) => element);
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
        rows > 1
            ? Math.max(0, (canvas.height - rows) / (rows - 1))
            : Infinity;

    return Math.min(Math.max(gap, 0), maxColumnGap, maxRowGap);
}

function CanvasElement({
    element,
    selected,
    editable,
    mirror,
    zoom,
    renderMode,
    unit,
    unitScale,
    offsetX,
    offsetY,
    onSelectElement,
    onElementDragStart,
    onElementMove,
    onElementResize,
    renderElementContextMenu,
    onElementDelete,
}: {
    element: TemplateElement;
    selected: boolean;
    editable: boolean;
    mirror?: boolean;
    zoom: number;
    renderMode: "designer" | "print";
    unit: "px" | "mm";
    unitScale: number;
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
    renderElementContextMenu?: (element: TemplateElement) => React.ReactNode;
    onElementDelete?: (id: string) => void;
}) {
    const payload = element.payload;
    const commonStyle = {
        left: `${(payload.x + offsetX) * unitScale}${unit}`,
        top: `${(payload.y + offsetY) * unitScale}${unit}`,
        width: `${payload.width * unitScale}${unit}`,
        height: `${payload.height * unitScale}${unit}`,
        transform: `rotate(${payload.rotation}deg)`,
        opacity: mirror
            ? (payload.opacity ?? 1) * 0.72
            : (payload.opacity ?? 1),
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

    const elementNode = (
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
            onContextMenu={(event) => {
                if (!editable || mirror) return;

                event.stopPropagation();
                onSelectElement?.(payload.id, event);
            }}
        >
            <ElementBody element={element} renderMode={renderMode} />
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

    if (!editable || mirror || !renderElementContextMenu) return elementNode;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{elementNode}</ContextMenuTrigger>
            <ContextMenuContent
                className="w-[min(22rem,calc(100vw-2rem))] p-0"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                {renderElementContextMenu(element)}
            </ContextMenuContent>
        </ContextMenu>
    );
}

function MarginGuide({ margin }: { margin: CanvasSettings["margin"] }) {
    return (
        <div
            className="pointer-events-none absolute border border-dashed border-primary/40"
            style={{
                inset: `${margin.top * CANVAS_SCALE}px ${margin.right * CANVAS_SCALE}px ${margin.bottom * CANVAS_SCALE}px ${margin.left * CANVAS_SCALE}px`,
            }}
        />
    );
}

function PaddingGuide({
    margin,
    padding,
}: {
    margin: CanvasSettings["margin"];
    padding: number;
}) {
    return (
        <div
            className="pointer-events-none absolute border border-dotted border-muted-foreground/40"
            style={{
                inset: `${(margin.top + padding) * CANVAS_SCALE}px ${(margin.right + padding) * CANVAS_SCALE}px ${(margin.bottom + padding) * CANVAS_SCALE}px ${(margin.left + padding) * CANVAS_SCALE}px`,
            }}
        />
    );
}

function ElementBody({
    element,
    renderMode,
}: {
    element: TemplateElement;
    renderMode: "designer" | "print";
}) {
    const payload = element.payload;
    const isPrintMode = renderMode === "print";

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
        const codeValue = String(
            payload.value ?? payload.valueSource ?? payload.label ?? "",
        );

        return (
            <div className="flex h-full w-full flex-col justify-end gap-1 overflow-hidden text-center text-[10px] text-black">
                <BarcodeGraphic value={codeValue} />
                {payload.showLabel !== false ? (
                    <span className="truncate">{codeValue}</span>
                ) : null}
            </div>
        );
    }

    if (element.type === "qr") {
        const codeValue = String(
            payload.value ?? payload.valueSource ?? payload.label ?? "",
        );

        return (
            <div className="flex h-full w-full flex-col gap-1 overflow-hidden text-center text-[10px] text-black">
                <QrGraphic value={codeValue} />
                {payload.showLabel ? (
                    <span className="truncate">{codeValue}</span>
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
                                ? (payload.borderWidth ?? 2)
                                : "100%",
                        height:
                            payload.lineDirection === "vertical"
                                ? "100%"
                                : (payload.borderWidth ?? 2),
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
        ) : isPrintMode ? null : (
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
                className="h-full w-full"
                style={{
                    borderColor: payload.borderColor ?? "#6b7280",
                    backgroundColor: payload.fillColor ?? "transparent",
                    borderWidth: payload.borderWidth ?? 1,
                    borderStyle: payload.borderStyle ?? "solid",
                    borderRadius: payload.radius ?? 8,
                }}
            />
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
                        element.type === "circle"
                            ? "999px"
                            : (payload.radius ?? 0),
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

function BarcodeGraphic({ value }: { value: string }) {
    const svgRef = React.useRef<SVGSVGElement | null>(null);

    React.useEffect(() => {
        if (!svgRef.current) return;

        svgRef.current.innerHTML = "";

        try {
            JsBarcode(svgRef.current, value || " ", {
                format: "CODE128",
                width: 2,
                height: 64,
                displayValue: false,
                margin: 0,
                background: "#ffffff",
                lineColor: "#000000",
            });
        } catch {
            svgRef.current.innerHTML = "";
        }
    }, [value]);

    return (
        <div className="flex min-h-6 flex-1 items-center justify-center overflow-hidden bg-white">
            <svg
                ref={svgRef}
                aria-label={value}
                className="h-full w-full"
                preserveAspectRatio="none"
                role="img"
            />
        </div>
    );
}

function QrGraphic({ value }: { value: string }) {
    const [src, setSrc] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        QRCode.toDataURL(value || " ", {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 192,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        })
            .then((dataUrl) => {
                if (!cancelled) setSrc(dataUrl);
            })
            .catch(() => {
                if (!cancelled) setSrc(null);
            });

        return () => {
            cancelled = true;
        };
    }, [value]);

    return (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white">
            {src ? (
                <img
                    src={src}
                    alt={value}
                    className="aspect-square h-full max-h-full max-w-full object-contain"
                />
            ) : null}
        </div>
    );
}
