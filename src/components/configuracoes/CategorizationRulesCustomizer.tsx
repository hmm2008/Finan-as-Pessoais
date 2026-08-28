import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { useCategorizationRules } from '../../hooks/queries';
import { usePreferences } from '../../contexts/PreferencesContext';
import { scheduleSheetsBackgroundSync, subscribeToSyncStatus, SyncStatusEvent } from '../../lib/googleSheetsDataService';

export function CategorizationRulesCustomizer() {
  const { categorizationRules, addRule, updateRule, deleteRule, isLoading } = useCategorizationRules();
  const { prefs } = usePreferences();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusEvent | null>(null);
  
  // Form states
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [priority, setPriority] = useState(1);

  // Subscribe to sync status
  React.useEffect(() => {
    return subscribeToSyncStatus((event) => {
      setSyncStatus(event);
      if (event.state === 'syncing') setIsSyncing(true);
      else setIsSyncing(false);
    });
  }, []);

  const handleManualSync = () => {
    scheduleSheetsBackgroundSync(0, true);
  };
  
  // Get categories dynamically
  const getAvailableCategories = () => {
    if (type === 'expense') {
      const defaults = ['Alimentação', 'Habitação', 'Transportes', 'Combustível', 'Saúde', 'Lazer', 'Outros'];
      const saved = localStorage.getItem('expense_custom_categories');
      const fixedSaved = localStorage.getItem('fixed_expense_custom_categories');
      
      let custom: string[] = [];
      try {
        if (saved) custom = [...custom, ...JSON.parse(saved)];
        if (fixedSaved) custom = [...custom, ...JSON.parse(fixedSaved)];
      } catch (e) {}
      
      return Array.from(new Set([...defaults, ...custom])).sort();
    } else {
      const defaults = ['Ordenado', 'Rendas', 'Pensões', 'Dividendos', 'Reembolso', 'Prémio/Bónus', 'Prestação de Serviços', 'Outros'];
      const saved = localStorage.getItem('income_custom_categories');
      const fixedSaved = localStorage.getItem('fixed_income_custom_categories');
      
      let custom: string[] = [];
      try {
        if (saved) custom = [...custom, ...JSON.parse(saved)];
        if (fixedSaved) custom = [...custom, ...JSON.parse(fixedSaved)];
      } catch (e) {}
      
      return Array.from(new Set([...defaults, ...custom])).sort();
    }
  };

  const categories = getAvailableCategories();

  const handleAdd = async () => {
    if (!keyword || !category) return;
    
    try {
      await addRule({
        keyword,
        category,
        type,
        priority: Number(priority) || 1,
        createdAt: new Date().toISOString()
      });
      resetForm();
    } catch (err) {
      console.error('Erro ao adicionar regra:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!keyword || !category) return;
    
    try {
      await updateRule({
        id,
        keyword,
        category,
        type,
        priority: Number(priority) || 1
      });
      resetForm();
    } catch (err) {
      console.error('Erro ao atualizar regra:', err);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setKeyword('');
    setCategory('');
    setType('expense');
    setPriority(1);
  };

  const startEdit = (rule: any) => {
    setEditingId(rule.id);
    setKeyword(rule.keyword);
    setCategory(rule.category);
    setType(rule.type || 'expense');
    setPriority(rule.priority || 1);
    setIsAdding(false);
  };

  const filteredRules = categorizationRules.filter((r: any) => 
    r.keyword.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border border-border bg-card shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Regras de Auto-Categorização
            </CardTitle>
            <CardDescription>
              Defina palavras-chave que classificam automaticamente as suas transações
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleManualSync}
              variant="outline"
              size="sm"
              disabled={isSyncing}
              className="gap-2 border-primary/20 hover:bg-primary/5"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-primary" />
              )}
              {isSyncing ? 'A Sincronizar...' : 'Sincronizar Agora'}
            </Button>
            <Button 
              onClick={() => { resetForm(); setIsAdding(true); }} 
              size="sm" 
              className="bg-primary hover:bg-primary/90 gap-2"
              disabled={isAdding || !!editingId}
            >
              <Plus className="w-4 h-4" /> Nova Regra
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Sync Feedback */}
        {syncStatus?.state === 'error' && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Erro na Sincronização:</p>
              <p>{syncStatus.message}</p>
            </div>
          </div>
        )}

        {categorizationRules.length > 0 && syncStatus?.state === 'synced' && (
          <div className="mx-4 mt-4 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>As suas regras estão sincronizadas com o Google Sheets.</span>
          </div>
        )}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por palavra-chave ou categoria..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-6 py-3">Palavra-Chave</th>
                <th className="px-6 py-3">Categoria Sugerida</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Prioridade</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Form Row for Adding */}
              {isAdding && (
                <tr className="bg-primary/5">
                  <td className="px-6 py-4">
                    <Input 
                      placeholder="Ex: Continente" 
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="h-9 text-sm"
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Escolher..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="income">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="h-9 text-sm w-20"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleAdd}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={resetForm}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredRules.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    {isLoading ? 'A carregar regras...' : search ? 'Nenhuma regra corresponde à sua pesquisa.' : 'Ainda não definiu nenhuma regra de categorização.'}
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule: any) => (
                  <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                    {editingId === rule.id ? (
                      <>
                        <td className="px-6 py-4">
                          <Input 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="h-9 text-sm"
                            autoFocus
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <Select value={type} onValueChange={(val: any) => setType(val)}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">Despesa</SelectItem>
                              <SelectItem value="income">Receita</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <Input 
                            type="number"
                            value={priority}
                            onChange={(e) => setPriority(Number(e.target.value))}
                            className="h-9 text-sm w-20"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleUpdate(rule.id)}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={resetForm}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {rule.keyword}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-sm">{rule.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${rule.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {rule.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {rule.type === 'income' ? 'Receita' : 'Despesa'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          P{rule.priority || 1}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(rule)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => deleteRule(rule.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <div className="p-4 bg-muted/20 border-t border-border flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          <p className="font-bold mb-1 text-foreground">Como funciona?</p>
          <p>Quando escreve uma descrição que contenha a <strong>Palavra-Chave</strong>, a aplicação sugere automaticamente a <strong>Categoria</strong> correspondente. A <strong>Prioridade</strong> serve para desempatar se houver várias palavras-chave na mesma frase (prioridade mais alta ganha).</p>
        </div>
      </div>
    </Card>
  );
}
