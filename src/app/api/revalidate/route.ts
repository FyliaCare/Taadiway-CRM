import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * API route for on-demand revalidation
 * Usage: POST /api/revalidate with { path: '/dashboard' } or { tag: 'products' }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { path, tag, secret } = body;

        // Validate secret to prevent unauthorized revalidation
        if (secret !== process.env.REVALIDATION_SECRET) {
            return NextResponse.json(
                { message: 'Invalid secret' },
                { status: 401 }
            );
        }

        // Revalidate by path
        if (path) {
            revalidatePath(path);
            return NextResponse.json({
                revalidated: true,
                path,
                timestamp: Date.now()
            });
        }

        // Revalidate by tag
        if (tag) {
            revalidateTag(tag);
            return NextResponse.json({
                revalidated: true,
                tag,
                timestamp: Date.now()
            });
        }

        return NextResponse.json(
            { message: 'Missing path or tag' },
            { status: 400 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: 'Error revalidating', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
