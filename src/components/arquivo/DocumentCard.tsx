import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileText, Image as ImageIcon, FileCode, Archive as ArchiveIcon, 
  Download, Eye, Trash2, ShieldCheck, Database 
} from 'lucide-react';
import { DocumentItem, DocumentType } from './types';

interface DocumentCardProps {
  key?: any;
  document: DocumentItem;
  onPreview: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICONS: Record<DocumentType, { icon: any; colorClass: string; label: string }> = {
  pdf: { icon: FileText, colorClass: 'text-destructive bg-destructive/10', label: 'PDF' },
  image: { icon: ImageIcon, colorClass: 'text-blue-500 bg-blue-500/10', label: 'Imagem' },
  doc: { icon: FileText, colorClass: 'text-amber-500 bg-amber-500/10', label: 'Documento' },
  archive: { icon: ArchiveIcon, colorClass: 'text-emerald-500 bg-emerald-500/10', label: 'Arquivo' },
  backup: { icon: Database, colorClass: 'text-purple-500 bg-purple-500/10', label: 'Backup JSON' }
};

export function DocumentCard({
  document,
  onPreview,
  onDownload,
  onDelete
}: DocumentCardProps) {
  const typeConfig = TYPE_ICONS[document.type] || TYPE_ICONS.doc;
  const IconComponent = typeConfig.icon;

  return (
    <Card className="border border-border hover:border-border/80 transition-all bg-card overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header Icon & Source Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeConfig.colorClass}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground block w-fit">
                {document.sourceLabel}
              </span>
            </div>
          </div>

          {document.isPrivate && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Privado
            </span>
          )}
        </div>

        {/* Title and metadata */}
        <div className="space-y-0.5">
          <h4 className="font-bold text-sm text-foreground truncate" title={document.name}>
            {document.name}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{document.size}</span>
            <span>•</span>
            <span>{document.createdAt}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            onClick={() => onPreview(document)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> Visualizar
          </Button>

          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onDownload(document)}
              title="Descarregar"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(document.id)}
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
