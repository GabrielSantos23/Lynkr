import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export const ScrollToTopButton = ({
  showAfter = 400,
  className = "",
  position = "bottom-right",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "bottom-6 left-6";
      case "bottom-center":
        return "bottom-6 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
      default:
        return "bottom-6 right-6";
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed z-50 p-3 rounded-full bg-secondary hover:bg-accent/80 
        text-foreground shadow-lg hover:shadow-xl transition-all duration-300
        transform hover:scale-110 active:scale-95
        ${getPositionClasses()}
        ${className}
      `}
      aria-label="Scroll to top"
    >
      <ChevronUp size={24} />
    </button>
  );
};
