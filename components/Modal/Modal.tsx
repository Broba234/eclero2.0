// components/Modal.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overclass?: string;
  innerclass?: string;
  transition?: string;
  no_close?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  overclass,
  innerclass,
  children,
  transition,
  no_close = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const getContentClasses = () => {
    const base = `${innerclass} transition-all duration-300`;
    switch (transition) {
      case "slide-right":
        return base;
      default: // fade
        return `${base} ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`;
    }
  };
  const getOverlayClasses = () => {
    const base = `${overclass}`;
    switch (transition) {
      case "slide-right":
        return base;
      default: // fade
        return base;
    }
  };
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Timeout to allow the DOM to update before applying the visible class
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      // Start closing animation
      setIsVisible(false);
      // Delay unmounting until animation completes
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div
      className={`modal-overlay ${getOverlayClasses()} ${
        isVisible ? "visible" : ""
      }`}
      onClick={() => !no_close && onClose()}
    >
      <div
        className={`${getContentClasses()} ${isVisible ? "visible" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
