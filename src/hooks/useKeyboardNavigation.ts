import { useCallback, useEffect, useRef, useState } from "react";

interface UseKeyboardNavigationProps {
  filteredOptions: string[];
  isOpen: boolean;
  value: string;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (option: string) => void;
}

export const useKeyboardNavigation = ({
  filteredOptions,
  isOpen,
  value,
  onClose,
  onOpen,
  onSelect,
}: UseKeyboardNavigationProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset highlighted index when filtered options change or dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Find the index of the current value in filtered options
      const currentIndex = filteredOptions.findIndex((opt) => opt === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [filteredOptions, isOpen, value]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && isOpen && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex, isOpen]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
          onOpen();
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev + 1;
            return next >= filteredOptions.length ? 0 : next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? filteredOptions.length - 1 : next;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            onSelect(filteredOptions[highlightedIndex]);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredOptions, highlightedIndex, isOpen, onClose, onOpen, onSelect],
  );

  return {
    handleKeyDown,
    highlightedIndex,
    optionRefs,
    setHighlightedIndex,
  };
};
