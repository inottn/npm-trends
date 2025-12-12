import { Plus, Trash2, Loader2, ChevronDown, Merge } from "lucide-react";
import React, { useState, useMemo } from "react";

import type { Translation } from "../services/i18n";
import type { VersionRange } from "../types";

import { semver } from "../services/npm";
import RangeRow from "./RangeRow";

interface RangeBuilderProps {
  ranges: VersionRange[];
  onChange: (ranges: VersionRange[]) => void;
  onQuickAdd: (
    packageName: string,
    type: "majors" | "minors",
    limit?: number | "all",
  ) => Promise<void>;
  disabled?: boolean;
  translations: Translation;
}

const RangeBuilder: React.FC<RangeBuilderProps> = ({
  ranges,
  onChange,
  onQuickAdd,
  disabled,
  translations: t,
}) => {
  const [quickPackage, setQuickPackage] = useState("");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showMinorsMenu, setShowMinorsMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addRange = () => {
    const newId = Math.random().toString(36).substring(7);
    const lastPackage =
      ranges.length > 0 ? ranges[ranges.length - 1].packageName : quickPackage || "";

    onChange([
      ...ranges,
      {
        id: newId,
        packageName: lastPackage,
        start: "",
        end: "",
        isMax: false,
        isMin: false,
      },
    ]);
  };

  const removeRange = (id: string) => {
    onChange(ranges.filter((r) => r.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const updateRange = (id: string, updates: Partial<VersionRange>) => {
    onChange(ranges.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleQuickGenerator = async (type: "majors" | "minors", limit?: number | "all") => {
    if (!quickPackage.trim()) return;
    setIsGenerating(type);
    await onQuickAdd(quickPackage, type, limit);
    setIsGenerating(null);
    setShowMinorsMenu(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Merge Logic
  const canMerge = useMemo(() => {
    if (selectedIds.length < 2) return false;
    const selectedRanges = ranges.filter((r) => selectedIds.includes(r.id));
    const firstPkg = selectedRanges[0]?.packageName;
    // All must have same package name and that name must not be empty
    return firstPkg && selectedRanges.every((r) => r.packageName === firstPkg);
  }, [selectedIds, ranges]);

  const mergeSelected = () => {
    if (!canMerge) return;

    const selectedRanges = ranges.filter((r) => selectedIds.includes(r.id));
    const firstPkg = selectedRanges[0].packageName;

    // Determine if the new range should be Min (unbounded start)
    // If ANY selected range is unbounded at start, the result is unbounded.
    const isNewMin = selectedRanges.some((r) => r.isMin || !r.start);

    // Determine if the new range should be Max (unbounded end)
    const isNewMax = selectedRanges.some((r) => r.isMax || !r.end);

    let newStart = "";
    if (!isNewMin) {
      // Find earliest start
      const validStarts = selectedRanges
        .map((r) => r.start)
        .filter((v) => semver.valid(semver.clean(v) || semver.coerce(v)));

      if (validStarts.length > 0) {
        validStarts.sort((a, b) => semver.compare(a, b));
        newStart = validStarts[0];
      }
    }

    let newEnd = "";
    if (!isNewMax) {
      // Find latest end
      const validEnds = selectedRanges
        .map((r) => r.end)
        .filter((v) => semver.valid(semver.clean(v) || semver.coerce(v)));

      if (validEnds.length > 0) {
        validEnds.sort((a, b) => semver.compare(a, b));
        newEnd = validEnds[validEnds.length - 1];
      }
    }

    const mergedRange: VersionRange = {
      id: Math.random().toString(36).substring(7),
      packageName: firstPkg,
      start: newStart,
      end: newEnd,
      isMin: isNewMin,
      isMax: isNewMax,
    };

    // Replace selected items with the new merged item
    const newRanges = ranges.filter((r) => !selectedIds.includes(r.id));
    newRanges.push(mergedRange);

    onChange([...newRanges]);
    setSelectedIds([]); // Clear selection
  };

  // Reusable focus class for buttons and interactables
  const focusClass =
    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900";

  return (
    <div className="bg-white dark:bg-neutral-950 transition-colors duration-300">
      {/* --- Quick Generator Section --- */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 transition-colors duration-300">
        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 block transition-colors duration-300">
          {t.quickAddTitle}
        </label>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={quickPackage}
            onChange={(e) => setQuickPackage(e.target.value)}
            placeholder={t.pkgPlaceholder}
            disabled={disabled}
            className="flex-1 h-9 px-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm focus:border-black dark:focus:border-white focus:ring-0 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium text-black dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed transition-colors duration-300"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleQuickGenerator("majors")}
            disabled={disabled || !quickPackage || !!isGenerating}
            className={`h-8 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 enabled:hover:border-black enabled:dark:hover:border-white text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wide transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${focusClass}`}
          >
            {isGenerating === "majors" ? <Loader2 size={12} className="animate-spin" /> : t.byMajor}
          </button>

          <div
            className="relative"
            onMouseEnter={() => !disabled && quickPackage && setShowMinorsMenu(true)}
            onMouseLeave={() => setShowMinorsMenu(false)}
          >
            <button
              onClick={() => handleQuickGenerator("minors", 5)}
              disabled={disabled || !quickPackage || !!isGenerating}
              className={`w-full h-8 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 enabled:hover:border-black enabled:dark:hover:border-white text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wide transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${focusClass}`}
            >
              {isGenerating === "minors" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  {t.byMinor}
                  <ChevronDown size={12} />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {showMinorsMenu && !disabled && !isGenerating && (
              <div className="absolute top-full left-0 right-0 z-20 pt-1">
                <div className="bg-white dark:bg-neutral-900 border border-black dark:border-white shadow-lg animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1 grid grid-cols-1 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {[5, 10, 15].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleQuickGenerator("minors", num)}
                        className="px-3 py-2 text-left text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => handleQuickGenerator("minors", "all")}
                      className="px-3 py-2 text-left text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
                    >
                      {t.optionAll}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Main Ranges List --- */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800 transition-colors duration-300">
        {ranges.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 dark:text-neutral-600 text-sm transition-colors duration-300">
            {t.noRanges}
          </div>
        ) : (
          ranges.map((range) => (
            <RangeRow
              key={range.id}
              range={range}
              isSelected={selectedIds.includes(range.id)}
              onUpdate={updateRange}
              onRemove={removeRange}
              onToggleSelect={toggleSelection}
              disabled={disabled}
              translations={t}
              focusClass={focusClass}
            />
          ))
        )}
      </div>

      {/* Action Bar */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex gap-2 transition-colors duration-300">
        <button
          onClick={addRange}
          disabled={disabled}
          className={`flex-1 py-2 bg-white dark:bg-neutral-950 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 enabled:hover:border-black enabled:dark:hover:border-white enabled:hover:text-black enabled:dark:hover:text-white text-xs font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${focusClass}`}
        >
          <Plus size={14} />
          {t.addRow}
        </button>

        <button
          onClick={mergeSelected}
          disabled={disabled || !canMerge}
          title={canMerge ? "" : t.mergeError}
          className={`px-4 py-2 bg-white dark:bg-neutral-950 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 enabled:hover:border-accent enabled:dark:hover:border-blue-400 enabled:hover:text-accent enabled:dark:hover:text-blue-400 text-xs font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${focusClass}`}
        >
          <Merge size={14} />
          <span className="hidden sm:inline">{t.mergeBtn}</span>
        </button>

        <button
          onClick={() => {
            onChange([]);
            setSelectedIds([]);
          }}
          disabled={disabled || ranges.length === 0}
          className={`px-4 py-2 bg-white dark:bg-neutral-950 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 enabled:hover:border-red-600 enabled:dark:hover:border-red-500 enabled:hover:text-red-600 enabled:dark:hover:text-red-500 text-xs font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${focusClass}`}
          title={t.reset}
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline ml-2">{t.reset}</span>
        </button>
      </div>
    </div>
  );
};

export default RangeBuilder;
