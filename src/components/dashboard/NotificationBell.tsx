"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { Bell, CheckCircle2, X, Check, AlertCircle, Info, Package, Calendar, FileText, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICONS = {
    INFO: Info,
    SUCCESS: CheckCircle2,
    WARNING: AlertCircle,
    ERROR: AlertCircle,
    DELIVERY: Package,
    INVOICE: FileText,
    PAYMENT: DollarSign,
    CALENDAR: Calendar,
};

const NOTIFICATION_COLORS = {
    INFO: "text-blue-600 bg-blue-50",
    SUCCESS: "text-green-600 bg-green-50",
    WARNING: "text-amber-600 bg-amber-50",
    ERROR: "text-red-600 bg-red-50",
    DELIVERY: "text-purple-600 bg-purple-50",
    INVOICE: "text-indigo-600 bg-indigo-50",
    PAYMENT: "text-emerald-600 bg-emerald-50",
    CALENDAR: "text-pink-600 bg-pink-50",
};

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: notificationsData, refetch } = trpc.vendor.getNotifications.useQuery(
        { page: 1, limit: 10, unreadOnly: false },
        { refetchInterval: 30000 } // Refetch every 30 seconds
    );

    const markAsReadMutation = trpc.vendor.markNotificationRead.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    const markAllAsReadMutation = trpc.vendor.markAllNotificationsRead.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    const unreadCount = notificationsData?.pagination.unreadCount || 0;
    const notifications = notificationsData?.notifications || [];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        markAsReadMutation.mutate({ notificationId });
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getNotificationIcon = (type: string) => {
        const Icon = NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || Info;
        return Icon;
    };

    const getNotificationColor = (type: string) => {
        return NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS] || "text-gray-600 bg-gray-50";
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                            <p className="text-xs text-gray-600">
                                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs"
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">No notifications</p>
                                <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => {
                                    const isUnread = notification.status !== "READ";
                                    const Icon = getNotificationIcon(notification.type);
                                    const colorClass = getNotificationColor(notification.type);

                                    return (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                                                isUnread && "bg-blue-50/30"
                                            )}
                                            onClick={(e) => {
                                                if (isUnread) {
                                                    handleMarkAsRead(notification.id, e);
                                                }
                                            }}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className={cn("p-2 rounded-lg flex-shrink-0", colorClass)}>
                                                    <Icon className="w-5 h-5" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <h4 className={cn(
                                                            "text-sm font-semibold text-gray-900",
                                                            isUnread && "font-bold"
                                                        )}>
                                                            {notification.title}
                                                        </h4>
                                                        {isUnread && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                        {isUnread && (
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                            <a
                                href="/dashboard/notifications"
                                className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
