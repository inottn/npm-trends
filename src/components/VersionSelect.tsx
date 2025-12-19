import clsx from "clsx";
import { ChevronDown, Check } from "lucide-react";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";

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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Calculate and set dropdown position
  const calculatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      return {
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      };
    }
    return null;
  }, []);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    const newPosition = calculatePosition();
    if (newPosition) {
      // Update state for initial render
      setDropdownPosition(newPosition);

      // Directly update dropdown DOM for smoother updates during scroll
      if (dropdownRef.current) {
        dropdownRef.current.style.top = `${newPosition.top}px`;
        dropdownRef.current.style.left = `${newPosition.left}px`;
        dropdownRef.current.style.width = `${newPosition.width}px`;
      }
    }
  }, [calculatePosition]);

  // Open dropdown with correct initial position
  const openDropdown = useCallback(() => {
    if (!isOpen) {
      const position = calculatePosition();
      if (position) {
        setDropdownPosition(position);
      }
      setIsOpen(true);
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update position when dropdown opens or on scroll/resize
  useEffect(() => {
    if (isOpen) {
      // Initial position update
      updateDropdownPosition();

      const handleScrollOrResize = () => {
        // Cancel any pending animation frame
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
        }

        // Use requestAnimationFrame for smooth updates
        rafRef.current = requestAnimationFrame(() => {
          updateDropdownPosition();
          rafRef.current = null;
        });
      };

      // Listen to scroll events on all parent elements and window
      let currentElement = inputRef.current?.parentElement;
      const scrollElements: HTMLElement[] = [];

      while (currentElement) {
        const overflowY = window.getComputedStyle(currentElement).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") {
          scrollElements.push(currentElement);
          currentElement.addEventListener("scroll", handleScrollOrResize);
        }
        currentElement = currentElement.parentElement;
      }

      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      return () => {
        scrollElements.forEach((element) => {
          element.removeEventListener("scroll", handleScrollOrResize);
        });
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);

        // Cancel any pending animation frame on cleanup
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Filter options based on input value
  const filteredOptions = useMemo(() => {
    const lowerValue = (value || "").toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerValue));
  }, [options, value]);

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
        filteredOptions.map((ver) => {
          const isSelected = value === ver;
          return (
            <div
              key={ver}
              onClick={() => {
                onChange(ver);
                setIsOpen(false);
              }}
              className={clsx(
                "px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors duration-300 border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                isSelected
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-bold"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white",
              )}
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
          setIsOpen(false);
        }
      }}
    >
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            openDropdown();
          }}
          onFocus={openDropdown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-8 px-2 text-sm bg-white dark:bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors duration-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono text-neutral-900 dark:text-neutral-200 rounded-none"
          autoComplete="off"
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
