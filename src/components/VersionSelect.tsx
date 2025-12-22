import clsx from "clsx";
import { ChevronDown, Check } from "lucide-react";
import React, { useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";

import { useClickOutside } from "../hooks/useClickOutside";
import { useDropdownPosition } from "../hooks/useDropdownPosition";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const { dropdownPosition, updatePosition } = useDropdownPosition(inputRef, dropdownRef, isOpen);

  // Open dropdown with correct initial position
  const openDropdown = useCallback(() => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    }
  }, [isOpen]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Filter options based on input value
  const filteredOptions = useMemo(() => {
    const lowerValue = (value || "").toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerValue));
  }, [options, value]);

  const { highlightedIndex, setHighlightedIndex, optionRefs, handleKeyDown } =
    useKeyboardNavigation({
      filteredOptions,
      isOpen,
      value,
      onClose: closeDropdown,
      onOpen: openDropdown,
      onSelect: onChange,
    });

  useClickOutside([dropdownRef, inputRef], closeDropdown);

  // Render dropdown menu
  const dropdownMenu = isOpen && !disabled && (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-black dark:border-neutral-500 shadow-none overflow-y-auto animate-in fade-in duration-100"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        maxHeight: MAX_DROPDOWN_HEIGHT,
        marginTop: "4px",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {filteredOptions.length === 0 ? (
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
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              className={clsx(
                "px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors duration-300 border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                isSelected
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-bold"
                  : isHighlighted
                    ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white",
              )}
              onClick={() => {
                onChange(ver);
                closeDropdown();
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
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
  );

  return (
    <div
      className={clsx("relative", className)}
      ref={wrapperRef}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          closeDropdown();
        }
      }}
    >
      <div className="relative group">
        <input
          autoComplete="off"
          className="w-full h-8 px-2 text-sm bg-white dark:bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors duration-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono text-neutral-900 dark:text-neutral-200 rounded-none"
          disabled={disabled}
          placeholder={placeholder}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            openDropdown();
          }}
          onClick={openDropdown}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600 pointer-events-none group-focus-within:text-black dark:group-focus-within:text-white transition-colors duration-300">
          <ChevronDown size={12} strokeWidth={2} />
        </div>
      </div>

      {dropdownMenu && createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default VersionSelect;
