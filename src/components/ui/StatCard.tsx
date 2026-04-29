import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
};

export function StatCard({ label, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                trend.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {trend.positive ? '+' : '-'}{trend.value}
              </span>
              <span className="text-xs text-slate-400 font-medium">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={cn("p-3 rounded-xl border", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
