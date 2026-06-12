"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { TARGET_DAILY } from "@/lib/carbonData";

interface DailyData {
  date: string;
  total: number;
  byCategory: {
    Transport: number;
    Food: number;
    Energy: number;
    Shopping: number;
  };
}

interface EmissionsChartProps {
  data: DailyData[];
}

export default function EmissionsChart({ data = [] }: EmissionsChartProps) {
  // Flatten data for Recharts
  const chartData = data.map((d) => ({
    name: d.date,
    Transport: d.byCategory?.Transport || 0,
    Food: d.byCategory?.Food || 0,
    Energy: d.byCategory?.Energy || 0,
    Shopping: d.byCategory?.Shopping || 0,
  }));

  return (
    <div className="glass-panel rounded-2xl border border-outline-variant/30 p-6 shadow-xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          Weekly Emissions (Last 7 Days)
        </h3>
        <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
          <span>Target line: {TARGET_DAILY} kg</span>
        </div>
      </div>

      <div className="w-full" style={{ height: "240px" }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit="kg"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#d7e3fc",
                fontSize: "12px",
              }}
            />
            <ReferenceLine
              y={TARGET_DAILY}
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Bar dataKey="Transport" stackId="emissions" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Food" stackId="emissions" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Energy" stackId="emissions" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Shopping" stackId="emissions" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Row */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          <span className="text-on-surface-variant">Transport</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
          <span className="text-on-surface-variant">Food</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span className="text-on-surface-variant">Energy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
          <span className="text-on-surface-variant">Shopping</span>
        </div>
      </div>
    </div>
  );
}
