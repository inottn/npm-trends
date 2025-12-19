import React from "react";
import { Tooltip } from "recharts";

interface ChartTooltipProps {
  isDark: boolean;
  formatter: (value: number) => [string, string];
  showCursor?: boolean;
  showLabel?: boolean;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  isDark,
  formatter,
  showCursor = false,
  showLabel = false,
}) => {
  const tooltipBg = isDark ? "#000" : "#fff";
  const tooltipBorder = isDark ? "#404040" : "#000";
  const tooltipText = isDark ? "#fff" : "#000";
  const labelColor = isDark ? "#a3a3a3" : "#6b7280";

  const tooltipProps = {
    contentStyle: {
      borderRadius: "0px",
      border: `1px solid ${tooltipBorder}`,
      boxShadow: "none",
      padding: "8px 12px",
      fontFamily: "Inter, sans-serif",
      backgroundColor: tooltipBg,
    },
    itemStyle: {
      fontSize: "12px",
      fontWeight: 700,
      color: tooltipText,
    },
    formatter,
    ...(showCursor && { cursor: { fill: isDark ? "#262626" : "#f3f4f6" } }),
    ...(showLabel && {
      labelStyle: {
        fontSize: "10px",
        color: labelColor,
        textTransform: "uppercase" as const,
        marginBottom: "4px",
      },
    }),
  };

  return <Tooltip {...tooltipProps} />;
};

export default ChartTooltip;
