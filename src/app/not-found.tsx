import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8">
                <div className="flex flex-col items-center text-center">
                    {/* 404 Icon */}
                    <div className="mb-4 rounded-full bg-blue-100 p-4">
                        <Search className="h-12 w-12 text-blue-600" />
                    </div>

                    {/* 404 Text */}
                    <h1 className="mb-2 text-6xl font-bold text-gray-900">404</h1>

                    <h2 className="mb-3 text-xl font-semibold text-gray-800">
                        Page Not Found
                    </h2>

                    <p className="mb-8 text-sm text-gray-600">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button asChild>
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Link>
                        </Button>

                        <Button asChild variant="outline">
                            <Link href="/dashboard">
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
