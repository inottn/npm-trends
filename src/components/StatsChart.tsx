import clsx from "clsx";
import { PieChart as PieIcon, BarChart2 } from "lucide-react";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import type { Translation } from "../services/i18n";
import type { RangeResult } from "../types";

import ChartLegend from "./ChartLegend";
import ChartTooltip from "./ChartTooltip";

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
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  if (data.length === 0) return null;

  // Prepare data with combined labels for the chart
  const chartData = data.map((d) => ({
    ...d,
    fullLabel: `${d.packageName} ${d.rangeLabel}`,
  }));

  // Filter out hidden items
  const visibleData = chartData.filter((d) => !hiddenItems.has(d.fullLabel));

  // Toggle visibility of a legend item
  const handleLegendClick = (dataKey: string) => {
    setHiddenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  const isDark = theme === "dark";
  const axisColor = isDark ? "#e5e5e5" : "#000000";
  const gridColor = isDark ? "#404040" : "#e5e7eb";
  const tickColor = isDark ? "#a3a3a3" : "#6b7280";

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
              data={visibleData}
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
                interval="preserveStart"
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
              <ChartTooltip
                isDark={isDark}
                formatter={(value: number) => [
                  new Intl.NumberFormat().format(value),
                  t.chartDownloads,
                ]}
                showCursor={true}
                showLabel={true}
              />
              <Bar dataKey="totalDownloads" maxBarSize={50}>
                {visibleData.map((entry, index) => {
                  const originalIndex = chartData.findIndex((d) => d.fullLabel === entry.fullLabel);
                  return (
                    <Cell key={`cell-${index}`} fill={PALETTE[originalIndex % PALETTE.length]} />
                  );
                })}
              </Bar>
              <Legend
                content={() => (
                  <ChartLegend
                    data={chartData}
                    hiddenItems={hiddenItems}
                    palette={PALETTE}
                    axisColor={axisColor}
                    layout="horizontal"
                    onToggle={handleLegendClick}
                  />
                )}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={visibleData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={100}
                dataKey="totalDownloads"
                nameKey="fullLabel"
              >
                {visibleData.map((entry, index) => {
                  const originalIndex = chartData.findIndex((d) => d.fullLabel === entry.fullLabel);
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={PALETTE[originalIndex % PALETTE.length]}
                      stroke={isDark ? "#171717" : "white"}
                      strokeWidth={1}
                    />
                  );
                })}
              </Pie>
              <ChartTooltip
                isDark={isDark}
                formatter={(value: number) => [
                  new Intl.NumberFormat().format(value),
                  t.chartDownloads,
                ]}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                content={() => (
                  <ChartLegend
                    data={chartData}
                    hiddenItems={hiddenItems}
                    palette={PALETTE}
                    axisColor={axisColor}
                    layout="vertical"
                    onToggle={handleLegendClick}
                  />
                )}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;
