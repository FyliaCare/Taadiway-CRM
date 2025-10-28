// Optimized lazy-loaded dashboard components
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Lazy load heavy chart components with loading states
export const PremiumKPICard = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.PremiumKPICard })),
    { loading: () => <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> }
);

export const AnimatedChartCard = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.AnimatedChartCard })),
    { loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-200" /> }
);

export const StatsGrid = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.StatsGrid })),
    { loading: () => <div className="h-24 animate-pulse rounded-lg bg-gray-200" /> }
);

export const FormattedKPICard = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.FormattedKPICard })),
    { loading: () => <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> }
);

export const FormattedAnimatedChart = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.FormattedAnimatedChart })),
    { loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-200" /> }
);

export const RevenueSummaryCards = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.RevenueSummaryCards })),
    { loading: () => <div className="h-48 animate-pulse rounded-lg bg-gray-200" /> }
);

export const RecentSalesTable = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.RecentSalesTable })),
    { loading: () => <div className="h-96 animate-pulse rounded-lg bg-gray-200" /> }
);

export const RecentDeliveries = dynamic(
    () => import('@/components/dashboard').then(mod => ({ default: mod.RecentDeliveries })),
    { loading: () => <div className="h-96 animate-pulse rounded-lg bg-gray-200" /> }
);
