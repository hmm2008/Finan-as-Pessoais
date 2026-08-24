import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  Asset, 
  PropertyExpense, 
  PatrimonioHeader, 
  PatrimonioDistributionChart, 
  AssetCard, 
  AssetImovelForm, 
  AssetFinanceiroForm, 
  AssetOutrosForm, 
  PropertyExpensesSection 
} from '../components/patrimonio';
import { Home, TrendingUp, Box, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { usePrivacy } from '../contexts';

const INITIAL_ASSETS: Asset[] = [];

const INITIAL_PROPERTY_EXPENSES: PropertyExpense[] = [];

export default function PatrimonioView() {
  const { maskValue } = usePrivacy();
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

  const [activeTab, setActiveTab] = useState<'imovel' | 'financeiro' | 'outros'>('imovel');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Modal States
  const [isImovelModalOpen, setIsImovelModalOpen] = useState(false);
  const [isFinanceiroModalOpen, setIsFinanceiroModalOpen] = useState(false);
  const [isOutrosModalOpen, setIsOutrosModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Deletion modals state
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<PropertyExpense | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fin_assets', JSON.stringify(assets));
      localStorage.setItem('fin_patrimonio', JSON.stringify(assets));
    } catch (e) {
      console.error('Erro ao guardar ativos:', e);
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('fin_property_expenses', JSON.stringify(propertyExpenses));
    } catch (e) {
      console.error('Erro ao guardar despesas de imóvel:', e);
    }
  }, [propertyExpenses]);

  const selectedProperty = assets.find(a => a.id === selectedPropertyId && a.category === 'imovel');

  // Handlers for Save / Delete
  const handleSaveAsset = (asset: Asset) => {
    setAssets(prev => {
      const exists = prev.some(a => a.id === asset.id);
      if (exists) {
        return prev.map(a => a.id === asset.id ? asset : a);
      }
      return [asset, ...prev];
    });
    setEditingAsset(null);
  };

  const handleDeleteAssetPermanent = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setPropertyExpenses(prev => prev.filter(pe => pe.assetId !== id));
    if (selectedPropertyId === id) {
      const remainingProps = assets.filter(a => a.id !== id && a.category === 'imovel');
      setSelectedPropertyId(remainingProps.length > 0 ? remainingProps[0].id : null);
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
    else if (asset.category === 'financeiro') setIsFinanceiroModalOpen(true);
    else setIsOutrosModalOpen(true);
  };

  const filteredAssets = assets.filter(a => a.category === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Património & Ativos" 
        subtitle="Consolidação e rentabilidade de imóveis, investimentos financeiros e bens"
      />

      {/* Main Header KPIs & Action Dropdown */}
      <PatrimonioHeader 
        assets={assets}
        onAddImovel={() => { setEditingAsset(null); setIsImovelModalOpen(true); }}
        onAddFinanceiro={() => { setEditingAsset(null); setIsFinanceiroModalOpen(true); }}
        onAddOutros={() => { setEditingAsset(null); setIsOutrosModalOpen(true); }}
      />

      {/* Donut Chart Distribution */}
      <PatrimonioDistributionChart assets={assets} />

      {/* Main Asset Category Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="imovel" className="flex items-center gap-1.5">
            <Home className="w-4 h-4 text-emerald-600" /> Imóveis ({assets.filter(a => a.category === 'imovel').length})
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Financeiros ({assets.filter(a => a.category === 'financeiro').length})
          </TabsTrigger>
          <TabsTrigger value="outros" className="flex items-center gap-1.5">
            <Box className="w-4 h-4 text-amber-600" /> Outros ({assets.filter(a => a.category === 'outros').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="space-y-3">
            {filteredAssets.length === 0 ? (
              <Card className="border-border p-8 text-center text-muted-foreground">
                Nenhum ativo registado nesta categoria. Clique em "Adicionar Ativo" no topo para começar.
              </Card>
            ) : (
              filteredAssets.map(asset => (
                <AssetCard 
                  key={asset.id}
                  asset={asset}
                  onEdit={handleEditAssetClick}
                  onDelete={(a) => setAssetToDelete(a)}
                  onSelectProperty={(p) => setSelectedPropertyId(selectedPropertyId === p.id ? null : p.id)}
                  isSelectedProperty={selectedPropertyId === asset.id}
                />
              ))
            )}
          </div>

          {/* Expanded Property Expenses Section (10.4) for selected property */}
          {activeTab === 'imovel' && selectedProperty && (
            <div className="mt-6 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-lg">
                    Despesas do Imóvel: <span className="text-primary">{selectedProperty.name}</span>
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedPropertyId(null)}
                >
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
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AssetImovelForm 
        isOpen={isImovelModalOpen}
        onClose={() => setIsImovelModalOpen(false)}
        onSave={handleSaveAsset}
        initialData={editingAsset}
      />

      <AssetFinanceiroForm 
        isOpen={isFinanceiroModalOpen}
        onClose={() => setIsFinanceiroModalOpen(false)}
        onSave={handleSaveAsset}
        initialData={editingAsset}
      />

      <AssetOutrosForm 
        isOpen={isOutrosModalOpen}
        onClose={() => setIsOutrosModalOpen(false)}
        onSave={handleSaveAsset}
        initialData={editingAsset}
      />

      {/* Confirm & Trash Delete Modal for Assets */}
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
              ? `${assetToDelete.category === 'imovel' ? 'Imóvel' : assetToDelete.category === 'financeiro' ? 'Ativo Financeiro' : 'Ativo'} "${assetToDelete.name}" (${formatter.format(assetToDelete.currentValue || 0)})`
              : 'Ativo de Património'
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

      {/* Confirm & Trash Delete Modal for Property Expenses */}
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
              : 'Despesa de Imóvel'
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
