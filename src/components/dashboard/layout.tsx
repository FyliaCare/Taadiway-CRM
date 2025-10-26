"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CheckSquare,
  Activity,
  Settings,
  LogOut,
  BarChart3,
  TrendingUp,
  UserCog,
  Shield,
  Truck,
  Calendar,
  FileText,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

// Admin navigation
const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Building2 },
  { name: "Sales", href: "/dashboard/sales", icon: Briefcase },
  { name: "Inventory", href: "/dashboard/inventory", icon: CheckSquare },
  { name: "Notifications", href: "/dashboard/notifications", icon: Activity },
];

// Super Admin & Admin with user management permission
const adminNavigationWithUsers = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Building2 },
  { name: "Sales", href: "/dashboard/sales", icon: Briefcase },
  { name: "Inventory", href: "/dashboard/inventory", icon: CheckSquare },
  { name: "Users", href: "/dashboard/users", icon: UserCog },
  { name: "Notifications", href: "/dashboard/notifications", icon: Activity },
];

// Vendor/Client navigation
const clientNavigation = [
  { name: "Dashboard", href: "/dashboard/client-portal", icon: LayoutDashboard },
  { name: "Delivery Requests", href: "/dashboard/delivery-requests", icon: Truck },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar, badge: "STANDARD" },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "My Products", href: "/dashboard/my-products", icon: Building2 },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Auto-Approval", href: "/dashboard/settings/auto-approval", icon: Zap, badge: "STANDARD" },
  { name: "Notifications", href: "/dashboard/notifications", icon: Activity },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Determine if user is admin or client
  const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  
  // Use navigation with Users menu if super admin or admin
  let navigation = clientNavigation;
  if (isAdmin) {
    navigation = adminNavigationWithUsers;
  } else if (isSuperAdmin) {
    navigation = adminNavigationWithUsers;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Taadiway CRM</h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const hasBadge = 'badge' in item && item.badge;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {hasBadge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          <div className="mb-2 flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{session?.user?.name || "User"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>
          
          <Link href="/dashboard/settings">
            <Button variant="ost" className="w-full justify-start" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          
          <Button
            variant="ost"
            className="w-full justify-start text-destructive hover:text-destructive"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/auth/signin", redirect: true })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with Notifications */}
        <div className="flex items-center justify-between h-16 border-b bg-card px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => pathname === item.href)?.name || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {session?.user?.name?.[0] || "U"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name || "User"}</p>
                <p className="text-xs text-gray-500">{session?.user?.role}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </div>
    </div>
  );
}
