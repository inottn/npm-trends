import { ChevronDown, Check } from "lucide-react";
import React, { useState, useRef, useEffect, useMemo } from "react";

interface VersionSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

const MAX_DROPDOWN_HEIGHT = 220;

const VersionSelect: React.FC<VersionSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  emptyMessage = "No matching versions",
  disabled,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on input value
  const filteredOptions = useMemo(() => {
    const lowerValue = (value || "").toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerValue));
  }, [options, value]);

  return (
    <div
      className={`relative ${className}`}
      ref={wrapperRef}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-8 px-2 text-sm bg-white dark:bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors duration-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono text-neutral-900 dark:text-neutral-200 rounded-none"
          autoComplete="off"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600 pointer-events-none group-focus-within:text-black dark:group-focus-within:text-white transition-colors duration-300">
          <ChevronDown size={12} strokeWidth={2} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-black dark:border-neutral-500 shadow-none overflow-y-auto animate-in fade-in duration-100"
          style={{ maxHeight: MAX_DROPDOWN_HEIGHT }}
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
                  className={`px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors duration-300 border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${
                    isSelected
                      ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
                  }`}
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
      )}
    </div>
  );
};

export default VersionSelect;
