import { useCallback, useEffect, useRef, useState } from "react";

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

export const useDropdownPosition = (
  inputRef: React.RefObject<HTMLInputElement | null>,
  dropdownRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
) => {
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  });
  const rafRef = useRef<number | null>(null);

  // Calculate dropdown position based on input element
  const calculatePosition = useCallback((): DropdownPosition | null => {
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

  // Update dropdown position in state and DOM
  const updatePosition = useCallback(() => {
    const newPosition = calculatePosition();
    if (newPosition) {
      setDropdownPosition(newPosition);

      // Directly update dropdown DOM for smoother updates during scroll
      if (dropdownRef.current) {
        dropdownRef.current.style.top = `${newPosition.top}px`;
        dropdownRef.current.style.left = `${newPosition.left}px`;
        dropdownRef.current.style.width = `${newPosition.width}px`;
      }
    }
  }, []);

  // Update position when dropdown opens or on scroll/resize
  useEffect(() => {
    if (isOpen) {
      // Initial position update
      updatePosition();

      const handleScrollOrResize = () => {
        // Cancel any pending animation frame
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
        }

        // Use requestAnimationFrame for smooth updates
        rafRef.current = requestAnimationFrame(() => {
          updatePosition();
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
  }, [isOpen]);

  return { dropdownPosition, calculatePosition, updatePosition };
};
