import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { usePreferences, TextStyle } from '../../contexts/PreferencesContext';
import { TextStyleEditor } from './TextStyleEditor';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Car, 
  Target, 
  FileText, 
  Trash2, 
  Settings, 
  Menu, 
  RotateCcw, 
  Check, 
  Sparkles,
  Edit3,
  Database,
  Wrench,
  Loader2,
  KeyRound,
  Palette
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  defaultLabel: string;
  icon: React.ElementType;
  description: string;
}

export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { id: '/', defaultLabel: 'Visão Geral', icon: LayoutDashboard, description: 'Painel principal com resumo financeiro' },
  { id: '/financas', defaultLabel: 'Finanças', icon: Wallet, description: 'Registo de movimentos e transações' },
  { id: '/receitas-fixas', defaultLabel: 'Receitas Fixas', icon: TrendingUp, description: 'Ordenados, rendas e rendimentos recorrentes' },
  { id: '/despesas-fixas', defaultLabel: 'Despesas Fixas', icon: Calendar, description: 'Contratos e despesas periódicas' },
  { id: '/orcamentos', defaultLabel: 'Orçamentos', icon: CreditCard, description: 'Tetos orçamentais e limites por categoria' },
  { id: '/patrimonio', defaultLabel: 'Património', icon: TrendingUp, description: 'Bens, ativos e contas de investimento' },
  { id: '/viaturas', defaultLabel: 'Viaturas', icon: Car, description: 'Abastecimentos e despesas de veículos' },
  { id: '/objectivos', defaultLabel: 'Objetivos', icon: Target, description: 'Metas de poupança e fundos de emergência' },
  { id: '/utilitarios', defaultLabel: 'Utilitários', icon: Wrench, description: 'Geração de relatórios mensais/anuais e backups' },
  { id: '/lixeira', defaultLabel: 'Reciclagem', icon: Trash2, description: 'Recuperação de itens e registos eliminados' },
  { id: '/configuracoes', defaultLabel: 'Configurações', icon: Settings, description: 'Definições da conta e preferências da app' },
  { id: '/sidebar-collapse', defaultLabel: 'Colapsar', icon: Menu, description: 'Rótulo do botão para recolher o menu lateral' },
  { id: '/create-pin', defaultLabel: 'Criar PIN de Acesso', icon: KeyRound, description: 'Rótulo da opção para definir o PIN de segurança' }
];

