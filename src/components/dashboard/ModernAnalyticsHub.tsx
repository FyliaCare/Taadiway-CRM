"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  TrendingUp,
  Package,
  FileText,
  Megaphone,
  Briefcase,
  Clock,
  Zap,
  Activity,
  Target,
  Brain,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  stat: string;
  statLabel: string;
  change: string;
  changePositive: boolean;
}

interface ModernAnalyticsHubProps {
  stats: {
    totalSales: number;
    activeClients: number;
    totalClients: number;
    totalRevenue: number;
    totalProducts: number;
  };
}

export function ModernAnalyticsHub({ stats }: ModernAnalyticsHubProps) {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features: Feature[] = [
    {
      id: "analytics",
      title: "Revenue Analytics",
      description: "Track sales performance and revenue trends across all channels",
      icon: BarChart3,
      gradient: "from-amber-400 via-orange-400 to-amber-500",
      stat: `$${(stats.totalRevenue / 1000).toFixed(1)}k`,
      statLabel: "Total Revenue",
      change: "+12.5%",
      changePositive: true,
    },
    {
      id: "clients",
      title: "Client Management",
      description: "Manage vendors and track engagement metrics",
      icon: Users,
      gradient: "from-orange-400 via-amber-400 to-yellow-400",
      stat: stats.activeClients.toString(),
      statLabel: "Active Vendors",
      change: "+8.2%",
      changePositive: true,
    },
    {
      id: "growth",
      title: "Growth Insits",
      description: "Analyze business growth patterns and projections",
      icon: TrendingUp,
      gradient: "from-yellow-400 via-amber-400 to-orange-400",
      stat: "+23%",
      statLabel: "This Quarter",
      change: "+5.1%",
      changePositive: true,
    },
    {
      id: "inventory",
      title: "Inventory Status",
      description: "Monitor stock levels and delivery product availability",
      icon: Package,
      gradient: "from-amber-500 via-orange-400 to-amber-400",
      stat: stats.totalProducts.toString(),
      statLabel: "Total Items",
      change: "+15",
      changePositive: true,
    },
    {
      id: "reports",
      title: "Smart Reports",
      description: "Generate comprehensive delivery and sales reports",
      icon: FileText,
      gradient: "from-orange-400 via-yellow-400 to-amber-400",
      stat: "24",
      statLabel: "This Month",
      change: "+6",
      changePositive: true,
    },
    {
      id: "marketing",
      title: "Campaign Hub",
      description: "Manage marketing campaigns and vendor outreach",
      icon: Megaphone,
      gradient: "from-yellow-400 via-orange-400 to-amber-500",
      stat: "12",
      statLabel: "Active",
      change: "+3",
      changePositive: true,
    },
    {
      id: "deals",
      title: "Delivery Pipeline",
      description: "Track delivery orders and fulfillment status",
      icon: Briefcase,
      gradient: "from-amber-400 via-orange-500 to-yellow-400",
      stat: stats.totalSales.toString(),
      statLabel: "This Week",
      change: "+18.3%",
      changePositive: true,
    },
    {
      id: "automation",
      title: "AI Automation",
      description: "Smart predictions and automated workflows",
      icon: Brain,
      gradient: "from-orange-500 via-amber-400 to-orange-400",
      stat: "85%",
      statLabel: "Efficiency",
      change: "+12%",
      changePositive: true,
    },
  ];

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Analytics Hub
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Real-time insits and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 shadow-sm">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-900">Live Data</span>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isActive = activeCard === feature.id;

          return (
            <div
              key={feature.id}
              className="group relative"
              onMouseEnter={() => setActiveCard(feature.id)}
              onMouseLeave={() => setActiveCard(null)}
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Card */}
              <div
                className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-lg transition-all duration-500 ${
                  isActive
                    ? "scale-105 shadow-2xl shadow-orange-200/50"
                    : "hover:shadow-xl"
                }`}
              >
                {/* Gradient Background Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 ${
                    isActive ? "opacity-5" : "group-hover:opacity-5"
                  }`}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon & Change Badge */}
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-transform duration-500 ${
                        isActive ? "scale-110 rotate-3" : ""
                      }`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        feature.changePositive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      {feature.change}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mb-1 text-lg font-bold text-gray-900">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 text-sm text-gray-600">
                    {feature.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {feature.stat}
                      </div>
                      <div className="text-xs text-gray-500">
                        {feature.statLabel}
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 text-gray-400 transition-all duration-300 ${
                        isActive ? "translate-x-1 text-orange-500" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Bottom Accent Line */}
                <div
                  className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.gradient} transition-all duration-500 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
}

