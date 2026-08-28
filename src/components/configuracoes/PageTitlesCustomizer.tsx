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
  RotateCcw, 
  Check, 
  Heading, 
  Edit3,
  Bookmark,
  Database,
  Wrench,
  Loader2,
  Palette
} from 'lucide-react';

export interface PageConfig {
  id: string;
  defaultTitle: string;
  defaultSubtitle: string;
  icon: React.ElementType;
  description: string;
}

export const MAIN_PAGES_CONFIG: PageConfig[] = [
  { 
    id: '/', 
    defaultTitle: 'Visão Geral', 
    defaultSubtitle: 'O seu painel financeiro interativo', 
    icon: LayoutDashboard, 
    description: 'Dashboard com widgets de saldos, fluxo e gráficos' 
  },
  { 
    id: '/financas', 
    defaultTitle: 'Finanças', 
    defaultSubtitle: 'Gestão de receitas e despesas', 
    icon: Wallet, 
    description: 'Tabelas de movimentos, filtros e exportações' 
  },
  { 
    id: '/receitas-fixas', 
    defaultTitle: 'Receitas Fixas', 
    defaultSubtitle: 'Rendimentos e receitas recorrentes previstas', 
    icon: TrendingUp, 
    description: 'Previsão de salários, pensões e outras receitas fixas' 
  },
  { 
    id: '/despesas-fixas', 
    defaultTitle: 'Despesas Fixas', 
    defaultSubtitle: 'Contratos e pagamentos recorrentes', 
    icon: Calendar, 
    description: 'Rendas, empréstimos, telecomunicações e alertas de débito' 
  },
  { 
    id: '/orcamentos', 
    defaultTitle: 'Orçamentos', 
    defaultSubtitle: 'Planeamento orçamental e limites de gastos por categoria', 
    icon: CreditCard, 
    description: 'Tetos orçamentais e limites mensais' 
  },
  { 
    id: '/patrimonio', 
    defaultTitle: 'Património & Ativos', 
    defaultSubtitle: 'Consolidação e rentabilidade de imóveis, investimentos financeiros e bens', 
    icon: TrendingUp, 
    description: 'Gestão de imóveis, ativos financeiros e bens de valor' 
  },
  { 
    id: '/viaturas', 
    defaultTitle: 'Gestão de Viaturas', 
    defaultSubtitle: 'Manutenções, inspeções, custos de combustível e alertas', 
    icon: Car, 
    description: 'Quilometragem, abastecimentos e revisões de veículos' 
  },
  { 
    id: '/objectivos', 
    defaultTitle: 'Objetivos & Poupança', 
    defaultSubtitle: 'Acompanhamento e simulação de metas financeiras de curto, médio e longo prazo', 
    icon: Target, 
    description: 'Metas de poupança, simulador e progresso financeiro' 
  },
  { 
    id: '/utilitarios', 
    defaultTitle: 'Utilitários & Relatórios', 
    defaultSubtitle: 'Geração de relatórios mensais e anuais (PDF, JSON, Excel), cópias de segurança e ferramentas do sistema', 
    icon: Wrench, 
    description: 'Relatórios mensais/anuais em vários formatos e cópias de segurança' 
  },
  { 
    id: '/lixeira', 
    defaultTitle: 'Reciclagem & Recuperação', 
    defaultSubtitle: 'Gerencie os itens eliminados do sistema com opção de restauro ou eliminação definitiva', 
    icon: Trash2, 
    description: 'Área de segurança para restauração de registos apagados' 
  },
  { 
    id: '/configuracoes', 
    defaultTitle: 'Configurações', 
    defaultSubtitle: 'Definições do sistema, segurança e personalização', 
    icon: Settings, 
    description: 'Aparência, segurança com PIN, categorias e títulos' 
  }
];

