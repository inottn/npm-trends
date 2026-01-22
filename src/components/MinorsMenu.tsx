import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";

import type { Translation } from "../services/i18n";

type Scope = "latest" | "all";

type Limit = number | "all";

interface MinorsMenuProps {
  open: boolean;
  disabled?: boolean;
  translations: Translation;
  activeScope: Scope;
  onScopeChange: (scope: Scope) => void;
  onSelect: (scope: Scope, limit: Limit) => void;
}

const LIMITS: Limit[] = [5, 10, 15, "all"];

const MinorsMenu: React.FC<MinorsMenuProps> = ({
  activeScope,
  disabled,
  open,
  translations: t,
  onSelect,
  onScopeChange,
}) => {
  if (!open || disabled) return null;

  return (
    <div className="absolute top-full left-0 z-20 pt-1">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-900 dark:border-white shadow-lg animate-in fade-in zoom-in-95 duration-100 min-w-[240px]">
        <div className="flex">
          <div className="w-40 border-r border-neutral-200 dark:border-neutral-800">
            {["latest", "all"].map((scope) => (
              <button
                className={clsx(
                  "w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors duration-150 flex items-center justify-between",
                  scope === activeScope
                    ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white",
                )}
                key={scope}
                onClick={() => onSelect(scope as Scope, 5)}
                onFocus={() => onScopeChange(scope as Scope)}
                onMouseEnter={() => onScopeChange(scope as Scope)}
              >
                <span>{scope === "latest" ? t.minorsLatestLabel : t.minorsAllLabel}</span>
                <ChevronRight size={12} className="text-neutral-400" />
              </button>
            ))}
          </div>

          <div className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            {LIMITS.map((limit) => (
              <button
                key={`${activeScope}-${limit}`}
                onClick={() => onSelect(activeScope, limit)}
                className="w-full px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors duration-150"
              >
                {limit === "all" ? t.optionAll : limit}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinorsMenu;
