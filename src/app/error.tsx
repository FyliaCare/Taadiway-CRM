'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-red-100 p-3">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>

                    <h1 className="mb-2 text-2xl font-bold text-gray-900">
                        Something went wrong!
                    </h1>

                    <p className="mb-6 text-sm text-gray-600">
                        {error.message || 'An unexpected error occurred. Please try again.'}
                    </p>

                    {error.digest && (
                        <p className="mb-4 text-xs text-gray-500">
                            Error ID: {error.digest}
                        </p>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={reset}
                            variant="default"
                        >
                            Try again
                        </Button>

                        <Button
                            onClick={() => window.location.href = '/'}
                            variant="outline"
                        >
                            Go home
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
