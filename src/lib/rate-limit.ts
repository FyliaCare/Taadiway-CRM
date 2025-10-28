/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for API rate limiting
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private requests = new Map<string, RateLimitEntry>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(private config: RateLimitConfig) {
        // Cleanup expired entries every minute
        this.startCleanup();
    }

    /**
     * Check if request should be allowed
     */
    async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
        const key = this.config.keyGenerator?.(identifier) ?? identifier;
        const now = Date.now();

        let entry = this.requests.get(key);

        // Create new entry or reset if window expired
        if (!entry || now >= entry.resetAt) {
            entry = {
                count: 0,
                resetAt: now + this.config.windowMs,
            };
            this.requests.set(key, entry);
        }

        // Increment request count
        entry.count++;

        const allowed = entry.count <= this.config.maxRequests;
        const remaining = Math.max(0, this.config.maxRequests - entry.count);

        return {
            allowed,
            remaining,
            resetAt: entry.resetAt,
        };
    }

    /**
     * Reset limit for a specific identifier
     */
    reset(identifier: string): void {
        const key = this.config.keyGenerator?.(identifier) ?? identifier;
        this.requests.delete(key);
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
            if (now >= entry.resetAt) {
                this.requests.delete(key);
            }
        }
    }

    /**
     * Start periodic cleanup
     */
    private startCleanup(): void {
        if (this.cleanupInterval) return;

        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // Cleanup every minute

        // Prevent the interval from keeping the process alive
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Stop cleanup interval
     */
    stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Create rate limiters for different use cases
export const apiRateLimiter = new RateLimiter({
    maxRequests: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
});

export const authRateLimiter = new RateLimiter({
    maxRequests: 5, // 5 attempts
    windowMs: 15 * 60 * 1000, // per 15 minutes
});

export const publicApiRateLimiter = new RateLimiter({
    maxRequests: 30, // 30 requests
    windowMs: 60 * 1000, // per minute
});

/**
 * Middleware helper for rate limiting
 */
export async function rateLimit(
    identifier: string,
    limiter: RateLimiter = apiRateLimiter
): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const result = await limiter.checkLimit(identifier);

    return {
        success: result.allowed,
        limit: limiter['config'].maxRequests,
        remaining: result.remaining,
        reset: result.resetAt,
    };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req: Request): string {
    // Try to get user ID from session/auth
    // Fallback to IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
}
