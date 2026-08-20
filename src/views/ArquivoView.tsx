import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  DocumentItem, 
  DocumentType, 
  DocumentSource,
  DocumentCard, 
  DocumentPreviewModal, 
  BackupButton, 
  RestoreBackupModal, 
  ArchivePageButton 
} from '../components/arquivo';
import { 
  FolderArchive, FileText, Image as ImageIcon, Database, 
  Upload, Search, Filter, ShieldCheck, CheckCircle2, HardDrive 
} from 'lucide-react';
import { usePrivacy } from '../contexts';

const INITIAL_DOCUMENTS: DocumentItem[] = [];

export default function ArquivoView() {
  const { maskValue } = usePrivacy();

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('fin_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar documentos:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('fin_documents', JSON.stringify(documents));
    } catch (e) {
      console.error('Erro ao guardar documentos:', e);
    }
  }, [documents]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<string>('2026-08');

  // Modal States
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const handleDocumentAdded = (newDoc: DocumentItem) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    setToastMsg('Documento removido do arquivo.');
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
    if (doc.url && doc.url !== '#') {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.name;
      a.click();
    } else {
      setPreviewDoc(doc);
    }
  };

  // Filter logic
  const filteredDocuments = documents.filter(doc => {
    if (!doc) return false;
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesSource = selectedSource === 'all' || doc.source === selectedSource;
    const name = (doc.name || '').toLowerCase();
    const sourceLabel = (doc.sourceLabel || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchesQuery = name.includes(query) || sourceLabel.includes(query);
    return matchesType && matchesSource && matchesQuery;
  });

  // Stats (15.1)
  const totalCount = documents.length;
  const pdfCount = documents.filter(d => d.type === 'pdf').length;
  const imageCount = documents.filter(d => d.type === 'image').length;
  const backupCount = documents.filter(d => d.type === 'backup').length;
  const docCount = documents.filter(d => d.type === 'doc' || d.type === 'archive').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Backup/Restore Action Bar (15.2) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Arquivo Documental & Backups" 
          subtitle="Gestão centralizada de faturas, recibos, backups e relatórios exportados"
        />

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <ArchivePageButton 
            currentMonth={currentMonth} 
            onArchiveCreated={handleDocumentAdded} 
          />
          <BackupButton 
            onBackupCreated={handleDocumentAdded} 
          />
          <Button 
            variant="outline" 
            onClick={() => setIsRestoreModalOpen(true)}
            className="text-xs border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
          >
            <Upload className="w-4 h-4 mr-1.5" /> Restaurar Backup
          </Button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Stats Counter Bar (15.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Total Ficheiros</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{totalCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Documentos PDF</p>
              <p className="text-xl font-bold text-destructive mt-0.5">{pdfCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Imagens & Recibos</p>
              <p className="text-xl font-bold text-blue-500 mt-0.5">{imageCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Backups JSON</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{backupCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Armazenamento</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">6.1 MB</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls (15.1) */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou etiqueta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="space-y-0.5 flex-1 sm:flex-initial">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="text-xs h-9 min-w-[140px]">
                  <SelectValue placeholder="Tipo de Ficheiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="pdf">Apenas PDFs</SelectItem>
                  <SelectItem value="image">Imagens / Digitalizações</SelectItem>
                  <SelectItem value="backup">Backups de Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5 flex-1 sm:flex-initial">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="text-xs h-9 min-w-[150px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Origens</SelectItem>
                  <SelectItem value="despesas">Despesas com Anexo</SelectItem>
                  <SelectItem value="assets">Património & Imóveis</SelectItem>
                  <SelectItem value="vehicle_tasks">Veículos & Manutenção</SelectItem>
                  <SelectItem value="archives">Relatórios Arquivados</SelectItem>
                  <SelectItem value="backup">Backups de Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Grid (15.1) */}
      {filteredDocuments.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <FolderArchive className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-foreground">Nenhum documento encontrado</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ajuste os filtros de pesquisa ou utilize os botões superiores para arquivar meses e gerar novos backups.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocuments.map(doc => (
            <DocumentCard 
              key={doc.id}
              document={doc}
              onPreview={(d) => setPreviewDoc(d)}
              onDownload={handleDownloadDocument}
              onDelete={handleDeleteDocument}
            />
          ))}
        </div>
      )}

      {/* Document Preview Modal (15.3) */}
      <DocumentPreviewModal 
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Restore Backup Modal (15.2) */}
      <RestoreBackupModal 
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestoreComplete={(msg) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(''), 3000);
        }}
      />
    </div>
  );
}
