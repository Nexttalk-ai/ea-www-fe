import React, { useEffect } from "react";
import ReactDOM from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  classNameBackground?: string;
  classNameModal?: string;
};

export const Modal = ({ isOpen, onClose, children, classNameBackground, classNameModal }: ModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${classNameBackground}`}
      onClick={onClose}
    >
      <div
        className={`bg-white overflow-auto rounded-lg shadow-lg flex flex-col ${classNameModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

Modal.Header = ({ children, className }: { children: React.ReactNode, className?: String }) => (
  <div className={`border-b px-6 py-4 text-lg font-semibold ${className}`}>{children}</div>
);

Modal.Body = ({ children, className }: { children: React.ReactNode, className?: String }) => (
  <div className={`flex-1 px-6 py-4 ${className}`}>{children}</div>
);

Modal.Footer = ({ children, className }: { children: React.ReactNode, className?: String }) => (
  <div className={`border-t px-6 py-4 flex justify-end gap-2 ${className}`}>{children}</div>
);