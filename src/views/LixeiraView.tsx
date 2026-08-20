import React, { useState } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useTrash, TrashItem } from '../hooks/useTrash';
import { usePin, usePrivacy } from '../contexts';
import { 
  Trash2, RotateCcw, AlertTriangle, ShieldCheck, 
  Lock, Search, FolderArchive, CheckCircle2, AlertCircle, X, Flame 
} from 'lucide-react';

export default function LixeiraView() {
  const { trashItems, restoreFromTrash, permanentDelete, emptyTrash } = useTrash();
  const { hasPin, verifyPin } = usePin();
  const { maskValue } = usePrivacy();

  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // PIN Unlock Modal State
  const [pendingAction, setPendingAction] = useState<{
    type: 'restore' | 'delete' | 'empty';
    trashId?: string;
  } | null>(null);

  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  // Confirmation Modal State for Empty Trash
  const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);

  // Filter items by search safely
  const filteredItems = (trashItems || []).filter(item => {
    if (!item) return false;
    const label = (item.label || item.data?.description || item.data?.category || item.data?.name || item.data?.entity || '').toLowerCase();
    const entity = (item.entityName || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();
    return label.includes(search) || entity.includes(search);
  });

  // Group items by entityName safely
  const groupedItems = filteredItems.reduce<Record<string, TrashItem[]>>((acc, item) => {
    const groupName = item.entityName || 'Outros';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(item);
    return acc;
  }, {});

  const triggerActionWithPinCheck = (type: 'restore' | 'delete' | 'empty', trashId?: string) => {
    if (hasPin) {
      setPendingAction({ type, trashId });
      setPinCode('');
      setPinError('');
    } else {
      // Execute directly
      executeAction(type, trashId);
    }
  };

  const executeAction = (type: 'restore' | 'delete' | 'empty', trashId?: string) => {
    if (type === 'restore' && trashId) {
      const restored = restoreFromTrash(trashId);
      if (restored) {
        setSuccessMessage(`"${restored.label}" foi restaurado com sucesso!`);
      }
    } else if (type === 'delete' && trashId) {
      permanentDelete(trashId);
      setSuccessMessage('Item eliminado definitivamente.');
    } else if (type === 'empty') {
      emptyTrash();
      setSuccessMessage('A lixeira foi completamente esvaziada.');
      setIsEmptyConfirmOpen(false);
    }

    setPendingAction(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAction) return;

    if (!pinCode || pinCode.length !== 4) {
      setPinError('Introduza o PIN de 4 dígitos.');
      return;
    }

    const isValid = await verifyPin(pinCode);
    if (!isValid) {
      setPinError('PIN incorreto. Ação cancelada por segurança.');
      return;
    }

    executeAction(pendingAction.type, pendingAction.trashId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Lixeira & Recuperação" 
          subtitle="Gerencie os itens eliminados do sistema com opção de restauro ou eliminação definitiva"
        />
        
        {trashItems.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={() => setIsEmptyConfirmOpen(true)}
            className="shrink-0 font-semibold"
          >
            <Flame className="w-4 h-4 mr-2" /> Esvaziar Lixeira
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Search & Counters Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar itens eliminados..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Trash2 className="w-4 h-4 text-primary" />
            Total de Itens: <strong className="text-foreground">{trashItems.length}</strong>
          </span>
          {hasPin && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> PIN Protegido
            </span>
          )}
        </div>
      </div>

      {/* Grouped Trash Items List */}
      {trashItems.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Trash2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-foreground">A reciclagem está vazia</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Os elementos eliminados nas várias secções do sistema aparecerão aqui antes de serem totalmente apagados.
            </p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedItems).length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Nenhum item encontrado com o termo de pesquisa "{searchTerm}".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedItems) as [string, TrashItem[]][]).map(([entityGroup, items]) => (
            <div key={entityGroup} className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <FolderArchive className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-base text-foreground">{entityGroup}</h3>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {items.map(item => {
                  const displayLabel = item.label || item.data?.description || item.data?.category || item.data?.name || item.data?.entity || (item.data?.amount ? `Registo (${item.data.amount}€)` : 'Item sem título');
                  const validDate = item.deletedAt ? new Date(item.deletedAt) : null;
                  const deletedDate = validDate && !isNaN(validDate.getTime()) 
                    ? validDate.toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Data indisponível';

                  return (
                    <Card key={item.id} className="border-border hover:border-border/80 transition-all bg-card">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground truncate">{displayLabel}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Eliminado em: <span className="font-medium text-foreground">{deletedDate}</span>
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => triggerActionWithPinCheck('restore', item.id)}
                            className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Restaurar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => triggerActionWithPinCheck('delete', item.id)}
                            className="text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Eliminar Definitivamente
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Trash Confirmation Dialog */}
      {isEmptyConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-destructive/40 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="font-bold text-lg text-foreground">Esvaziar Toda a Lixeira?</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esta ação apagará permanentemente todos os <strong>{trashItems.length}</strong> itens contidos na lixeira. 
                Esta operação é <strong>irreversível</strong>.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setIsEmptyConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => triggerActionWithPinCheck('empty')}
                >
                  Confirmar Esvaziar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PIN Unlock Modal for Protected Trash Actions */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm border-primary/30 shadow-xl">
            <CardHeader className="relative pb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-3 top-3" 
                onClick={() => setPendingAction(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                PIN de Segurança Requerido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">
                Insira o seu PIN de 4 dígitos para autorizar esta operação na lixeira.
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Input 
                    type="password"
                    maxLength={4}
                    placeholder="****"
                    value={pinCode}
                    onChange={(e) => {
                      setPinCode(e.target.value);
                      setPinError('');
                    }}
                    className="text-center text-xl tracking-widest font-bold"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-xs text-destructive font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPendingAction(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Confirmar PIN
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
