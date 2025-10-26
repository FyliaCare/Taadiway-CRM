"use client";

import { AnimatedChartCard } from "./AnimatedChartCard";
import { usePreferences, CURRENCIES } from "@/lib/preferences-context";

interface FormattedAnimatedChartProps {
    title: string;
    amount?: number; // Optional raw numeric value for currency
    value?: string; // Or direct string value for non-currency
    change: string;
    changePositive: boolean;
    data: number[];
    labels: string[];
    icon: string;
    gradient: string;
    format?: 'currency' | 'compact-currency' | 'none';
}

export function FormattedAnimatedChart({
    amount,
    value,
    format = 'none',
    ...props
}: FormattedAnimatedChartProps) {
    const { formatCurrency, preferences } = usePreferences();

    let formattedValue: string;

    if (format === 'currency' && amount !== undefined) {
        formattedValue = formatCurrency(amount);
    } else if (format === 'compact-currency' && amount !== undefined) {
        // Format as compact currency (e.g., $25.5k instead of $25,500)
        const currency = CURRENCIES[preferences.currency];
        const symbol = currency?.symbol || 'GH₵';

        if (amount >= 1000000) {
            const compactAmount = (amount / 1000000).toFixed(1);
            formattedValue = `${symbol}${compactAmount}M`;
        } else if (amount >= 1000) {
            const compactAmount = (amount / 1000).toFixed(1);
            formattedValue = `${symbol}${compactAmount}k`;
        } else {
            formattedValue = formatCurrency(amount);
        }
    } else {
        formattedValue = value || '0';
    }

    return <AnimatedChartCard {...props} value={formattedValue} />;
}