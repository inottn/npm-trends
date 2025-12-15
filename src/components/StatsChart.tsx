import clsx from "clsx";
import { PieChart as PieIcon, BarChart2 } from "lucide-react";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import type { Translation } from "../services/i18n";
import type { RangeResult } from "../types";

interface StatsChartProps {
  data: RangeResult[];
  translations: Translation;
  theme: "light" | "dark";
}

// Swiss Palette: Black, Blue, Red, Yellow, Gray
const COLORS = ["#171717", "#2563eb", "#dc2626", "#ca8a04", "#4b5563", "#9333ea"];
// Dark mode adjustments if needed for bar colors could happen here, but standard palette often works well on dark too.
// Let's stick to same colors but maybe adjust the black to white for visibility if needed, but #171717 is barely visible on black.
// Let's modify the first color for dark mode in render logic.

const StatsChart: React.FC<StatsChartProps> = ({ data, translations: t, theme }) => {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  if (data.length === 0) return null;

  // Prepare data with combined labels for the chart
  const chartData = data.map((d) => ({
    ...d,
    fullLabel: `${d.packageName} ${d.rangeLabel}`,
  }));

  const isDark = theme === "dark";
  const axisColor = isDark ? "#e5e5e5" : "#000000";
  const gridColor = isDark ? "#404040" : "#e5e7eb";
  const tickColor = isDark ? "#a3a3a3" : "#6b7280";
  const tooltipBg = isDark ? "#000" : "#fff";
  const tooltipBorder = isDark ? "#404040" : "#000";
  const tooltipText = isDark ? "#fff" : "#000";

  // Adjust palette for dark mode visibility (replace black with white or light gray)
  const PALETTE = [...COLORS];
  if (isDark) {
    PALETTE[0] = "#f5f5f5"; // Replace dark black with off-white for first item
    PALETTE[4] = "#9ca3af"; // Lighten gray
  }

  // Improved focus class: ensures no ring on click (focus:ring-0), only on keyboard (focus-visible)
  const focusClass =
    "outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 rounded-sm";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 transition-colors duration-300">
          {t.chartTitle}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType("bar")}
            className={clsx(
              "p-2 border transition-colors duration-300 focus-visible:z-10",
              focusClass,
              chartType === "bar"
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500",
            )}
            title="Bar Chart"
          >
            <BarChart2 size={14} />
          </button>
          <button
            onClick={() => setChartType("pie")}
            className={clsx(
              "p-2 border transition-colors duration-300 focus-visible:z-10",
              focusClass,
              chartType === "pie"
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500",
            )}
            title="Pie Chart"
          >
            <PieIcon size={14} />
          </button>
        </div>
      </div>

      <div
        className={clsx("w-full h-[320px]", focusClass)}
        tabIndex={0}
        aria-label="Chart area. Use arrow keys to explore if supported, or view data table below."
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="fullLabel"
                tick={{
                  fill: axisColor,
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "Inter",
                }}
                axisLine={{ stroke: axisColor }}
                tickLine={false}
                interval={0}
                dy={10}
              />
              <YAxis
                tick={{
                  fill: tickColor,
                  fontSize: 10,
                  fontWeight: 500,
                  fontFamily: "Inter",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                dx={-10}
              />
              <Tooltip
                cursor={{ fill: isDark ? "#262626" : "#f3f4f6" }}
                contentStyle={{
                  borderRadius: "0px",
                  border: `1px solid ${tooltipBorder}`,
                  boxShadow: "none",
                  padding: "8px 12px",
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: tooltipBg,
                }}
                itemStyle={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: tooltipText,
                }}
                labelStyle={{
                  fontSize: "10px",
                  color: tickColor,
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
                formatter={(value: number) => [
                  new Intl.NumberFormat().format(value),
                  t.chartDownloads,
                ]}
              />
              <Bar dataKey="totalDownloads" maxBarSize={50}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={100}
                dataKey="totalDownloads"
                nameKey="fullLabel"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PALETTE[index % PALETTE.length]}
                    stroke={isDark ? "#171717" : "white"}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "0px",
                  border: `1px solid ${tooltipBorder}`,
                  boxShadow: "none",
                  padding: "8px 12px",
                  backgroundColor: tooltipBg,
                }}
                itemStyle={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: tooltipText,
                }}
                formatter={(value: number) => [
                  new Intl.NumberFormat().format(value),
                  t.chartDownloads,
                ]}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{
                  fontSize: "11px",
                  color: axisColor,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
                iconType="square"
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;
