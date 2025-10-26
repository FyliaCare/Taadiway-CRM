'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[600px] items-center justify-center p-4">
            <Card className="w-full max-w-lg p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-red-100 p-3">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>

                    <h2 className="mb-2 text-xl font-semibold text-gray-900">
                        Dashboard Error
                    </h2>

                    <p className="mb-6 text-sm text-gray-600">
                        {error.message || 'Unable to load dashboard. Please try again.'}
                    </p>

                    {error.digest && (
                        <p className="mb-4 text-xs text-gray-500">
                            Error Reference: {error.digest}
                        </p>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={reset}>
                            Retry
                        </Button>

                        <Button
                            onClick={() => window.location.href = '/dashboard'}
                            variant="outline"
                        >
                            Refresh Dashboard
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
