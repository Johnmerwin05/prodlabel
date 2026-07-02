import * as React from "react";

import { Input } from "@/components/ui/input";

type InputNumberProps = Omit<
    React.ComponentProps<typeof Input>,
    "type" | "value" | "defaultValue" | "onChange" | "inputMode"
> & {
    value: number | null | undefined;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number | string;
    allowDecimal?: boolean;
};

function InputNumber({
    value,
    onValueChange,
    min,
    max,
    step,
    allowDecimal,
    onBlur,
    ...props
}: InputNumberProps) {
    const decimalAllowed = allowDecimal ?? String(step ?? "").includes(".");
    const [draft, setDraft] = React.useState(valueToString(value));

    React.useEffect(() => {
        setDraft(valueToString(value));
    }, [value]);

    function commit(nextDraft: string) {
        if (nextDraft === "" || nextDraft === "." || nextDraft === "-") {
            return;
        }

        const numeric = Number(nextDraft);
        if (!Number.isFinite(numeric)) return;

        onValueChange(decimalAllowed ? numeric : Math.trunc(numeric));
    }

    function clampValue(numeric: number) {
        return Math.min(
            max ?? Number.POSITIVE_INFINITY,
            Math.max(min ?? Number.NEGATIVE_INFINITY, numeric),
        );
    }

    return (
        <Input
            {...props}
            type="text"
            inputMode={decimalAllowed ? "decimal" : "numeric"}
            value={draft}
            onChange={(event) => {
                const nextDraft = event.target.value;
                if (!isValidNumberDraft(nextDraft, decimalAllowed)) return;

                setDraft(nextDraft);
                commit(nextDraft);
            }}
            onBlur={(event) => {
                if (draft === "" || draft === "." || draft === "-") {
                    const fallback = min ?? value ?? 0;
                    setDraft(valueToString(fallback));
                    onValueChange(fallback);
                } else {
                    const numeric = Number(draft);
                    if (Number.isFinite(numeric)) {
                        const clamped = clampValue(
                            decimalAllowed ? numeric : Math.trunc(numeric),
                        );
                        setDraft(valueToString(clamped));
                        onValueChange(clamped);
                    }
                }

                onBlur?.(event);
            }}
        />
    );
}

function valueToString(value: number | null | undefined) {
    return value === null || value === undefined ? "" : String(value);
}

function isValidNumberDraft(value: string, allowDecimal: boolean) {
    if (value === "") return true;

    return allowDecimal ? /^\d*\.?\d*$/.test(value) : /^\d*$/.test(value);
}

export { InputNumber };
