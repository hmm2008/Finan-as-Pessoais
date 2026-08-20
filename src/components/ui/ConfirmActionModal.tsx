import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "./button";
import { AlertCircle } from "lucide-react";

interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive" | "success";
}

export function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
}: ConfirmActionModalProps) {
  const getButtonClass = () => {
    if (variant === "destructive") return "bg-destructive hover:bg-destructive/90 text-white";
    if (variant === "success") return "bg-emerald-600 hover:bg-emerald-700 text-white";
    return "bg-primary hover:bg-primary/95 text-white";
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-2 text-sm text-muted-foreground">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed text-foreground/80">{description}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button 
            className={getButtonClass()} 
            size="sm" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
