import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { X, Download, ShieldCheck, FileText, Image as ImageIcon, FileCode, ExternalLink, Key } from 'lucide-react';
import { DocumentItem } from './types';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  onClose: () => void;
}

export function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  const [isGeneratingSignedUrl, setIsGeneratingSignedUrl] = useState(false);
  const [signedUrlReady, setSignedUrlReady] = useState(false);

  if (!document) return null;

  const handleDownload = () => {
    if (document.isPrivate && !signedUrlReady) {
      setIsGeneratingSignedUrl(true);
      setTimeout(() => {
        setIsGeneratingSignedUrl(false);
        setSignedUrlReady(true);
        // Trigger download
        const a = window.document.createElement('a');
        a.href = document.url || '#';
        a.download = document.name;
        a.click();
      }, 800);
    } else {
      const a = window.document.createElement('a');
      a.href = document.url || '#';
      a.download = document.name;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl shadow-xl border-border my-6 bg-card flex flex-col max-h-[90vh]">
        <CardHeader className="relative pb-3 border-b border-border shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 pr-8">
            <CardTitle className="text-lg font-bold text-foreground truncate">
              {document.name}
            </CardTitle>
            {document.isPrivate && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" /> Privado
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Origem: <strong className="text-foreground">{document.sourceLabel}</strong> | Tamanho: {document.size} | Data: {document.createdAt}
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Document Content Rendering */}
          {document.type === 'image' && (
            <div className="flex justify-center items-center bg-secondary/30 p-4 rounded-xl border border-border min-h-[250px]">
              <img 
                src={document.url} 
                alt={document.name} 
                className="max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          )}

          {document.type === 'pdf' && (
            <div className="w-full h-[55vh] rounded-xl border border-border bg-secondary/20 overflow-hidden flex flex-col items-center justify-center p-4">
              {document.url.startsWith('data:') || document.url.startsWith('blob:') || document.url.startsWith('http') ? (
                <iframe 
                  src={document.url} 
                  className="w-full h-full rounded-lg"
                  title={document.name}
                />
              ) : (
                <div className="text-center space-y-3">
                  <FileText className="w-16 h-16 text-primary mx-auto opacity-70" />
                  <p className="text-sm font-semibold text-foreground">Visualizador de Documento PDF</p>
                  <p className="text-xs text-muted-foreground">Clique no botão abaixo para descarregar ou abrir num novo separador.</p>
                </div>
              )}
            </div>
          )}

          {(document.type === 'backup' || document.type === 'archive' || document.type === 'doc') && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Conteúdo / Dados Estruturados</Label>
              <div className="p-4 rounded-xl bg-secondary/60 border border-border font-mono text-xs overflow-x-auto max-h-[50vh]">
                {document.dataPayload ? (
                  <pre className="text-foreground">{JSON.stringify(document.dataPayload, null, 2)}</pre>
                ) : (
                  <div className="text-center py-8 text-muted-foreground space-y-2">
                    <FileCode className="w-10 h-10 mx-auto text-primary opacity-60" />
                    <p>Ficheiro de documento anexado: {document.name}</p>
                    <p className="text-[11px]">Faça o download para aceder ao formato original na íntegra.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 bg-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {document.isPrivate && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Key className="w-3.5 h-3.5" /> Requer URL assinada temporária para download.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingSignedUrl}>
              <Download className={`w-4 h-4 mr-1.5 ${isGeneratingSignedUrl ? 'animate-bounce' : ''}`} />
              {isGeneratingSignedUrl ? 'Gerando URL Assinada...' : 'Descarregar Ficheiro'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
