// @ts-nocheck
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

import { Button, buttonVariants } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
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

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
}) {
    const selectedDate = value ? parseISO(value) : undefined;
    const baseDate = selectedDate ?? new Date();
    const [currentMonth, setCurrentMonth] = useState(baseDate);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from(
            { length: 101 },
            (_, index) => currentYear - 80 + index,
        );
    }, []);

    useEffect(() => {
        setCurrentMonth(baseDate);
    }, [value]);

    const goToPreviousMonth = () => {
        setCurrentMonth((current) => addMonths(current, -1));
    };

    const goToNextMonth = () => {
        setCurrentMonth((current) => addMonths(current, 1));
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "h-11 w-full justify-between rounded-2xl border border-slate-300/70 bg-slate-800 px-3 text-left font-normal text-white shadow-sm hover:bg-slate-700 hover:text-slate-300 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:hover:bg-white/10 dark:hover:text-white",
                        !value && "text-white/70 dark:text-white/70",
                        className,
                    )}
                >
                    <span className="truncate">
                        {value ? format(selectedDate, "PPP") : placeholder}
                    </span>
                    <CalendarIcon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={10}
                className="w-auto min-w-76 overflow-hidden rounded-[1.25rem] border border-slate-200/70 bg-white/95 p-0 text-slate-800 shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-slate-950/95 dark:text-slate-100 dark:shadow-black/40"
            >
                <div className="p-3 border-b border-slate-200/70 dark:border-white/10">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <button
                            type="button"
                            onClick={goToPreviousMonth}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-9 w-9 rounded-xl border-slate-300/70 bg-slate-800 p-0 text-slate-300 hover:bg-slate-700 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white",
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={String(getMonth(currentMonth))}
                                onValueChange={(monthValue) =>
                                    setCurrentMonth((current) =>
                                        setMonth(current, Number(monthValue)),
                                    )
                                }
                            >
                                <SelectTrigger className="h-10 rounded-xl border-slate-200/70 bg-white/90 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((month, index) => (
                                        <SelectItem
                                            key={month}
                                            value={String(index)}
                                        >
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={String(getYear(currentMonth))}
                                onValueChange={(yearValue) =>
                                    setCurrentMonth((current) =>
                                        setYear(current, Number(yearValue)),
                                    )
                                }
                            >
                                <SelectTrigger className="h-10 rounded-xl border-slate-200/70 bg-white/90 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    {years.map((year) => (
                                        <SelectItem
                                            key={year}
                                            value={String(year)}
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <button
                            type="button"
                            onClick={goToNextMonth}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-9 w-9 rounded-xl border-slate-300/70 bg-slate-800 p-0 text-slate-300 hover:bg-slate-700 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white",
                            )}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <Calendar
                    className="rounded-[1.25rem] bg-white/95 text-slate-800 dark:bg-slate-950/95 dark:text-slate-100"
                    mode="single"
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    selected={selectedDate}
                    onSelect={(date) =>
                        onChange(date ? format(date, "yyyy-MM-dd") : "")
                    }
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
