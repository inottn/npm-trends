import clsx from "clsx";
import { X } from "lucide-react";
import React from "react";

interface InputClearButtonProps {
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

const InputClearButton: React.FC<InputClearButtonProps> = ({
  className = "",
  disabled,
  label,
  onClick,
}) => {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={clsx(
        "absolute top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600 enabled:hover:text-black enabled:dark:hover:text-white transition-colors duration-300 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      <X size={12} strokeWidth={2} />
    </button>
  );
};

export default InputClearButton;
