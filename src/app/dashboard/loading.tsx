import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DashboardLoading() {
    return (
        <div className="space-y-6 p-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                </div>
            </div>

            {/* Stats grid skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                    </Card>
                ))}
            </div>

            {/* Main content skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                    <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="h-64 animate-pulse rounded bg-gray-100" />
                </Card>

                <Card className="p-6">
                    <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="h-64 animate-pulse rounded bg-gray-100" />
                </Card>
            </div>

            {/* Loading indicator */}
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-sm text-gray-600">Loading dashboard...</span>
            </div>
        </div>
    );
}
