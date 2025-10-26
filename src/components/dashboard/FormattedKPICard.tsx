"use client";

import { PremiumKPICard } from "./PremiumKPICard";
import { usePreferences, CURRENCIES } from "@/lib/preferences-context";

interface FormattedKPICardProps {
    title: string;
    amount: number; // Raw numeric value
    subtitle?: string;
    subtitleAmount?: number; // Optional amount for subtitle formatting
    description?: string;
    trend?: string;
    trendUp?: boolean;
    icon: string;
    gradient: string;
    delay?: number;
    format?: 'currency' | 'number' | 'compact-currency'; // How to format the amount
}

export function FormattedKPICard({
    amount,
    format = 'number',
    subtitle,
    subtitleAmount,
    ...props
}: FormattedKPICardProps) {
    const { formatCurrency, preferences } = usePreferences();

    let formattedValue: string;
    let formattedSubtitle = subtitle;

    switch (format) {
        case 'currency':
            formattedValue = formatCurrency(amount);
            if (subtitleAmount !== undefined) {
                formattedSubtitle = `${formatCurrency(subtitleAmount)} this month`;
            }
            break;
        case 'compact-currency':
            // Format as compact currency (e.g., $25.5k instead of $25,500)
            const currency = CURRENCIES[preferences.currency];
            const symbol = currency?.symbol || 'GH₵';

            if (amount >= 1000000) {
                const value = (amount / 1000000).toFixed(1);
                formattedValue = `${symbol}${value}M`;
            } else if (amount >= 1000) {
                const value = (amount / 1000).toFixed(1);
                formattedValue = `${symbol}${value}k`;
            } else {
                formattedValue = formatCurrency(amount);
            }

            if (subtitleAmount !== undefined) {
                formattedSubtitle = `${formatCurrency(subtitleAmount)} this month`;
            }
            break;
        case 'number':
        default:
            formattedValue = amount.toLocaleString();
            break;
    }

    return <PremiumKPICard {...props} value={formattedValue} subtitle={formattedSubtitle} />;
}