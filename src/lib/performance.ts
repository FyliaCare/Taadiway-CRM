/**
 * Performance Monitoring Utilities
 * Tracks and reports application performance metrics
 */

export interface PerformanceMetrics {
    name: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics[] = [];
    private readonly MAX_METRICS = 1000;

    /**
     * Mark the start of a performance measurement
     */
    mark(name: string): void {
        if (typeof window === 'undefined') return;
        performance.mark(name);
    }

    /**
     * Measure the time between two marks
     */
    measure(name: string, startMark: string, endMark?: string): number | null {
        if (typeof window === 'undefined') return null;

        try {
            const endMarkName = endMark || `${startMark}-end`;
            performance.mark(endMarkName);

            const measure = performance.measure(name, startMark, endMarkName);
            const value = measure.duration;

            this.recordMetric({
                name,
                value,
                timestamp: Date.now(),
            });

            // Clean up marks
            performance.clearMarks(startMark);
            if (endMark) performance.clearMarks(endMark);
            performance.clearMeasures(name);

            return value;
        } catch (error) {
            console.error('Performance measurement error:', error);
            return null;
        }
    }

    /**
     * Record a custom metric
     */
    recordMetric(metric: PerformanceMetrics): void {
        this.metrics.push(metric);

        // Keep only recent metrics
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms`, metric.metadata);
        }
    }

    /**
     * Get Web Vitals metrics
     */
    reportWebVitals(metric: any): void {
        const { name, value, id } = metric;

        this.recordMetric({
            name: `web-vital-${name}`,
            value,
            timestamp: Date.now(),
            metadata: { id },
        });

        // Send to analytics in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to your analytics service
            // Example: gtag('event', name, { value: Math.round(value), metric_id: id });
        }
    }

    /**
     * Get all recorded metrics
     */
    getMetrics(): PerformanceMetrics[] {
        return [...this.metrics];
    }

    /**
     * Get average value for a specific metric name
     */
    getAverageMetric(name: string): number | null {
        const relevantMetrics = this.metrics.filter(m => m.name === name);
        if (relevantMetrics.length === 0) return null;

        const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
        return sum / relevantMetrics.length;
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.metrics = [];
    }

    /**
     * Track API call performance
     */
    async trackAPICall<T>(
        name: string,
        apiCall: () => Promise<T>
    ): Promise<T> {
        const startMark = `api-${name}-start`;
        this.mark(startMark);

        try {
            const result = await apiCall();
            this.measure(`api-${name}`, startMark);
            return result;
        } catch (error) {
            this.measure(`api-${name}-error`, startMark);
            throw error;
        }
    }

    /**
     * Track component render time
     */
    trackRender(componentName: string, renderTime: number): void {
        this.recordMetric({
            name: `render-${componentName}`,
            value: renderTime,
            timestamp: Date.now(),
        });
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance tracking
 */
export function usePerformanceTracking(componentName: string) {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();

    return () => {
        const renderTime = performance.now() - startTime;
        performanceMonitor.trackRender(componentName, renderTime);
    };
}

/**
 * Higher-order function to track async function performance
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
    name: string,
    fn: T
): T {
    return (async (...args: any[]) => {
        return performanceMonitor.trackAPICall(name, () => fn(...args));
    }) as T;
}
