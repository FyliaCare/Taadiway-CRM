"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  LucideIcon 
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
};

interface StatsGridProps {
  stats: Array<{
    label: string;
    value: string;
    icon: string; // Changed from LucideIcon to string
    color: string;
  }>;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.icon] || CheckCircle; // Get icon from map
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Background Glow */}
            <div
              className={`absolute inset-0 opacity-0 blur-2xl transition-opacity duration-300 ${
                isHovered ? "opacity-20" : ""
              }`}
              style={{ backgroundColor: stat.color }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-600">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>

            {/* Bottom Border Accent */}
            <div
              className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-300 group-hover:w-full"
              style={{ backgroundColor: stat.color }}
            />
          </div>
        );
      })}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
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

