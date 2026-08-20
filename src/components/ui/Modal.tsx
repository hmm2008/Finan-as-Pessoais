import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  mobileBehavior?: "modal" | "bottom-sheet";
}

const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "md",
  mobileBehavior = "modal",
}: ModalProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          "relative z-50 w-full bg-card border border-border p-6 shadow-xl transition-all duration-200 bg-card text-card-foreground",
          mobileBehavior === "bottom-sheet"
            ? "rounded-t-2xl bottom-0 fixed sm:relative sm:rounded-2xl max-sm:p-5 max-sm:pb-8"
            : "rounded-2xl",
          MAX_WIDTH_MAP[maxWidth]
        )}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            {title && <h3 className="text-base font-bold text-foreground">{title}</h3>}
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
