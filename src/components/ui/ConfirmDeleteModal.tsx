import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "./button";
import { AlertTriangle, Trash2, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTrash } from "../../hooks/useTrash";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmPermanent: () => void;
  entityLabel: string;
  // Trash support
  entityName?: string;
  entityId?: string;
  entityData?: any;
  onMoveToTrashSuccess?: () => void;
}

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirmPermanent,
  entityLabel,
  entityName,
  entityId,
  entityData,
  onMoveToTrashSuccess,
}: ConfirmDeleteModalProps) {
  const { moveToTrash } = useTrash();
  const [successMsg, setSuccessMsg] = React.useState('');

  const hasTrashSupport = !!(entityName && entityId && entityData);

  const handleMoveToTrash = () => {
    if (entityName && entityId && entityData) {
      if (Array.isArray(entityData)) {
        entityData.forEach((item: any) => {
          const itemLabel = item.entity || item.name || item.description || item.category || 'Registo';
          const itemAmt = item.amount ? ` (${item.amount}€)` : '';
          moveToTrash(entityName, item.id || entityId, item, `${itemLabel}${itemAmt}`);
        });
        setSuccessMsg(`${entityData.length} itens movidos para a Reciclagem com sucesso!`);
      } else {
        moveToTrash(entityName, entityId, entityData, entityLabel);
        setSuccessMsg('Item movido para a Reciclagem com sucesso!');
      }
      if (onMoveToTrashSuccess) {
        setTimeout(() => {
          onMoveToTrashSuccess();
          onClose();
          setSuccessMsg('');
        }, 1500);
      } else {
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 1500);
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Confirmar Eliminação" maxWidth="md">
      <div className="space-y-4">
        {successMsg ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2.5 text-sm font-semibold animate-in zoom-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold">Tem a certeza que deseja apagar "{entityLabel}"?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  A eliminação definitiva apagará o registo do sistema para sempre de forma irreversível. 
                  Se preferir, pode mover o item para a Reciclagem e restaurá-lo mais tarde.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-center gap-2 pt-3 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose} 
                className="w-full sm:w-auto text-xs h-9 px-4 font-medium"
              >
                Cancelar
              </Button>

              {hasTrashSupport && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMoveToTrash}
                  className="w-full sm:w-auto text-xs h-9 px-4 font-medium text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reciclagem
                </Button>
              )}

              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  onConfirmPermanent();
                  onClose();
                }}
                className="w-full sm:w-auto text-xs h-9 px-4 font-bold gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
