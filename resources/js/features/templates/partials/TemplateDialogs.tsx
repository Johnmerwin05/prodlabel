import {
    CopyIcon,
    EyeIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PrinterIcon,
    Trash2Icon,
    Undo2Icon,
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { TemplatePreview } from "./TemplatePreview";
import {
    type ConfirmTemplateAction,
    type Template,
    TemplatePresenter,
} from "./template.model";

export function TemplateActions({
    template,
    onEdit,
    onDuplicate,
    onPreview,
    onConfirm,
}: {
    template: Template;
    onEdit: () => void;
    onDuplicate: () => void;
    onPreview: () => void;
    onConfirm: (action: ConfirmTemplateAction) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open actions for ${template.name}`}
                >
                    <MoreHorizontalIcon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                {!template.deleted_at ? (
                    <>
                        <DropdownMenuItem onClick={onEdit}>
                            <PencilIcon className="size-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onPreview}>
                            <EyeIcon className="size-4" />
                            Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDuplicate}>
                            <CopyIcon className="size-4" />
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                                onConfirm(
                                    TemplatePresenter.buildConfirm(
                                        "delete",
                                        template,
                                    ),
                                )
                            }
                        >
                            <Trash2Icon className="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem
                        onClick={() =>
                            onConfirm(
                                TemplatePresenter.buildConfirm(
                                    "restore",
                                    template,
                                ),
                            )
                        }
                    >
                        <Undo2Icon className="size-4" />
                        Restore
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function ConfirmTemplateActionDialog({
    action,
    isSaving,
    onOpenChange,
    onConfirm,
}: {
    action: ConfirmTemplateAction | null;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <AlertDialog open={Boolean(action)} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{action?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {action?.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSaving}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant={
                            action?.destructive ? "destructive" : "default"
                        }
                        disabled={isSaving}
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                    >
                        {isSaving ? "Working..." : action?.confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function TemplatePreviewDialog({
    template,
    open,
    onOpenChange,
}: {
    template: Template | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{template?.name ?? "Template Preview"}</DialogTitle>
                    <DialogDescription>
                        Real-time layout preview using the saved template
                        settings and elements.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[70vh] rounded-md border bg-muted/30 p-6">
                    {template ? (
                        <div className="flex min-h-full min-w-max items-start justify-center">
                            <TemplatePreview
                                settings={{
                                    ...TemplatePresenter.normalizeSettings(
                                        template.settings,
                                    ),
                                    zoom: 1,
                                }}
                                elements={template.elements ?? []}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => window.print()}>
                        <PrinterIcon className="size-4" />
                        Print Preview
                    </Button>
                    <Button onClick={() => window.print()}>Export to PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