export function SidebarLabelsCustomizer() {
  const { prefs, updatePrefs } = usePreferences();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Initialize state from existing preferences
  useEffect(() => {
    if (isModified) return;

    const currentNavLabels = prefs.navLabels || {};

    const initialLabels: Record<string, string> = {};
    DEFAULT_NAV_ITEMS.forEach(item => {
      initialLabels[item.id] = currentNavLabels[item.id] || item.defaultLabel;
    });

    setLabels(initialLabels);
  }, [prefs.navLabels]);

  const handleChange = (id: string, value: string) => {
    setLabels(prev => {
      const next = { ...prev, [id]: value };
      setIsModified(true);
      return next;
    });
    setSavedSuccess(false);
  };

  const handleResetSingle = (id: string, defaultLabel: string) => {
    setLabels(prev => {
      const next = { ...prev, [id]: defaultLabel };
      setIsModified(true);
      return next;
    });
  };

  const handleResetAll = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    const resetLabels: Record<string, string> = {};
    DEFAULT_NAV_ITEMS.forEach(item => {
      resetLabels[item.id] = item.defaultLabel;
    });

    setLabels(resetLabels);
    setIsModified(false);

    try {
      await updatePrefs({ navLabels: resetLabels });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao repor menu:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      // Clean labels
      const cleanedLabels: Record<string, string> = {};
      DEFAULT_NAV_ITEMS.forEach(item => {
        const current = (labels[item.id] || '').trim();
        cleanedLabels[item.id] = current || item.defaultLabel;
      });

      setLabels(cleanedLabels);

      // Update in context (which updates React components and writes to Firestore)
      await updatePrefs({ 
        navLabels: cleanedLabels,
        customStyles: {
          ...prefs.customStyles,
          sidebar: sidebarStyle
        }
      });

      setIsModified(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao guardar menu:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const [sidebarStyle, setSidebarStyle] = useState<TextStyle>(prefs.customStyles?.sidebar || {});

  return (
    <Card className="border border-border bg-card shadow-sm rounded-xl relative">
      {/* Floating Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white shadow-2xl px-5 py-3.5 rounded-xl flex items-center gap-3 font-medium text-sm border border-emerald-500/50 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white stroke-[3]" />
          </div>
          <div>
            <p className="font-semibold text-white">Nomes do Menu Guardados!</p>
            <p className="text-xs text-emerald-100">Atualizado no menu e sincronizado na Google Drive.</p>
          </div>
        </div>
      )}

      <CardHeader className="border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Menu className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Personalizar Nomes do Menu Lateral e Rodapé</CardTitle>
              <CardDescription>
                Altere os títulos das opções de navegação na barra lateral e no rodapé. Guardado na cloud e visível em qualquer dispositivo.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={isSaving}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Repor Padrões
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className={savedSuccess 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all" 
                : "bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium"
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  A guardar...
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-white" />
                  Guardado!
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Guardar Nomes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {savedSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Nomes do menu lateral atualizados com sucesso no menu e sincronizados com a Google Drive!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextStyleEditor 
              label="Estilo Visual das Letras do Menu Lateral" 
              style={sidebarStyle} 
              onChange={setSidebarStyle} 
              onReset={() => setSidebarStyle({})}
            />

            <div className="space-y-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Cor de Fundo do Menu Lateral
              </Label>
              <div className="p-4 rounded-xl border border-border bg-secondary/10 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { color: '#020617', label: 'Slate 950 (Padrão)' },
                    { color: '#0f172a', label: 'Slate 900' },
                    { color: '#1e293b', label: 'Slate 800' },
                    { color: '#111827', label: 'Gray 950' },
                    { color: '#171717', label: 'Neutral 900' },
                    { color: '#312e81', label: 'Indigo 900' },
                    { color: '#1e1b4b', label: 'Indigo 950' },
                    { color: '#4c1d95', label: 'Violet 900' },
                    { color: '#581c87', label: 'Purple 900' },
                    { color: '#701a75', label: 'Fuchsia 900' },
                    { color: '#831843', label: 'Pink 900' },
                    { color: '#7f1d1d', label: 'Red 900' },
                  ].map((colorObj) => (
                    <button
                      key={colorObj.color}
                      type="button"
                      onClick={() => setSidebarStyle(prev => ({ ...prev, backgroundColor: colorObj.color }))}
                      className={`w-9 h-9 rounded-lg border-2 transition-all hover:scale-105 shrink-0 ${
                        sidebarStyle.backgroundColor === colorObj.color 
                          ? 'border-primary ring-2 ring-primary/20 scale-105' 
                          : 'border-border/40'
                      }`}
                      style={{ backgroundColor: colorObj.color }}
                      title={colorObj.label}
                    />
                  ))}
                  
                  {/* Custom Color Input */}
                  <div className="relative group">
                    <input
                      type="color"
                      value={sidebarStyle.backgroundColor || '#020617'}
                      onChange={(e) => setSidebarStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-9 h-9 p-0 rounded-lg border-2 border-border/40 cursor-pointer overflow-hidden"
                      title="Escolher cor personalizada"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setSidebarStyle(prev => {
                      const { backgroundColor, ...rest } = prev;
                      return rest;
                    })}
                    className="w-9 h-9 rounded-lg"
                    title="Remover cor personalizada"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  <div 
                    className="w-12 h-12 rounded-lg border border-border shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: sidebarStyle.backgroundColor || '#020617' }}
                  >
                    <Menu className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium">Pré-visualização da Cor</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {sidebarStyle.backgroundColor || '#020617'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const currentValue = labels[item.id] ?? item.defaultLabel;
              const isItemCustomized = currentValue !== item.defaultLabel;

              return (
                <div 
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isItemCustomized 
                      ? 'border-primary/40 bg-primary/5' 
                      : 'border-border/60 bg-secondary/20 hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center text-primary shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-muted-foreground block truncate">
                          Original: <span className="font-semibold text-foreground/80">{item.defaultLabel}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground/70 block truncate">
                          {item.id}
                        </span>
                      </div>
                    </div>

                    {isItemCustomized && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetSingle(item.id, item.defaultLabel)}
                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                        title="Repor nome original"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Repor
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Input
                        value={currentValue}
                        onChange={(e) => handleChange(item.id, e.target.value)}
                        placeholder={item.defaultLabel}
                        className="text-sm h-9 bg-background pr-8"
                      />
                      <Edit3 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 px-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-5 mt-5 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              As alterações serão refletidas imediatamente na barra lateral de navegação e guardadas nas suas preferências.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className={savedSuccess 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-4 transition-all" 
                : "bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 ml-4"
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  A guardar...
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-white" />
                  Guardado com Sucesso!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Guardar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

