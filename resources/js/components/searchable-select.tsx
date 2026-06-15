import * as React from "react";
import { ChevronsUpDownIcon } from "lucide-react";

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
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    error?: boolean;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
};

export function SearchableSelect<TValue extends string = string>({
    value,
    options,
    onValueChange,
    placeholder = "Select option",
    searchPlaceholder = "Search...",
    emptyMessage = "No options found.",
    error,
    disabled,
    className,
    contentClassName,
}: SearchableSelectProps<TValue>) {
    const [open, setOpen] = React.useState(false);
    const selectedOption = options.find((option) => option.value === value);

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
                    <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
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
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
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
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
