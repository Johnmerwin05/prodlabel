import * as React from "react";
import { CheckIcon } from "lucide-react";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
    label: string;
    value: string;
    icon?: React.ReactNode;
};

type MultiSelectRenderProps = {
    selectedValues: Set<string>;
    selectedOptions: MultiSelectOption[];
};

type MultiSelectProps = {
    options: MultiSelectOption[];
    values: string[];
    onValuesChange: (values: string[]) => void;
    children: (props: MultiSelectRenderProps) => React.ReactNode;
    searchPlaceholder?: string;
    emptyMessage?: string;
    clearLabel?: string;
    contentClassName?: string;
};

export function MultiSelect({
    options,
    values,
    onValuesChange,
    children,
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    clearLabel = "Clear selection",
    contentClassName,
}: MultiSelectProps) {
    const selectedValues = new Set(values);
    const selectedOptions = options.filter((option) =>
        selectedValues.has(option.value),
    );

    function toggleValue(value: string) {
        const nextValues = new Set(selectedValues);
        if (nextValues.has(value)) nextValues.delete(value);
        else nextValues.add(value);
        onValuesChange(Array.from(nextValues));
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                {children({ selectedValues, selectedOptions })}
            </PopoverTrigger>
            <PopoverContent
                className={cn("w-52 p-0", contentClassName)}
                align="start"
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(
                                    option.value,
                                );

                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={`${option.label} ${option.value}`}
                                        onSelect={() =>
                                            toggleValue(option.value)
                                        }
                                    >
                                        <span
                                            className={cn(
                                                "flex size-4 items-center justify-center rounded-sm border",
                                                isSelected &&
                                                    "border-primary bg-primary text-primary-foreground",
                                            )}
                                        >
                                            {isSelected ? (
                                                <CheckIcon className="size-3" />
                                            ) : null}
                                        </span>
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 ? (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        className="justify-center text-center"
                                        onSelect={() => onValuesChange([])}
                                    >
                                        {clearLabel}
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        ) : null}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
