"use client";

import { useState, useEffect } from "react";
import { Home, Package, ShoppingCart, Bell, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mobileNavItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/dashboard/inventory", icon: Package, label: "Stock" },
    { href: "/dashboard/sales", icon: ShoppingCart, label: "Sales" },
    { href: "/dashboard/notifications", icon: Bell, label: "Alerts" },
    { href: "/dashboard/settings", icon: Menu, label: "More" },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== "undefined") {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    // Scrolling down & past 100px
                    setIsVisible(false);
                } else {
                    // Scrolling up
                    setIsVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener("scroll", controlNavbar);
            return () => window.removeEventListener("scroll", controlNavbar);
        }
    }, [lastScrollY]);

    return (
        <nav
            className={cn(
                "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 transition-transform duration-300 safe-bottom",
                isVisible ? "translate-y-0" : "translate-y-full"
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex items-center justify-around px-2 py-1">
                {mobileNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center px-3 py-2 min-w-[60px] rounded-lg transition-all active:scale-95",
                                isActive
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5]")} />
                            <span className="text-xs font-medium">{item.label}</span>
                            {item.label === "Alerts" && (
                                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export function MobileHeader({ title }: { title?: string }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <>
            <header
                className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200"
                style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                    >
                        {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    <h1 className="text-lg font-semibold truncate flex-1 text-center">
                        {title || "Taadiway CRM"}
                    </h1>

                    <Link
                        href="/dashboard/settings"
                        className="p-2 -mr-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                    >
                        <User className="h-6 w-6" />
                    </Link>
                </div>

                {/* Quick Actions Bar */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
                    <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-full whitespace-nowrap active:scale-95 transition-all">
                        + New Sale
                    </button>
                    <button className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full whitespace-nowrap active:scale-95 transition-all">
                        Add Stock
                    </button>
                    <button className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full whitespace-nowrap active:scale-95 transition-all">
                        Quick Report
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setShowMenu(false)}
                >
                    <div
                        className="absolute top-0 left-0 w-4/5 max-w-sm h-full bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                        style={{ paddingTop: "env(safe-area-inset-top)" }}
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">Menu</h2>
                            {/* Add menu items here */}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
