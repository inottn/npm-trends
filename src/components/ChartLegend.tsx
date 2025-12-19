import React from "react";
import { Legend } from "recharts";

interface ChartLegendProps {
  data: Array<{ fullLabel: string }>;
  hiddenItems: Set<string>;
  palette: string[];
  axisColor: string;
  layout?: "horizontal" | "vertical";
  onToggle: (label: string) => void;
}

const ChartLegend: React.FC<ChartLegendProps> = ({
  data,
  hiddenItems,
  palette,
  axisColor,
  layout = "horizontal",
  onToggle,
}) => {
  const isVertical = layout === "vertical";

  const legendContent = () => (
    <ul
      className={`
        flex list-none p-0 m-0 text-[11px] font-semibold uppercase overflow-y-auto
        ${
          isVertical
            ? "flex-col max-h-[280px] pr-2"
            : "flex-wrap justify-center max-h-[48px] gap-3 mt-5"
        }
      `}
    >
      {data.map((entry, index) => {
        const isHidden = hiddenItems.has(entry.fullLabel);
        return (
          <li
            key={`legend-${index}`}
            onClick={() => onToggle(entry.fullLabel)}
            className={`
              flex items-center cursor-pointer transition-opacity duration-200
              ${isHidden ? "opacity-40 line-through" : "opacity-100"}
              ${isVertical ? "mb-2" : ""}
            `}
          >
            <span
              className={`inline-block w-3 h-3 ${isVertical ? "mr-2" : "mr-1.5"}`}
              style={{
                backgroundColor: palette[index % palette.length],
                opacity: isHidden ? 0.4 : 1,
              }}
            />
            <span style={{ color: axisColor }}>{entry.fullLabel}</span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <Legend
      layout={isVertical ? "vertical" : "horizontal"}
      verticalAlign={isVertical ? "middle" : undefined}
      align={isVertical ? "right" : undefined}
      content={legendContent}
    />
  );
};

export default ChartLegend;
