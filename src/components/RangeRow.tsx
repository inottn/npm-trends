import { Trash2, ArrowRight, Loader2, CheckSquare, Square } from "lucide-react";
import React, { useState, useEffect } from "react";

import type { Translation } from "../services/i18n";
import type { VersionRange } from "../types";

import { usePackageVersions } from "../hooks/useNpm";
import VersionSelect from "./VersionSelect";

interface RangeRowProps {
  range: VersionRange;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<VersionRange>) => void;
  onRemove: (id: string) => void;
  onToggleSelect: (id: string) => void;
  disabled?: boolean;
  translations: Translation;
  focusClass: string;
}

const RangeRow: React.FC<RangeRowProps> = ({
  range,
  isSelected,
  onUpdate,
  onRemove,
  onToggleSelect,
  disabled,
  translations: t,
  focusClass,
}) => {
  const [queryPkg, setQueryPkg] = useState(range.packageName);

  const handleBlur = () => {
    setQueryPkg(range.packageName);
  };

  useEffect(() => {
    if (range.packageName && !queryPkg) {
      setQueryPkg(range.packageName);
    }
  }, []);

  const { data: versions = [], isLoading } = usePackageVersions(queryPkg);

  return (
    <div
      className={`group p-4 relative transition-colors duration-300 ${
        isSelected
          ? "bg-neutral-100 dark:bg-neutral-900"
          : "bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900"
      }`}
    >
      <div className="flex gap-3">
        {/* Checkbox Column */}
        <div className="pt-1 shrink-0">
          <button
            onClick={() => !disabled && onToggleSelect(range.id)}
            disabled={disabled}
            className={`transition-colors duration-200 rounded-sm ${
              isSelected
                ? "text-black dark:text-white"
                : "text-neutral-300 dark:text-neutral-700 hover:text-neutral-500 dark:hover:text-neutral-500"
            } ${focusClass}`}
          >
            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-3 items-start">
          {/* Package Input */}
          <div className="col-span-12 mb-1">
            <div className="relative">
              <input
                type="text"
                value={range.packageName}
                onChange={(e) =>
                  onUpdate(range.id, {
                    packageName: e.target.value,
                  })
                }
                onBlur={handleBlur}
                placeholder={t.pkgInputPlaceholder}
                disabled={disabled}
                className="w-full bg-transparent border-b border-transparent focus:border-black dark:focus:border-white p-0 pb-0.5 text-sm font-bold text-black dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:ring-0 outline-none transition-colors duration-300"
              />
              {isLoading && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <Loader2 size={12} className="animate-spin text-neutral-500" />
                </div>
              )}
            </div>
          </div>

          {/* Start Version */}
          <div className="col-span-5">
            {range.isMin ? (
              <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                className={`h-8 border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider transition-colors duration-300 ${
                  disabled
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : "cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white"
                } ${focusClass}`}
                onClick={() => !disabled && onUpdate(range.id, { isMin: false })}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onUpdate(range.id, { isMin: false });
                  }
                }}
                title="Click to select version"
              >
                {t.minBadge}
              </div>
            ) : (
              <>
                <VersionSelect
                  value={range.start}
                  onChange={(val) =>
                    onUpdate(range.id, {
                      start: val,
                      isMin: false,
                    })
                  }
                  options={versions}
                  placeholder={t.startPlaceholder}
                  emptyMessage={t.noVersions}
                  disabled={disabled || versions.length === 0}
                />
                <div className="mt-1 text-right">
                  <button
                    onClick={() =>
                      onUpdate(range.id, {
                        isMin: true,
                        start: "",
                      })
                    }
                    disabled={disabled}
                    className={`text-[9px] font-semibold text-neutral-400 dark:text-neutral-500 enabled:hover:text-accent enabled:dark:hover:text-white enabled:hover:underline uppercase tracking-wider transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${focusClass}`}
                  >
                    {t.setToMin}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="col-span-1 flex justify-center pt-2 text-neutral-300 dark:text-neutral-600 transition-colors duration-300">
            <ArrowRight size={12} />
          </div>

          {/* End Version / Max */}
          <div className="col-span-5">
            {range.isMax ? (
              <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                className={`h-8 border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider transition-colors duration-300 ${
                  disabled
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : "cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white"
                } ${focusClass}`}
                onClick={() => !disabled && onUpdate(range.id, { isMax: false })}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onUpdate(range.id, { isMax: false });
                  }
                }}
                title="Click to select version"
              >
                {t.maxBadge}
              </div>
            ) : (
              <>
                <VersionSelect
                  value={range.end}
                  onChange={(val) => onUpdate(range.id, { end: val, isMax: false })}
                  options={versions}
                  placeholder={t.endPlaceholder}
                  emptyMessage={t.noVersions}
                  disabled={disabled || versions.length === 0}
                />
                <div className="mt-1 text-right">
                  <button
                    onClick={() => onUpdate(range.id, { isMax: true, end: "" })}
                    disabled={disabled}
                    className={`text-[9px] font-semibold text-neutral-400 dark:text-neutral-500 enabled:hover:text-accent enabled:dark:hover:text-white enabled:hover:underline uppercase tracking-wider transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${focusClass}`}
                  >
                    {t.setToMax}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete Button */}
          <div className="col-span-1 flex justify-end pt-1">
            <button
              onClick={() => onRemove(range.id)}
              disabled={disabled}
              className={`text-neutral-300 dark:text-neutral-600 enabled:hover:text-black enabled:dark:hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm ${focusClass}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RangeRow;
