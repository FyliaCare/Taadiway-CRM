"use client";

import { usePreferences } from "@/lib/preferences-context";

interface CurrencyDisplayProps {
    amount: number;
    className?: string;
    showSymbol?: boolean;
    compact?: boolean; // Show 10.5k instead of 10,500
}

/**
 * Universal currency display component that respects user preferences
 * Use this instead of hardcoded ₦ or GH₵ symbols
 */
export function CurrencyDisplay({
    amount,
    className = "",
    showSymbol = true,
    compact = false
}: CurrencyDisplayProps) {
    const { formatCurrency } = usePreferences();

    if (compact) {
        // Format as compact (e.g., 10.5k, 2.3M)
        const absAmount = Math.abs(amount);
        let formattedValue: number;
        let suffix: string;

        if (absAmount >= 1000000) {
            formattedValue = amount / 1000000;
            suffix = 'M';
        } else if (absAmount >= 1000) {
            formattedValue = amount / 1000;
            suffix = 'k';
        } else {
            return <span className={className}>{showSymbol ? formatCurrency(amount) : amount.toLocaleString()}</span>;
        }

        const formatted = formattedValue.toFixed(1);
        return <span className={className}>{showSymbol ? formatCurrency(parseFloat(formatted)) : formatted}{suffix}</span>;
    }

    return (
        <span className={className}>
            {showSymbol ? formatCurrency(amount) : amount.toLocaleString()}
        </span>
    );
}
