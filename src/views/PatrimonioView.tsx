import React, { useState, useEffect } from 'react';
import { Asset, PropertyExpense } from '../components/patrimonio/types';
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
import { Building2, X } from 'lucide-react';
import { scheduleSheetsBackgroundSync } from '../lib/googleSheetsDataService';

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
          dueDateDay: pe.dayOfMonth || 1,
          dueDay: pe.dayOfMonth || 1,
          paymentMethod: 'Transferência Bancária',
          active: true,
          assetId: asset.id,
          notes: `Custo Fixo do Imóvel: ${asset.name}`
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Header & Toggle Tabs & KPI Cards */}
      <PatrimonioHeader 
        assets={assets}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedPropertyId(null);
        }}
        onAddImovel={() => { setEditingAsset(null); setIsImovelModalOpen(true); }}
        onAddFinanceiro={() => { setEditingAsset(null); setIsFinanceiroModalOpen(true); }}
      />

      {/* Middle Charts */}
      <PatrimonioDistributionChart assets={assets} activeTab={activeTab} />

      {/* Assets Grid (3 Columns) */}
      <div className="space-y-4">
        {filteredAssets.length === 0 ? (
          <Card className="rounded-2xl border border-border/80 p-12 text-center text-muted-foreground">
            <p className="text-base font-medium">Nenhum ativo registado nesta categoria.</p>
            <p className="text-xs mt-1">
              Clique em "{activeTab === 'imovel' ? 'Novo Imóvel' : 'Novo Ativo'}" no topo para adicionar o seu primeiro ativo.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id}
                asset={asset}
                onEdit={handleEditAssetClick}
                onDelete={(a) => setAssetToDelete(a)}
                onSelectProperty={(p) => setSelectedPropertyId(selectedPropertyId === p.id ? null : p.id)}
                isSelectedProperty={selectedPropertyId === asset.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Expenses Panel (When an imóvel is selected) */}
      {activeTab === 'imovel' && selectedProperty && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg text-foreground">
                Despesas do Imóvel: <span className="text-indigo-600 dark:text-indigo-400">{selectedProperty.name}</span>
              </h3>
            </div>
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedPropertyId(null)}
              className="rounded-full"
            >
              <X className="w-4 h-4 mr-1" />
              Fechar Painel
            </Button>
          </div>

          <PropertyExpensesSection 
            asset={selectedProperty}
            expenses={propertyExpenses}
            onAddExpense={handleAddPropertyExpense}
            onDeleteExpense={(exp) => setExpenseToDelete(exp)}
          />
        </div>
      )}

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
      {assetToDelete && (
        <ConfirmDeleteModal
          open={!!assetToDelete}
          onClose={() => setAssetToDelete(null)}
          onConfirmPermanent={() => {
            handleDeleteAssetPermanent(assetToDelete.id);
            setAssetToDelete(null);
          }}
          entityLabel={
            assetToDelete.name
              ? `${assetToDelete.category === 'imovel' ? 'Imóvel' : 'Ativo'} "${assetToDelete.name}" (${formatter.format(assetToDelete.currentValue || 0)})`
              : 'Ativo'
          }
          entityName="Património"
          entityId={assetToDelete.id}
          entityData={assetToDelete}
          onMoveToTrashSuccess={() => {
            handleDeleteAssetPermanent(assetToDelete.id);
            setAssetToDelete(null);
          }}
        />
      )}

      {/* Confirm & Delete Modal for Property Expenses */}
      {expenseToDelete && (
        <ConfirmDeleteModal
          open={!!expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onConfirmPermanent={() => {
            handleDeletePropertyExpensePermanent(expenseToDelete.id);
            setExpenseToDelete(null);
          }}
          entityLabel={
            expenseToDelete.title
              ? `Despesa de Imóvel "${expenseToDelete.title}" (${formatter.format(expenseToDelete.amount || 0)})`
              : 'Despesa'
          }
          entityName="Património"
          entityId={expenseToDelete.id}
          entityData={expenseToDelete}
          onMoveToTrashSuccess={() => {
            handleDeletePropertyExpensePermanent(expenseToDelete.id);
            setExpenseToDelete(null);
          }}
        />
      )}
    </div>
  );
}