export function PageTitlesCustomizer() {
  const { prefs, updatePrefs } = usePreferences();
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [subtitles, setSubtitles] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Initialize from preferences
  useEffect(() => {
    if (isModified) return;

    const currentTitles = prefs.pageTitles || {};
    const currentSubtitles = prefs.pageSubtitles || {};

    const initialTitles: Record<string, string> = {};
    const initialSubtitles: Record<string, string> = {};

    MAIN_PAGES_CONFIG.forEach(page => {
      initialTitles[page.id] = currentTitles[page.id] || page.defaultTitle;
      initialSubtitles[page.id] = currentSubtitles[page.id] !== undefined ? currentSubtitles[page.id] : page.defaultSubtitle;
    });

    setTitles(initialTitles);
    setSubtitles(initialSubtitles);
  }, [prefs.pageTitles, prefs.pageSubtitles]);

  const handleTitleChange = (id: string, value: string) => {
    setTitles(prev => {
      const next = { ...prev, [id]: value };
      setIsModified(true);
      return next;
    });
    setSavedSuccess(false);
  };

  const handleSubtitleChange = (id: string, value: string) => {
    setSubtitles(prev => {
      const next = { ...prev, [id]: value };
      setIsModified(true);
      return next;
    });
    setSavedSuccess(false);
  };

  const handleResetSingle = (id: string, defaultTitle: string, defaultSubtitle: string) => {
    setTitles(prev => ({ ...prev, [id]: defaultTitle }));
    setSubtitles(prev => ({ ...prev, [id]: defaultSubtitle }));
    setIsModified(true);
  };

  const handleResetAll = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    const resetTitles: Record<string, string> = {};
    const resetSubtitles: Record<string, string> = {};

    MAIN_PAGES_CONFIG.forEach(page => {
      resetTitles[page.id] = page.defaultTitle;
      resetSubtitles[page.id] = page.defaultSubtitle;
    });

    setTitles(resetTitles);
    setSubtitles(resetSubtitles);
    setIsModified(false);

    try {
      await updatePrefs({ pageTitles: resetTitles, pageSubtitles: resetSubtitles });
      
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao repor títulos:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const [pageTitleStyle, setPageTitleStyle] = useState<TextStyle>(prefs.customStyles?.pageTitles || {});
  const [globalStyle, setGlobalStyle] = useState<TextStyle>(prefs.customStyles?.global || {});

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const cleanedTitles: Record<string, string> = {};
      const cleanedSubtitles: Record<string, string> = {};

      MAIN_PAGES_CONFIG.forEach(page => {
        const currTitle = (titles[page.id] || '').trim();
        const currSubtitle = (subtitles[page.id] || '').trim();

        cleanedTitles[page.id] = currTitle || page.defaultTitle;
        cleanedSubtitles[page.id] = currSubtitle !== '' ? currSubtitle : page.defaultSubtitle;
      });

      setTitles(cleanedTitles);
      setSubtitles(cleanedSubtitles);

      await updatePrefs({ 
        pageTitles: cleanedTitles, 
        pageSubtitles: cleanedSubtitles,
        customStyles: {
          ...prefs.customStyles,
          pageTitles: pageTitleStyle,
          global: globalStyle
        }
      });

      setIsModified(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao guardar títulos:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-border bg-card shadow-sm rounded-xl relative">
      {/* Floating Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white shadow-2xl px-5 py-3.5 rounded-xl flex items-center gap-3 font-medium text-sm border border-emerald-500/50 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white stroke-[3]" />
          </div>
          <div>
            <p className="font-semibold text-white">Títulos das Páginas Guardados!</p>
            <p className="text-xs text-emerald-100">Atualizado nos cabeçalhos e sincronizado na Google Drive.</p>
          </div>
        </div>
      )}

      <CardHeader className="border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Heading className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Personalizar Nomes das Páginas Principais</CardTitle>
              <CardDescription>
                Altere os títulos principais e subtítulos apresentados no topo de cada página da aplicação.
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
            <span>Títulos e cabeçalhos das páginas atualizados com sucesso e sincronizados com a Google Drive!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextStyleEditor 
              label="Aspeto Visual dos Títulos (Topo da Página)" 
              style={pageTitleStyle} 
              onChange={setPageTitleStyle} 
              onReset={() => setPageTitleStyle({})}
            />

            <div className="space-y-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Cor de Fundo do Cabeçalho
              </Label>
              <div className="p-4 rounded-xl border border-border bg-secondary/10 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { color: 'transparent', label: 'Transparente (Padrão)' },
                    { color: '#f8fafc', label: 'Slate 50' },
                    { color: '#f1f5f9', label: 'Slate 100' },
                    { color: '#f8fafc00', label: 'Nenhum' },
                    { color: '#eef2ff', label: 'Indigo 50' },
                    { color: '#e0e7ff', label: 'Indigo 100' },
                    { color: '#f5f3ff', label: 'Violet 50' },
                    { color: '#ede9fe', label: 'Violet 100' },
                    { color: '#0f172a', label: 'Slate 900' },
                    { color: '#1e293b', label: 'Slate 800' },
                    { color: '#312e81', label: 'Indigo 900' },
                    { color: '#1e1b4b', label: 'Indigo 950' },
                  ].map((colorObj) => (
                    <button
                      key={colorObj.color}
                      type="button"
                      onClick={() => setPageTitleStyle(prev => ({ ...prev, backgroundColor: colorObj.color }))}
                      className={`w-9 h-9 rounded-lg border-2 transition-all hover:scale-105 shrink-0 flex items-center justify-center ${
                        pageTitleStyle.backgroundColor === colorObj.color 
                          ? 'border-primary ring-2 ring-primary/20 scale-105' 
                          : 'border-border/40'
                      }`}
                      style={{ backgroundColor: colorObj.color === 'transparent' ? undefined : colorObj.color }}
                      title={colorObj.label}
                    >
                      {colorObj.color === 'transparent' && <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  ))}
                  
                  {/* Custom Color Input */}
                  <div className="relative group">
                    <input
                      type="color"
                      value={pageTitleStyle.backgroundColor && pageTitleStyle.backgroundColor !== 'transparent' ? pageTitleStyle.backgroundColor : '#ffffff'}
                      onChange={(e) => setPageTitleStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-9 h-9 p-0 rounded-lg border-2 border-border/40 cursor-pointer overflow-hidden"
                      title="Escolher cor personalizada"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPageTitleStyle(prev => {
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
                    style={{ backgroundColor: pageTitleStyle.backgroundColor || 'transparent' }}
                  >
                    <span className="text-xs font-bold" style={{ color: pageTitleStyle.color }}>Aa</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium">Pré-visualização do Fundo</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {pageTitleStyle.backgroundColor || 'Transparente'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nova Secção: Cor de Fundo da Aplicação */}
            <div className="space-y-4 md:col-span-2 border-t border-border/50 pt-6">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Cor de Fundo da Área de Conteúdo (Resto da Aplicação)
              </Label>
              <div className="p-5 rounded-xl border border-border bg-secondary/5 space-y-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Esta cor será aplicada a toda a área de trabalho da aplicação onde os dados e tabelas são apresentados.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { color: '', label: 'Padrão (Fundo do Sistema)' },
                    { color: '#ffffff', label: 'Branco Puro' },
                    { color: '#fafafa', label: 'Neutral 50' },
                    { color: '#f4f4f5', label: 'Zinc 50' },
                    { color: '#fdfcfb', label: 'Warm White' },
                    { color: '#fcfcfc', label: 'Cool White' },
                    { color: '#f5f5f5', label: 'Gray 100' },
                    { color: '#09090b', label: 'Zinc 950' },
                    { color: '#020617', label: 'Slate 950' },
                    { color: '#030712', label: 'Gray 950' },
                    { color: '#0a0a0a', label: 'Neutral 950' },
                  ].map((colorObj) => (
                    <button
                      key={colorObj.color}
                      type="button"
                      onClick={() => setGlobalStyle(prev => ({ ...prev, backgroundColor: colorObj.color }))}
                      className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-105 shrink-0 flex items-center justify-center ${
                        (globalStyle.backgroundColor || '') === colorObj.color 
                          ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md' 
                          : 'border-border/40'
                      }`}
                      style={{ backgroundColor: colorObj.color || undefined }}
                      title={colorObj.label}
                    >
                      {colorObj.color === '' && <RotateCcw className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  ))}
                  
                  {/* Custom Color Input */}
                  <div className="relative group">
                    <input
                      type="color"
                      value={globalStyle.backgroundColor || '#ffffff'}
                      onChange={(e) => setGlobalStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-10 h-10 p-0 rounded-xl border-2 border-border/40 cursor-pointer overflow-hidden shadow-sm"
                      title="Escolher cor personalizada para o fundo"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGlobalStyle(prev => {
                      const { backgroundColor, ...rest } = prev;
                      return rest;
                    })}
                    className="h-10 px-3 rounded-xl border-2 border-dashed border-border/60 hover:border-destructive hover:text-destructive"
                    title="Remover fundo personalizado"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    <span className="text-xs">Repor Fundo</span>
                  </Button>
                </div>

                <div className="flex items-center gap-4 p-3 bg-background/50 rounded-lg border border-border/40">
                  <div 
                    className="w-16 h-10 rounded-lg border border-border shadow-inner"
                    style={{ backgroundColor: globalStyle.backgroundColor || 'var(--background)' }}
                  />
                  <div>
                    <p className="text-xs font-bold">Pré-visualização</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">
                      {globalStyle.backgroundColor || 'DINÂMICO (TEMA)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MAIN_PAGES_CONFIG.map((page) => {
              const Icon = page.icon;
              const currentTitle = titles[page.id] ?? page.defaultTitle;
              const currentSubtitle = subtitles[page.id] ?? page.defaultSubtitle;
              const isTitleCustomized = currentTitle !== page.defaultTitle;
              const isSubtitleCustomized = currentSubtitle !== page.defaultSubtitle;
              const isPageCustomized = isTitleCustomized || isSubtitleCustomized;

              return (
                <div 
                  key={page.id}
                  className={`p-4 rounded-xl border transition-colors space-y-3 ${
                    isPageCustomized 
                      ? 'border-primary/40 bg-primary/5' 
                      : 'border-border/60 bg-secondary/20 hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center text-primary shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground/90 block truncate">
                          Rota: <span className="font-mono text-muted-foreground">{page.id}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {page.description}
                        </span>
                      </div>
                    </div>

                    {isPageCustomized && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetSingle(page.id, page.defaultTitle, page.defaultSubtitle)}
                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive shrink-0"
                        title="Repor título e subtítulo originais"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Repor
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-foreground/80 flex items-center justify-between">
                        <span>Título Principal da Página</span>
                        {isTitleCustomized && (
                          <span className="text-[10px] text-primary font-normal">Personalizado</span>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          value={currentTitle}
                          onChange={(e) => handleTitleChange(page.id, e.target.value)}
                          placeholder={page.defaultTitle}
                          className="text-sm h-8.5 bg-background pr-8"
                        />
                        <Edit3 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        <span>Subtítulo / Descrição Superior</span>
                        {isSubtitleCustomized && (
                          <span className="text-[10px] text-primary font-normal">Personalizado</span>
                        )}
                      </Label>
                      <Input
                        value={currentSubtitle}
                        onChange={(e) => handleSubtitleChange(page.id, e.target.value)}
                        placeholder={page.defaultSubtitle}
                        className="text-xs h-8 bg-background text-muted-foreground focus:text-foreground"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-5 mt-5 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Os títulos e subtítulos definidos aqui serão imediatamente visíveis no cabeçalho superior de cada página.
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
                  Guardar Títulos das Páginas
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
