import React, { useState, useEffect } from 'react';
import { Asset, PropertyExpense } from '../components/patrimonio/types';
import { PageHeader } from '../components/layout';
import { 
  PatrimonioHeader, 
  PatrimonioDistributionChart, 
  AssetCard, 
  AssetImovelForm, 
  AssetFinanceiroForm, 
  PropertyExpensesSection 
} from '../components/patrimonio';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { Building2, X, Plus, LayoutGrid, Info } from 'lucide-react';
import { scheduleSheetsBackgroundSync } from '../lib/googleSheetsDataService';
import { motion, AnimatePresence } from 'motion/react';

export default function PatrimonioView() {
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem('fin_assets') || localStorage.getItem('fin_patrimonio');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar ativos:', e);
    }
    return [];
  });

  const [propertyExpenses, setPropertyExpenses] = useState<PropertyExpense[]>(() => {
    try {
      const saved = localStorage.getItem('fin_property_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar despesas de imóveis:', e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'imovel' | 'financeiro'>('imovel');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Modal States
  const [isImovelModalOpen, setIsImovelModalOpen] = useState(false);
  const [isFinanceiroModalOpen, setIsFinanceiroModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Deletion modals state
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<PropertyExpense | null>(null);

  // Sync to localStorage and trigger background Google Sheets sync
  useEffect(() => {
    try {
      localStorage.setItem('fin_assets', JSON.stringify(assets));
      localStorage.setItem('fin_patrimonio', JSON.stringify(assets));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      scheduleSheetsBackgroundSync();
    } catch (e) {
      console.error('Erro ao guardar ativos:', e);
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('fin_property_expenses', JSON.stringify(propertyExpenses));
      scheduleSheetsBackgroundSync();
    } catch (e) {
      console.error('Erro ao guardar despesas de imóvel:', e);
    }
  }, [propertyExpenses]);

  const selectedProperty = assets.find(a => a.id === selectedPropertyId && a.category === 'imovel');

  // Handlers for Save / Delete
  const handleSaveAsset = (asset: Asset, newExpenses?: PropertyExpense[]) => {
    setAssets(prev => {
      const exists = prev.some(a => a.id === asset.id);
      if (exists) {
        return prev.map(a => a.id === asset.id ? asset : a);
      }
      return [asset, ...prev];
    });

    if (newExpenses && newExpenses.length > 0) {
      setPropertyExpenses(prev => {
        const otherExpenses = prev.filter(pe => pe.assetId !== asset.id);
        return [...otherExpenses, ...newExpenses];
      });

      try {
        const savedFixed = localStorage.getItem('fin_fixed_expenses');
        let currentFixed = savedFixed ? JSON.parse(savedFixed) : [];
        if (!Array.isArray(currentFixed)) currentFixed = [];

        const filteredFixed = currentFixed.filter((fe: any) => fe.assetId !== asset.id);
        const newFixedToAdd = newExpenses.map(pe => ({
          id: pe.fixedExpenseId || `fe_prop_${pe.id}`,
          name: `${pe.category} - ${asset.name}`,
          entity: asset.name,
          category: pe.category === 'Condomínio' ? 'Habitação' : pe.category === 'IMI' ? 'Impostos' : pe.category === 'Seguro Multirriscos' ? 'Seguros' : 'Outros',
          amount: pe.amount,
          dueDateDay: pe.dueDate ? new Date(pe.dueDate).getDate() : 1,
          dueDay: pe.dueDate ? new Date(pe.dueDate).getDate() : 1,
          startDate: pe.startDate,
          endDate: pe.endDate,
          dueDate: pe.dueDate,
          paymentMethod: 'Transferência Bancária',
          active: true,
          assetId: asset.id,
          notes: `Custo Fixo do Imóvel: ${asset.name}. ${pe.notes || ''}`
        }));

        localStorage.setItem('fin_fixed_expenses', JSON.stringify([...filteredFixed, ...newFixedToAdd]));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.error('Erro ao guardar custos fixos:', e);
      }
    }

    setEditingAsset(null);
  };

  const handleDeleteAssetPermanent = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setPropertyExpenses(prev => prev.filter(pe => pe.assetId !== id));
    if (selectedPropertyId === id) {
      setSelectedPropertyId(null);
    }
  };

  const handleAddPropertyExpense = (expense: PropertyExpense) => {
    setPropertyExpenses(prev => [...prev, expense]);
    
    // Also sync to global fixed expenses if needed
    if (expense.fixedExpenseId) {
      try {
        const savedFixed = localStorage.getItem('fin_fixed_expenses');
        let currentFixed = savedFixed ? JSON.parse(savedFixed) : [];
        if (!Array.isArray(currentFixed)) currentFixed = [];
        
        const asset = assets.find(a => a.id === expense.assetId);
        const assetName = asset?.name || 'Imóvel';

        const newFixed = {
          id: expense.fixedExpenseId,
          name: `${expense.category} - ${assetName}`,
          entity: assetName,
          category: expense.category === 'Condomínio' ? 'Habitação' : expense.category === 'IMI' ? 'Impostos' : expense.category === 'Seguro Multirriscos' ? 'Seguros' : 'Outros',
          amount: expense.amount,
          dueDateDay: expense.dueDate ? new Date(expense.dueDate).getDate() : 1,
          dueDay: expense.dueDate ? new Date(expense.dueDate).getDate() : 1,
          startDate: expense.startDate,
          endDate: expense.endDate,
          dueDate: expense.dueDate,
          paymentMethod: 'Transferência Bancária',
          active: true,
          assetId: expense.assetId,
          notes: `Custo Fixo do Imóvel: ${assetName}. ${expense.notes || ''}`
        };

        localStorage.setItem('fin_fixed_expenses', JSON.stringify([...currentFixed, newFixed]));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.error('Erro ao adicionar custo fixo global:', e);
      }
    }
  };

  const handleDeletePropertyExpensePermanent = (id: string) => {
    setPropertyExpenses(prev => prev.filter(pe => pe.id !== id));
  };

  const handleEditAssetClick = (asset: Asset) => {
    setEditingAsset(asset);
    if (asset.category === 'imovel') setIsImovelModalOpen(true);
    else setIsFinanceiroModalOpen(true);
  };

  const filteredAssets = assets.filter(a => a.category === activeTab);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 py-10"
    >
      <PageHeader 
        title="Património & Investimentos" 
        subtitle="Controlo detalhado da sua riqueza e ativos imobiliários"
      >
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => { 
              setEditingAsset(null); 
              if (activeTab === 'imovel') setIsImovelModalOpen(true);
              else setIsFinanceiroModalOpen(true);
            }}
            className="rounded-2xl h-11 px-6 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'imovel' ? 'Novo Imóvel' : 'Novo Ativo'}
          </Button>
        </div>
      </PageHeader>

      {/* Top Header & Toggle Tabs & KPI Cards */}
      <PatrimonioHeader 
        assets={assets}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedPropertyId(null);
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="space-y-10"
        >
          {/* Middle Charts */}
          <PatrimonioDistributionChart assets={assets} activeTab={activeTab} />

          {/* Assets Section Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Carteira de {activeTab === 'imovel' ? 'Imóveis' : 'Ativos Financeiros'}</h3>
            </div>
            {filteredAssets.length > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/40">
                {filteredAssets.length} {filteredAssets.length === 1 ? 'Registo' : 'Registos'}
              </span>
            )}
          </div>

          {/* Assets Grid */}
          <div className="min-h-[200px]">
            {filteredAssets.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-border/40 p-16 text-center bg-transparent">
                <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
                  <Building2 className="w-10 h-10" />
                </div>
                <h4 className="text-base font-black uppercase tracking-widest text-foreground mb-2">Sem ativos registados</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Comece a construir o seu portefólio adicionando o seu primeiro {activeTab === 'imovel' ? 'imóvel' : 'investimento financeiro'}.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => activeTab === 'imovel' ? setIsImovelModalOpen(true) : setIsFinanceiroModalOpen(true)}
                  className="mt-6 rounded-xl border-primary/30 text-primary hover:bg-indigo-50 transition-colors"
                >
                  Adicionar Agora
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map(asset => (
                  <motion.div
                    key={asset.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <AssetCard 
                      asset={{
                        ...asset,
                        expenses: propertyExpenses.filter(pe => pe.assetId === asset.id)
                      }}
                      onEdit={handleEditAssetClick}
                      onDelete={(a) => setAssetToDelete(a)}
                      onSelectProperty={(p) => setSelectedPropertyId(selectedPropertyId === p.id ? null : p.id)}
                      isSelectedProperty={selectedPropertyId === asset.id}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Property Expenses Panel */}
          <AnimatePresence>
            {activeTab === 'imovel' && selectedProperty && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 30 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 30 }}
                className="overflow-hidden"
              >
                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-border/40 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl tracking-tight text-foreground">
                            Análise de Custos: <span className="text-primary dark:text-primary/80">{selectedProperty.name}</span>
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Info className="w-3 h-3 text-muted-foreground" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Controlo de Seguros, IMI e Manutenção</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedPropertyId(null)}
                        className="rounded-2xl h-12 w-12 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <PropertyExpensesSection 
                      asset={selectedProperty}
                      expenses={propertyExpenses}
                      onAddExpense={handleAddPropertyExpense}
                      onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                    />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AssetImovelForm 
        isOpen={isImovelModalOpen}
        onClose={() => setIsImovelModalOpen(false)}
        onSave={handleSaveAsset}
        initialData={editingAsset}
        initialExpenses={propertyExpenses}
      />

      <AssetFinanceiroForm 
        isOpen={isFinanceiroModalOpen}
        onClose={() => setIsFinanceiroModalOpen(false)}
        onSave={handleSaveAsset}
        initialData={editingAsset}
      />

      {/* Confirm & Delete Modal for Assets */}
      <ConfirmDeleteModal
        open={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirmPermanent={() => {
          if (assetToDelete) {
            handleDeleteAssetPermanent(assetToDelete.id);
            setAssetToDelete(null);
          }
        }}
        entityLabel={
          assetToDelete?.name
            ? `${assetToDelete.category === 'imovel' ? 'Imóvel' : 'Ativo'} "${assetToDelete.name}" (${formatter.format(assetToDelete.currentValue || 0)})`
            : 'Ativo'
        }
        entityName="Património"
        entityId={assetToDelete?.id || ''}
        entityData={assetToDelete}
        onMoveToTrashSuccess={() => {
          if (assetToDelete) {
            handleDeleteAssetPermanent(assetToDelete.id);
            setAssetToDelete(null);
          }
        }}
      />

      {/* Confirm & Delete Modal for Property Expenses */}
      <ConfirmDeleteModal
        open={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirmPermanent={() => {
          if (expenseToDelete) {
            handleDeletePropertyExpensePermanent(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        entityLabel={
          expenseToDelete?.title
            ? `Despesa de Imóvel "${expenseToDelete.title}" (${formatter.format(expenseToDelete.amount || 0)})`
            : 'Despesa'
        }
        entityName="Património"
        entityId={expenseToDelete?.id || ''}
        entityData={expenseToDelete}
        onMoveToTrashSuccess={() => {
          if (expenseToDelete) {
            handleDeletePropertyExpensePermanent(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
      />
    </motion.div>
  );
}
