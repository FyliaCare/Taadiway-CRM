"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, MoreVertical } from "lucide-react";

interface AnimatedChartCardProps {
  title: string;
  value: string;
  change: string;
  changePositive: boolean;
  data: number[];
  labels: string[];
  icon?: string;
  gradient: string;
}

export function AnimatedChartCard({
  title,
  value,
  change,
  changePositive,
  data,
  labels,
  icon,
  gradient,
}: AnimatedChartCardProps) {
  const [mounted, setMounted] = useState(false);
  const [animatedData, setAnimatedData] = useState<number[]>(data.map(() => 0));

  useEffect(() => {
    setMounted(true);
    
    // Animate bars growing
    const timeout = setTimeout(() => {
      setAnimatedData(data);
    }, 200);

    return () => clearTimeout(timeout);
  }, [data]);

  const maxValue = Math.max(...data, 1); // Ensure minimum value of 1 to prevent division by zero

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl">
      {/* Background Gradient */}
      <div
        className={`absolute rit-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-5 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10`}
      />

      {/* Header */}
      <div className="relative z-10 mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {icon && <span className="text-lg">{icon}</span>}
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <div
            className={`mt-1 flex items-center gap-1 text-sm font-medium ${
              changePositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {changePositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{change}</span>
          </div>
        </div>
        <button className="text-gray-400 transition-colors hover:text-gray-600">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Animated Bar Chart */}
      <div className="relative z-10">
        <div className="flex h-32 items-end gap-2">
          {animatedData.map((value, index) => (
            <div
              key={index}
              className="group/bar relative flex-1"
            >
              <div
                className={`relative overflow-hidden rounded-t-lg bg-gradient-to-t ${gradient} transition-all duration-1000 ease-out hover:opacity-80`}
                style={{
                  height: mounted ? `${(value / maxValue) * 100}%` : "0%",
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Labels */}
        <div className="mt-2 flex justify-between text-[10px] text-gray-500">
          {labels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      </div>

      {/* Bottom Accent */}
      <div
        className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${gradient} transition-all duration-500 group-hover:w-full`}
      />

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `
      }} />
    </div>
  );
}


