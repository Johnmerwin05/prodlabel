import {
    addMonths,
    format,
    getMonth,
    getYear,
    parseISO,
    setMonth,
    setYear,
} from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SearchableSelect } from "@/components/searchable-select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

type DatePickerProps = {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
}: DatePickerProps) {
    const selectedDate = value ? parseISO(value) : undefined;
    const baseDate = selectedDate ?? new Date();
    const [open, setOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(baseDate);

    const monthOptions = useMemo(
        () =>
            MONTHS.map((month, index) => ({
                label: month,
                value: String(index),
            })),
        [],
    );
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 101 }, (_, index) => {
            const year = currentYear - 80 + index;

            return {
                label: String(year),
                value: String(year),
            };
        });
    }, []);

    useEffect(() => {
        setCurrentMonth(baseDate);
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    const goToPreviousMonth = () => {
        setCurrentMonth((current) => addMonths(current, -1));
    };

    const goToNextMonth = () => {
        setCurrentMonth((current) => addMonths(current, 1));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "h-10 w-full justify-between rounded-lg px-3 text-left font-normal",
                        !value && "text-muted-foreground",
                        className,
                    )}
                >
                    <span className="truncate">
                        {selectedDate
                            ? format(selectedDate, "PPP")
                            : placeholder}
                    </span>
                    <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={6}
                className="w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover p-0 text-popover-foreground shadow-lg"
            >
                <div className="border-b bg-muted/20 p-3">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={goToPreviousMonth}
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <SearchableSelect
                                value={String(getMonth(currentMonth))}
                                options={monthOptions}
                                placeholder="Month"
                                searchPlaceholder="Search month..."
                                contentClassName="z-[60] w-full"
                                onValueChange={(monthValue) =>
                                    setCurrentMonth((current) =>
                                        setMonth(current, Number(monthValue)),
                                    )
                                }
                            />

                            <SearchableSelect
                                value={String(getYear(currentMonth))}
                                options={yearOptions}
                                placeholder="Year"
                                searchPlaceholder="Search year..."
                                contentClassName="z-[60] w-full"
                                onValueChange={(yearValue) =>
                                    setCurrentMonth((current) =>
                                        setYear(current, Number(yearValue)),
                                    )
                                }
                            />
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={goToNextMonth}
                            aria-label="Next month"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>

                <Calendar
                    className="mx-auto bg-transparent p-3 [--cell-size:2.5rem]"
                    classNames={{
                        day: "flex size-10 items-center justify-center p-0",
                        month: "flex w-full max-w-[18.5rem] flex-col gap-3",
                        month_caption: "hidden",
                        months: "flex justify-center",
                        nav: "hidden",
                        week: "mt-1 grid w-full grid-cols-7",
                        weekday:
                            "flex h-8 items-center justify-center text-sm font-normal text-muted-foreground",
                        weekdays: "grid w-full grid-cols-7",
                    }}
                    mode="single"
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    selected={selectedDate}
                    onSelect={(date) => {
                        onChange(date ? format(date, "yyyy-MM-dd") : "");
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
