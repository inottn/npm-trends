import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  size,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
} from "@floating-ui/react";
import clsx from "clsx";
import { ChevronDown, Check } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";

interface VersionSelectProps {
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  options: string[];
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
}

const MAX_DROPDOWN_HEIGHT = 220;

const VersionSelect: React.FC<VersionSelectProps> = ({
  className = "",
  disabled,
  emptyMessage = "No matching versions",
  options,
  placeholder,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const filteredOptions = useMemo(() => {
    const lowerValue = (value || "").toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerValue));
  }, [options, value]);

  const selectedIndex = filteredOptions.findIndex((option) => option === value);
  const defaultActiveIndex =
    filteredOptions.length === 0 ? null : selectedIndex >= 0 ? selectedIndex : 0;
  const highlightedIndex =
    isOpen && activeIndex !== null && activeIndex < filteredOptions.length
      ? activeIndex
      : isOpen
        ? defaultActiveIndex
        : null;

  const {
    refs: floatingRefs,
    floatingStyles,
    context,
    isPositioned,
  } = useFloating<HTMLInputElement>({
    open: isOpen && !disabled,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    strategy: "fixed",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements, rects }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${Math.max(0, Math.min(availableHeight, MAX_DROPDOWN_HEIGHT))}px`,
          });
        },
      }),
    ],
  });

  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown",
  });
  const role = useRole(context, { role: "listbox" });
  const listNavigation = useListNavigation(context, {
    activeIndex: highlightedIndex,
    listRef: itemRefs,
    loop: true,
    onNavigate: setActiveIndex,
    selectedIndex: selectedIndex >= 0 ? selectedIndex : null,
    virtual: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    dismiss,
    role,
    listNavigation,
  ]);

  const setReference = useCallback(
    (node: HTMLInputElement | null) => {
      floatingRefs.setReference(node);
    },
    [floatingRefs],
  );

  const setFloating = useCallback(
    (node: HTMLDivElement | null) => {
      floatingRefs.setFloating(node);
    },
    [floatingRefs],
  );

  const openDropdown = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(null);
    itemRefs.current = [];
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === "Enter" || event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    if (event.key === "Enter" && highlightedIndex !== null) {
      event.preventDefault();
      onChange(filteredOptions[highlightedIndex]);
      closeDropdown();
    }

    if (event.key === "Tab") {
      closeDropdown();
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget;

    if (!floatingRefs.floating.current?.contains(nextTarget as Node | null)) {
      closeDropdown();
    }
  };

  const isDropdownVisible = isOpen && isPositioned && !disabled;

  const dropdownMenu = !disabled && (
    <FloatingPortal>
      <div
        ref={setFloating}
        className={clsx(
          "z-[9999] bg-white dark:bg-neutral-900 border border-black dark:border-neutral-500 shadow-none overflow-hidden",
          isDropdownVisible && "animate-in fade-in duration-100",
        )}
        style={{
          ...floatingStyles,
          pointerEvents: isDropdownVisible ? "auto" : "none",
          visibility: isDropdownVisible ? "visible" : "hidden",
        }}
        onMouseDown={(event) => event.preventDefault()}
        {...getFloatingProps()}
      >
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: "inherit",
            overscrollBehaviorY: "contain",
          }}
        >
          {!isOpen ? null : filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-400 dark:text-neutral-500 text-center">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((ver, index) => {
              const isSelected = value === ver;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={ver}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  className={clsx(
                    "px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors duration-300 border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                    isSelected
                      ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-bold"
                      : isHighlighted
                        ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white",
                  )}
                  {...getItemProps({
                    onClick() {
                      onChange(ver);
                      closeDropdown();
                    },
                    onMouseEnter() {
                      setActiveIndex(index);
                    },
                  })}
                >
                  <span className="truncate font-mono">{ver}</span>
                  {isSelected && (
                    <Check size={12} className="text-black dark:text-white shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </FloatingPortal>
  );

  return (
    <div className={clsx("relative", className)}>
      <div className="relative group">
        <input
          autoComplete="off"
          className="w-full h-8 px-2 text-sm bg-white dark:bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors duration-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono text-neutral-900 dark:text-neutral-200 rounded-none"
          disabled={disabled}
          placeholder={placeholder}
          type="text"
          value={value}
          ref={setReference}
          {...getReferenceProps({
            onBlur: handleBlur,
            onClick: openDropdown,
            onChange(event) {
              onChange((event.currentTarget as HTMLInputElement).value);
              openDropdown();
            },
            onKeyDown: handleKeyDown,
          })}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600 pointer-events-none group-focus-within:text-black dark:group-focus-within:text-white transition-colors duration-300">
          <ChevronDown size={12} strokeWidth={2} />
        </div>
      </div>

      {dropdownMenu}
    </div>
  );
};

export default VersionSelect;
