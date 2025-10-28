"use client";

import { useEffect, useState } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        let touchStartY = 0;
        let touchMoveY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                touchStartY = e.touches[0].clientY;
                setStartY(touchStartY);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (window.scrollY === 0 && !isRefreshing) {
                touchMoveY = e.touches[0].clientY;
                const distance = touchMoveY - touchStartY;

                if (distance > 0) {
                    setPullDistance(Math.min(distance, 150));
                    // Add resistance
                    if (distance > 80) {
                        e.preventDefault();
                    }
                }
            }
        };

        const handleTouchEnd = async () => {
            if (pullDistance > 80 && !isRefreshing) {
                setIsRefreshing(true);
                await onRefresh();
                setIsRefreshing(false);
            }
            setPullDistance(0);
            setStartY(0);
        };

        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [pullDistance, isRefreshing, onRefresh]);

    return { pullDistance, isRefreshing };
}

export function PullToRefreshIndicator({
    pullDistance,
    isRefreshing,
}: {
    pullDistance: number;
    isRefreshing: boolean;
}) {
    const opacity = Math.min(pullDistance / 80, 1);
    const rotation = (pullDistance / 80) * 360;

    if (pullDistance === 0 && !isRefreshing) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
                transform: `translateY(${Math.min(pullDistance, 80)}px)`,
                opacity,
                transition: pullDistance === 0 ? "transform 0.3s, opacity 0.3s" : "none",
            }}
        >
            <div className="bg-white rounded-full p-3 shadow-lg">
                {isRefreshing ? (
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg
                        className="w-6 h-6 text-blue-600"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}
