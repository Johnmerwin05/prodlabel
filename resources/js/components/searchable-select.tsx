import * as React from "react";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchableSelectOption<TValue extends string = string> = {
    label: string;
    value: TValue;
    icon?: React.ReactNode;
    description?: string;
};

type SearchableSelectProps<TValue extends string = string> = {
    value?: TValue;
    options: Array<SearchableSelectOption<TValue>>;
    onValueChange: (value: TValue) => void;
    onClear?: () => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    error?: boolean;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
    batchSize?: number;
};

export function SearchableSelect<TValue extends string = string>({
    value,
    options,
    onValueChange,
    onClear,
    placeholder = "Select option",
    searchPlaceholder = "Search...",
    emptyMessage = "No options found.",
    error,
    disabled,
    className,
    contentClassName,
    batchSize,
}: SearchableSelectProps<TValue>) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [visibleCount, setVisibleCount] = React.useState(batchSize ?? options.length);
    const selectedOption = options.find((option) => option.value === value);
    const canClear = Boolean(onClear && selectedOption && !disabled);
    const filteredOptions = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return options;

        return options.filter((option) =>
            `${option.label} ${option.description ?? ""}`
                .toLowerCase()
                .includes(query),
        );
    }, [options, search]);
    const visibleOptions = batchSize
        ? filteredOptions.slice(0, visibleCount)
        : filteredOptions;

    React.useEffect(() => {
        setVisibleCount(batchSize ?? options.length);
    }, [batchSize, options.length, search]);

    function handleListWheel(event: React.WheelEvent<HTMLDivElement>) {
        const list = event.currentTarget;
        const canScroll = list.scrollHeight > list.clientHeight;
        if (!canScroll) return;

        const isScrollingUp = event.deltaY < 0;
        const isScrollingDown = event.deltaY > 0;
        const isAtTop = list.scrollTop <= 0;
        const isAtBottom =
            list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
        const shouldScrollList =
            (isScrollingUp && !isAtTop) ||
            (isScrollingDown && !isAtBottom);

        if (!shouldScrollList) return;

        event.preventDefault();
        event.stopPropagation();
        list.scrollTop += event.deltaY;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-invalid={error}
                    disabled={disabled}
                    className={cn(
                        "h-10 w-full justify-between rounded-lg px-2.5 font-normal",
                        !selectedOption && "text-muted-foreground",
                        error &&
                            "border-destructive ring-3 ring-destructive/20",
                        className,
                    )}
                >
                    <span className="flex min-w-0 items-center gap-2">
                        {selectedOption?.icon}
                        <span className="truncate">
                            {selectedOption?.label ?? placeholder}
                        </span>
                    </span>
                    <span className="ml-2 flex shrink-0 items-center gap-1">
                        {canClear ? (
                            <span
                                role="button"
                                tabIndex={0}
                                aria-label="Clear selection"
                                className="rounded-sm p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onClear?.();
                                }}
                                onKeyDown={(event) => {
                                    if (
                                        event.key !== "Enter" &&
                                        event.key !== " "
                                    ) {
                                        return;
                                    }

                                    event.preventDefault();
                                    event.stopPropagation();
                                    onClear?.();
                                }}
                            >
                                <XIcon className="size-3.5" />
                            </span>
                        ) : null}
                        <ChevronsUpDownIcon className="size-4 opacity-50" />
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className={cn(
                    "w-(--radix-popover-trigger-width) p-0",
                    contentClassName,
                )}
            >
                <Command>
                    <CommandInput
                        value={search}
                        onValueChange={setSearch}
                        placeholder={searchPlaceholder}
                    />
                    <CommandList onWheelCapture={handleListWheel}>
                        {filteredOptions.length === 0 ? (
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                        ) : null}
                        <CommandGroup>
                            {visibleOptions.map((option) => {
                                const isSelected = option.value === value;

                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        data-checked={isSelected}
                                        onSelect={() => {
                                            onValueChange(option.value);
                                            setOpen(false);
                                        }}
                                    >
                                        {option.icon}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate">
                                                {option.label}
                                            </span>
                                            {option.description ? (
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            ) : null}
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {batchSize && visibleCount < filteredOptions.length ? (
                            <button
                                type="button"
                                className="w-full rounded-sm px-2 py-2 text-center text-sm font-medium text-primary hover:bg-muted"
                                onClick={() =>
                                    setVisibleCount((count) =>
                                        Math.min(
                                            count + batchSize,
                                            filteredOptions.length,
                                        ),
                                    )
                                }
                            >
                                Show more ({filteredOptions.length - visibleCount} remaining)
                            </button>
                        ) : null}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
