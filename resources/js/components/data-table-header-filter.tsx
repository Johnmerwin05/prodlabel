import * as React from "react";
import { ChevronsUpDownIcon } from "lucide-react";

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

export type DataTableHeaderFilterOption = {
    label: string;
    value: string;
    description?: string;
};

type BaseProps = {
    label: string;
    options: DataTableHeaderFilterOption[];
    allLabel?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    className?: string;
    batchSize?: number;
};

export function DataTableHeaderFilter({
    label,
    options,
    value,
    onValueChange,
    allLabel = `All ${label.toLowerCase()}`,
    searchable = false,
    searchPlaceholder = `Search ${label.toLowerCase()}...`,
    className,
    batchSize,
}: BaseProps & {
    value: string;
    onValueChange: (value: string) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [visibleCount, setVisibleCount] = React.useState(
        batchSize ?? options.length,
    );
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

    React.useEffect(() => {
        if (!open) setSearch("");
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <HeaderTrigger label={label} active={value !== "all" && value !== ""} />
            <PopoverContent align="start" className={cn("w-64 p-0", className)}>
                <Command shouldFilter={false}>
                    {searchable ? (
                        <CommandInput
                            value={search}
                            onValueChange={setSearch}
                            placeholder={searchPlaceholder}
                        />
                    ) : null}
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                value={allLabel}
                                data-checked={value === "all" || value === ""}
                                onSelect={() => {
                                    onValueChange("all");
                                    setOpen(false);
                                }}
                            >
                                {allLabel}
                            </CommandItem>
                            {visibleOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.description ?? ""}`}
                                    data-checked={value === option.value}
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <OptionLabel option={option} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        {filteredOptions.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No options found.
                            </p>
                        ) : null}
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

export function DataTableHeaderMultiFilter({
    label,
    options,
    values,
    onValuesChange,
    allLabel = `All ${label.toLowerCase()}`,
    searchable = false,
    searchPlaceholder = `Search ${label.toLowerCase()}...`,
    className,
}: BaseProps & {
    values: string[];
    onValuesChange: (values: string[]) => void;
}) {
    return (
        <Popover>
            <HeaderTrigger label={label} active={values.length > 0} />
            <PopoverContent align="start" className={cn("w-64 p-0", className)}>
                <Command>
                    {searchable ? <CommandInput placeholder={searchPlaceholder} /> : null}
                    <CommandList>
                        <CommandEmpty>No options found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value={allLabel}
                                data-checked={values.length === 0}
                                onSelect={() => onValuesChange([])}
                            >
                                {allLabel}
                            </CommandItem>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.description ?? ""}`}
                                    data-checked={values.includes(option.value)}
                                    onSelect={() =>
                                        onValuesChange(
                                            values.includes(option.value)
                                                ? values.filter((value) => value !== option.value)
                                                : [...values, option.value],
                                        )
                                    }
                                >
                                    <OptionLabel option={option} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function HeaderTrigger({ label, active }: { label: string; active: boolean }) {
    return (
        <PopoverTrigger asChild>
            <button
                type="button"
                className={cn(
                    "inline-flex items-center gap-1 p-0 text-left font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground",
                    active && "text-foreground",
                )}
            >
                {label}
                <ChevronsUpDownIcon className="size-3.5" />
            </button>
        </PopoverTrigger>
    );
}

function OptionLabel({ option }: { option: DataTableHeaderFilterOption }) {
    return (
        <span className="min-w-0 flex-1">
            <span className="block truncate">{option.label}</span>
            {option.description ? (
                <span className="block truncate text-xs text-muted-foreground">
                    {option.description}
                </span>
            ) : null}
        </span>
    );
}
