"use client";

import { useState, useEffect, memo } from "react";
import { 
  DollarSign, 
  Store, 
  Truck, 
  Package,
  LucideIcon 
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Store,
  Truck,
  Package,
};

interface PremiumKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  description?: string;
  trend?: string;
  trendUp?: boolean;
  icon: string; // Changed from LucideIcon to string
  gradient: string;
  delay?: number;
}

export function PremiumKPICard({
  title,
  value,
  subtitle,
  description,
  trend,
  trendUp,
  icon: iconName,
  gradient,
  delay = 0,
}: PremiumKPICardProps) {
  const [mounted, setMounted] = useState(false);
  const [animatedValue, setAnimatedValue] = useState("0");

  const Icon = iconMap[iconName] || DollarSign; // Get icon from map

  useEffect(() => {
    setMounted(true);
    
    // Animate number counting
    const timeout = setTimeout(() => {
      setAnimatedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  if (!mounted) {
    return (
      <div className="h-[160px] animate-pulse rounded-2xl bg-gray-100" />
    );
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-200/30"
      style={{
        animation: `slideInLeft 0.6s ease-out ${delay}ms both`,
      }}
    >
      {/* Gradient Background */}
      <div
        className={`absolute rit-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20`}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-lg`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                trendUp
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {trend}
            </div>
          )}
        </div>

        {/* Title */}
        <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>

        {/* Description */}
        {description && (
          <p className="mb-2 text-xs text-gray-500">{description}</p>
        )}

        {/* Value with counting animation */}
        <h3
          className="mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent transition-all duration-1000"
        >
          {animatedValue}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>

      {/* Bottom Accent */}
      <div
        className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${gradient} transition-all duration-500 group-hover:w-full`}
      />

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `
      }} />
    </div>
  );
}

// Export memoized version for better performance
export default memo(PremiumKPICard);