import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Asset, PropertyExpense, PropertyIncome } from '../components/patrimonio/types';
import { Transaction } from '../api/base44Client';
import { PageHeader } from '../components/layout';
import { 
  PatrimonioHeader, 
  PatrimonioDistributionChart, 
  AssetCard, 
  AssetImovelForm, 
  AssetFinanceiroForm, 
  PropertyExpensesSection,
  PropertyIncomesSection,
  PropertyFinancialSummary,
  PropertyRealExpensesCard
} from '../components/patrimonio';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { Building2, X, Plus, LayoutGrid, Info, TrendingUp } from 'lucide-react';
import { scheduleSheetsBackgroundSync } from '../lib/googleSheetsDataService';
import { motion, AnimatePresence } from 'motion/react';

export default function PatrimonioView() {
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const queryClient = useQueryClient();

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

  const [propertyIncomes, setPropertyIncomes] = useState<PropertyIncome[]>(() => {
    try {
      const saved = localStorage.getItem('fin_property_incomes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar rendimentos de imóveis:', e);
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('fin_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar transações:', e);
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
  const detailsRef = useRef<HTMLDivElement>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<PropertyExpense | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<PropertyIncome | null>(null);

  // Listen to 'storage' events from other parts of the app (other tabs / windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only react if this was triggered from another window or explicitly matching our keys
      if (e && e.key && !['fin_assets', 'fin_patrimonio', 'fin_property_expenses', 'fin_property_incomes'].includes(e.key)) {
        return;
      }
      try {
        const savedAssets = localStorage.getItem('fin_assets') || localStorage.getItem('fin_patrimonio');
        if (savedAssets) {
          const parsed = JSON.parse(savedAssets);
          if (Array.isArray(parsed)) setAssets(parsed);
        }
        
        const savedExpenses = localStorage.getItem('fin_property_expenses');
        if (savedExpenses) {
          const parsed = JSON.parse(savedExpenses);
          if (Array.isArray(parsed)) setPropertyExpenses(parsed);
        }

        const savedIncomes = localStorage.getItem('fin_property_incomes');
        if (savedIncomes) {
          const parsed = JSON.parse(savedIncomes);
          if (Array.isArray(parsed)) setPropertyIncomes(parsed);
        }
      } catch (err) {
        console.error('Error syncing from localStorage event:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Scroll to details when property is selected
  useEffect(() => {
    if (selectedPropertyId && detailsRef.current) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    try {
      localStorage.setItem('fin_assets', JSON.stringify(assets));
      localStorage.setItem('fin_patrimonio', JSON.stringify(assets));
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      scheduleSheetsBackgroundSync(1000);
    } catch (e) {
      console.error('Erro ao guardar ativos:', e);
    }
  }, [assets, queryClient]);

  useEffect(() => {
    try {
      localStorage.setItem('fin_property_expenses', JSON.stringify(propertyExpenses));
      queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });
      scheduleSheetsBackgroundSync(1000);
    } catch (e) {
      console.error('Erro ao guardar despesas de imóvel:', e);
    }
  }, [propertyExpenses, queryClient]);

  useEffect(() => {
    try {
      localStorage.setItem('fin_property_incomes', JSON.stringify(propertyIncomes));
      queryClient.invalidateQueries({ queryKey: ['fixedIncomes'] });
      scheduleSheetsBackgroundSync(1000);
    } catch (e) {
      console.error('Erro ao guardar rendimentos de imóvel:', e);
    }
  }, [propertyIncomes, queryClient]);

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    localStorage.setItem('fin_expenses', JSON.stringify([transaction, ...transactions]));
  };

  const selectedAsset = assets.find(a => a.id === selectedPropertyId);

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

      // Sync fixed expenses from AssetImovelForm or AssetFinanceiroForm
      newExpenses.forEach(pe => {
        if (pe.frequency !== 'pontual') {
          syncPropertyExpenseToFixed(pe);
        } else {
          syncPropertyExpenseToPontual(pe);
        }
      });
    }

    setEditingAsset(null);
  };

  const updateAssetExpensesEmbedded = (expense: PropertyExpense) => {
    try {
      const saved = localStorage.getItem('fin_assets') || localStorage.getItem('fin_patrimonio');
      if (!saved) return;
      let currentAssets = JSON.parse(saved);
      if (!Array.isArray(currentAssets)) return;

      let changed = false;
      currentAssets = currentAssets.map((ast: any) => {
        if (String(ast.id) === String(expense.assetId)) {
          let list = Array.isArray(ast.expenses) ? ast.expenses : [];
          const exists = list.some((e: any) => String(e.id) === String(expense.id));
          if (exists) {
            list = list.map((e: any) => String(e.id) === String(expense.id) ? expense : e);
          } else {
            list = [...list, expense];
          }
          changed = true;
          return { ...ast, expenses: list };
        }
        return ast;
      });

      if (changed) {
        localStorage.setItem('fin_assets', JSON.stringify(currentAssets));
        localStorage.setItem('fin_patrimonio', JSON.stringify(currentAssets));
        setAssets(currentAssets);
      }
    } catch (e) {
      console.error('Erro ao atualizar encargos embebidos no ativo:', e);
    }
  };

  const removeAssetExpenseEmbedded = (expenseId: string) => {
    try {
      const saved = localStorage.getItem('fin_assets') || localStorage.getItem('fin_patrimonio');
      if (!saved) return;
      let currentAssets = JSON.parse(saved);
      if (!Array.isArray(currentAssets)) return;

      let changed = false;
      currentAssets = currentAssets.map((ast: any) => {
        if (Array.isArray(ast.expenses)) {
          const filtered = ast.expenses.filter((e: any) => String(e.id) !== String(expenseId));
          if (filtered.length !== ast.expenses.length) {
            changed = true;
            return { ...ast, expenses: filtered };
          }
        }
        return ast;
      });

      if (changed) {
        localStorage.setItem('fin_assets', JSON.stringify(currentAssets));
        localStorage.setItem('fin_patrimonio', JSON.stringify(currentAssets));
        setAssets(currentAssets);
      }
    } catch (e) {
      console.error('Erro ao remover encargo embebido no ativo:', e);
    }
  };

  const updateAssetIncomesEmbedded = (income: PropertyIncome) => {
    try {
      const saved = localStorage.getItem('fin_assets') || localStorage.getItem('fin_patrimonio');
      if (!saved) return;
      let currentAssets = JSON.parse(saved);
      if (!Array.isArray(currentAssets)) return;

      let changed = false;
      currentAssets = currentAssets.map((ast: any) => {
        if (String(ast.id) === String(income.assetId)) {
          let list = Array.isArray(ast.incomes) ? ast.incomes : [];
          const exists = list.some((i: any) => String(i.id) === String(income.id));
          if (exists) {
            list = list.map((i: any) => String(i.id) === String(income.id) ? income : i);
          } else {
            list = [...list, income];
          }
          changed = true;
          return { ...ast, incomes: list };
        }
        return ast;
      });

      if (changed) {
        localStorage.setItem('fin_assets', JSON.stringify(currentAssets));
        localStorage.setItem('fin_patrimonio', JSON.stringify(currentAssets));
        setAssets(currentAssets);
      }
    } catch (e) {
      console.error('Erro ao atualizar rendimentos embebidos no ativo:', e);
    }
  };

  const removeAssetIncomeEmbedded = (incomeId: string) => {
    try {
      const saved = localStorage.getItem('fin_assets') || localStorage.getItem('fin_patrimonio');
      if (!saved) return;
      let currentAssets = JSON.parse(saved);
      if (!Array.isArray(currentAssets)) return;

      let changed = false;
      currentAssets = currentAssets.map((ast: any) => {
        if (Array.isArray(ast.incomes)) {
          const filtered = ast.incomes.filter((i: any) => String(i.id) !== String(incomeId));
          if (filtered.length !== ast.incomes.length) {
            changed = true;
            return { ...ast, incomes: filtered };
          }
        }
        return ast;
      });

      if (changed) {
        localStorage.setItem('fin_assets', JSON.stringify(currentAssets));
        localStorage.setItem('fin_patrimonio', JSON.stringify(currentAssets));
        setAssets(currentAssets);
      }
    } catch (e) {
      console.error('Erro ao remover rendimento embebido no ativo:', e);
    }
  };

  const handleDeleteAssetPermanent = (id: string) => {
    setAssets(prev => prev.filter(a => String(a.id) !== String(id)));
    setPropertyExpenses(prev => {
      const next = prev.filter(pe => String(pe.assetId) !== String(id));
      localStorage.setItem('fin_property_expenses', JSON.stringify(next));
      return next;
    });
    setPropertyIncomes(prev => {
      const next = prev.filter(pi => String(pi.assetId) !== String(id));
      localStorage.setItem('fin_property_incomes', JSON.stringify(next));
      return next;
    });
    if (String(selectedPropertyId) === String(id)) {
      setSelectedPropertyId(null);
    }
    scheduleSheetsBackgroundSync(300, true);
  };

  const handleAddPropertyExpense = (expense: PropertyExpense) => {
    try {
      const saved = localStorage.getItem('fin_property_expenses');
      let currentExpenses: PropertyExpense[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(currentExpenses)) currentExpenses = [];

      const next = [...currentExpenses.filter(pe => String(pe.id) !== String(expense.id)), expense];
      localStorage.setItem('fin_property_expenses', JSON.stringify(next));
      setPropertyExpenses(next);

      updateAssetExpensesEmbedded(expense);

      const isPontual = (expense.frequency || '').toLowerCase() === 'pontual';
      if (!isPontual) {
        syncPropertyExpenseToFixed(expense);
      } else {
        syncPropertyExpenseToPontual(expense);
      }

      queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      scheduleSheetsBackgroundSync(300, true);
    } catch (e) {
      console.error('Erro ao adicionar encargo de imóvel:', e);
    }
  };

  const handleUpdatePropertyExpense = (expense: PropertyExpense) => {
    try {
      const saved = localStorage.getItem('fin_property_expenses');
      let currentExpenses: PropertyExpense[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(currentExpenses)) currentExpenses = [];

      const exists = currentExpenses.some(pe => String(pe.id) === String(expense.id));
      let next: PropertyExpense[];
      if (exists) {
        next = currentExpenses.map(pe => String(pe.id) === String(expense.id) ? expense : pe);
      } else {
        next = [...currentExpenses, expense];
      }

      localStorage.setItem('fin_property_expenses', JSON.stringify(next));
      setPropertyExpenses(next);

      updateAssetExpensesEmbedded(expense);

      const isPontual = (expense.frequency || '').toLowerCase() === 'pontual';
      if (!isPontual) {
        syncPropertyExpenseToFixed(expense);
      } else {
        syncPropertyExpenseToPontual(expense);
      }

      queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      scheduleSheetsBackgroundSync(300, true);
    } catch (e) {
      console.error('Erro ao atualizar encargo de imóvel:', e);
    }
  };

  const syncPropertyExpenseToFixed = (expense: PropertyExpense) => {
    try {
      const savedFixed = localStorage.getItem('fin_fixed_expenses');
      let currentFixed = savedFixed ? JSON.parse(savedFixed) : [];
      if (!Array.isArray(currentFixed)) currentFixed = [];
      
      const asset = assets.find(a => String(a.id) === String(expense.assetId));
      const assetName = asset?.name || 'Ativo';
      const isProperty = asset?.category === 'imovel';

      const generatedId = expense.fixedExpenseId || `fe_prop_${expense.id}`;

      const existingFixed = currentFixed.find((fe: any) => 
        String(fe.id) === String(generatedId) || 
        String(fe.id) === String(expense.fixedExpenseId) ||
        (fe.propertyExpenseId && String(fe.propertyExpenseId) === String(expense.id))
      );

      const fixedExpId = existingFixed?.id || generatedId;

      const fixedExpData = {
        id: fixedExpId,
        name: expense.title || (existingFixed?.name ? existingFixed.name : `${expense.category} - ${assetName}`),
        description: expense.title || (existingFixed?.description ? existingFixed.description : `${expense.category} - ${assetName}`),
        entity: expense.entity || existingFixed?.entity || assetName,
        category: isProperty 
          ? (expense.category === 'Condomínio' ? 'Habitação' : expense.category === 'IMI' ? 'Impostos' : expense.category === 'Seguro Multirriscos' ? 'Seguros' : expense.category || 'Outros')
          : (expense.category === 'Comissões' ? 'Investimentos' : expense.category || 'Outros'),
        amount: expense.amount,
        frequency: expense.frequency ? (expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1).toLowerCase()) : 'Mensal',
        dueDateDay: expense.dayOfMonth || (expense.dueDate ? new Date(expense.dueDate).getDate() : 1),
        dueDay: expense.dayOfMonth || (expense.dueDate ? new Date(expense.dueDate).getDate() : 1),
        startDate: expense.startDate,
        endDate: expense.endDate,
        dueDate: expense.dueDate,
        exactDate: expense.dueDate,
        method: expense.paymentMethod || 'Transferência Bancária',
        paymentMethod: expense.paymentMethod || 'Transferência Bancária',
        active: expense.active !== undefined ? expense.active : true,
        assetId: expense.assetId,
        propertyExpenseId: expense.id,
        observations: expense.observations,
        notes: expense.notes || `Custo Fixo do ${isProperty ? 'Imóvel' : 'Ativo'}: ${assetName}. ${expense.observations || ''}`
      };

      const existsIndex = currentFixed.findIndex((fe: any) => String(fe.id) === String(fixedExpId));
      let updatedFixed;
      if (existsIndex >= 0) {
        updatedFixed = currentFixed.map((fe: any) => String(fe.id) === String(fixedExpId) ? { ...fe, ...fixedExpData } : fe);
      } else {
        updatedFixed = [...currentFixed, fixedExpData];
      }

      localStorage.setItem('fin_fixed_expenses', JSON.stringify(updatedFixed));
      queryClient.setQueryData(['fixedExpenses'], updatedFixed);

      if (!expense.fixedExpenseId || expense.fixedExpenseId !== fixedExpId) {
        expense.fixedExpenseId = fixedExpId;
        const savedProp = localStorage.getItem('fin_property_expenses');
        let propList: PropertyExpense[] = savedProp ? JSON.parse(savedProp) : [];
        if (Array.isArray(propList)) {
          propList = propList.map(pe => String(pe.id) === String(expense.id) ? { ...pe, fixedExpenseId: fixedExpId } : pe);
          localStorage.setItem('fin_property_expenses', JSON.stringify(propList));
          setPropertyExpenses(propList);
        }
      }

      // If it previously had a pontual transaction, remove it
      if (expense.transactionId) {
        const savedExpenses = localStorage.getItem('fin_expenses');
        let currentExpenses = savedExpenses ? JSON.parse(savedExpenses) : [];
        if (Array.isArray(currentExpenses)) {
          const filtered = currentExpenses.filter((e: any) => String(e.id) !== String(expense.transactionId));
          localStorage.setItem('fin_expenses', JSON.stringify(filtered));
          queryClient.setQueryData(['expenses'], filtered);
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar custo fixo global:', e);
    }
  };

  const syncPropertyExpenseToPontual = (expense: PropertyExpense) => {
    try {
      const saved = localStorage.getItem('fin_expenses');
      let current = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(current)) current = [];
      
      const asset = assets.find(a => String(a.id) === String(expense.assetId));
      const assetName = asset?.name || 'Imóvel';

      const generatedId = expense.transactionId || `tr_prop_exp_${expense.id}`;

      const transData = {
        id: generatedId,
        name: expense.title || `${expense.category} - ${assetName}`,
        description: expense.title ? `${expense.title} - ${assetName}` : `${expense.category} - ${assetName}`,
        entity: expense.entity || assetName,
        category: expense.category,
        amount: expense.amount,
        date: expense.dueDate || new Date().toISOString().split('T')[0],
        method: expense.paymentMethod || 'Transferência Bancária',
        paymentMethod: expense.paymentMethod || 'Transferência Bancária',
        notes: `Despesa Pontual do Imóvel: ${assetName}. ${expense.observations || expense.notes || ''}`,
        assetId: expense.assetId,
        propertyExpenseId: expense.id
      };

      const existsIndex = current.findIndex((t: any) => String(t.id) === String(generatedId));
      let updated;
      if (existsIndex >= 0) {
        updated = current.map((t: any) => String(t.id) === String(generatedId) ? { ...t, ...transData } : t);
      } else {
        updated = [transData, ...current];
      }

      localStorage.setItem('fin_expenses', JSON.stringify(updated));
      queryClient.setQueryData(['expenses'], updated);

      if (!expense.transactionId) {
        expense.transactionId = generatedId;
        const savedProp = localStorage.getItem('fin_property_expenses');
        let propList: PropertyExpense[] = savedProp ? JSON.parse(savedProp) : [];
        if (Array.isArray(propList)) {
          propList = propList.map(pe => String(pe.id) === String(expense.id) ? { ...pe, transactionId: generatedId } : pe);
          localStorage.setItem('fin_property_expenses', JSON.stringify(propList));
          setPropertyExpenses(propList);
        }
      }

      // If it previously had a fixed expense link, remove it
      if (expense.fixedExpenseId) {
        const savedFixed = localStorage.getItem('fin_fixed_expenses');
        let currentFixed = savedFixed ? JSON.parse(savedFixed) : [];
        if (Array.isArray(currentFixed)) {
          const filtered = currentFixed.filter((fe: any) => String(fe.id) !== String(expense.fixedExpenseId));
          localStorage.setItem('fin_fixed_expenses', JSON.stringify(filtered));
          queryClient.setQueryData(['fixedExpenses'], filtered);
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar despesa pontual:', e);
    }
  };

  const handleAddPropertyIncome = (income: PropertyIncome) => {
    try {
      const saved = localStorage.getItem('fin_property_incomes');
      let currentIncomes: PropertyIncome[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(currentIncomes)) currentIncomes = [];

      const next = [...currentIncomes.filter(pi => String(pi.id) !== String(income.id)), income];
      localStorage.setItem('fin_property_incomes', JSON.stringify(next));
      setPropertyIncomes(next);

      updateAssetIncomesEmbedded(income);

      const isPontual = (income.frequency || '').toLowerCase() === 'pontual';
      if (!isPontual) {
        syncPropertyIncomeToFixed(income);
      } else {
        syncPropertyIncomeToPontual(income);
      }

      queryClient.invalidateQueries({ queryKey: ['fixedIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      scheduleSheetsBackgroundSync(300, true);
    } catch (e) {
      console.error('Erro ao adicionar rendimento de imóvel:', e);
    }
  };

  const handleUpdatePropertyIncome = (income: PropertyIncome) => {
    try {
      const saved = localStorage.getItem('fin_property_incomes');
      let currentIncomes: PropertyIncome[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(currentIncomes)) currentIncomes = [];

      const exists = currentIncomes.some(pi => String(pi.id) === String(income.id));
      let next: PropertyIncome[];
      if (exists) {
        next = currentIncomes.map(pi => String(pi.id) === String(income.id) ? income : pi);
      } else {
        next = [...currentIncomes, income];
      }

      localStorage.setItem('fin_property_incomes', JSON.stringify(next));
      setPropertyIncomes(next);

      updateAssetIncomesEmbedded(income);

      const isPontual = (income.frequency || '').toLowerCase() === 'pontual';
      if (!isPontual) {
        syncPropertyIncomeToFixed(income);
      } else {
        syncPropertyIncomeToPontual(income);
      }

      queryClient.invalidateQueries({ queryKey: ['fixedIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      scheduleSheetsBackgroundSync(300, true);
    } catch (e) {
      console.error('Erro ao atualizar rendimento de imóvel:', e);
    }
  };

  const syncPropertyIncomeToFixed = (income: PropertyIncome) => {
    try {
      const savedFixed = localStorage.getItem('fin_fixed_incomes');
      let currentFixed = savedFixed ? JSON.parse(savedFixed) : [];
      if (!Array.isArray(currentFixed)) currentFixed = [];
      
      const asset = assets.find(a => String(a.id) === String(income.assetId));
      const assetName = asset?.name || 'Imóvel';

      const generatedId = income.fixedIncomeId || `fi_prop_${income.id}`;

      const existingFixed = currentFixed.find((fi: any) => 
        String(fi.id) === String(generatedId) || 
        String(fi.id) === String(income.fixedIncomeId) ||
        (fi.propertyIncomeId && String(fi.propertyIncomeId) === String(income.id))
      );

      const fixedIncId = existingFixed?.id || generatedId;

      const fixedIncData = {
        id: fixedIncId,
        name: income.title || (existingFixed?.name ? existingFixed.name : `${income.category} - ${assetName}`),
        entity: assetName,
        category: income.category === 'Renda Mensal' ? 'Rendas' : income.category === 'Venda de Imóvel' ? 'Vendas' : income.category || 'Outros',
        amount: income.amount,
        frequency: income.frequency ? (income.frequency.charAt(0).toUpperCase() + income.frequency.slice(1).toLowerCase()) : 'Mensal',
        dueDateDay: income.dayOfMonth || (income.dueDate ? new Date(income.dueDate).getDate() : 1),
        active: true,
        assetId: income.assetId,
        propertyIncomeId: income.id,
        observations: income.observations,
        notes: income.notes || `Rendimento Fixo do Imóvel: ${assetName}. ${income.observations || ''}`
      };

      const existsIndex = currentFixed.findIndex((fi: any) => String(fi.id) === String(fixedIncId));
      let updatedFixed;
      if (existsIndex >= 0) {
        updatedFixed = currentFixed.map((fi: any) => String(fi.id) === String(fixedIncId) ? { ...fi, ...fixedIncData } : fi);
      } else {
        updatedFixed = [...currentFixed, fixedIncData];
      }

      localStorage.setItem('fin_fixed_incomes', JSON.stringify(updatedFixed));
      queryClient.setQueryData(['fixedIncomes'], updatedFixed);

      if (!income.fixedIncomeId || income.fixedIncomeId !== fixedIncId) {
        income.fixedIncomeId = fixedIncId;
        const savedProp = localStorage.getItem('fin_property_incomes');
        let propList: PropertyIncome[] = savedProp ? JSON.parse(savedProp) : [];
        if (Array.isArray(propList)) {
          propList = propList.map(pi => String(pi.id) === String(income.id) ? { ...pi, fixedIncomeId: fixedIncId } : pi);
          localStorage.setItem('fin_property_incomes', JSON.stringify(propList));
          setPropertyIncomes(propList);
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar rendimento fixo global:', e);
    }
  };

  const syncPropertyIncomeToPontual = (income: PropertyIncome) => {
    try {
      const saved = localStorage.getItem('fin_incomes');
      let current = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(current)) current = [];
      
      const asset = assets.find(a => String(a.id) === String(income.assetId));
      const assetName = asset?.name || 'Imóvel';

      const generatedId = income.transactionId || `tr_prop_inc_${income.id}`;

      const transData = {
        id: generatedId,
        description: income.title ? `${income.title} - ${assetName}` : `${income.category} - ${assetName}`,
        entity: assetName,
        category: income.category,
        amount: income.amount,
        date: income.dueDate || new Date().toISOString().split('T')[0],
        paymentMethod: income.paymentMethod || 'Transferência Bancária',
        notes: `Receita Pontual do Imóvel: ${assetName}. ${income.observations || income.notes || ''}`,
        assetId: income.assetId,
        propertyIncomeId: income.id
      };

      const existsIndex = current.findIndex((t: any) => String(t.id) === String(generatedId));
      let updated;
      if (existsIndex >= 0) {
        updated = current.map((t: any) => String(t.id) === String(generatedId) ? { ...t, ...transData } : t);
      } else {
        updated = [transData, ...current];
      }

      localStorage.setItem('fin_incomes', JSON.stringify(updated));
      queryClient.setQueryData(['incomes'], updated);

      if (!income.transactionId) {
        income.transactionId = generatedId;
        const savedProp = localStorage.getItem('fin_property_incomes');
        let propList: PropertyIncome[] = savedProp ? JSON.parse(savedProp) : [];
        if (Array.isArray(propList)) {
          propList = propList.map(pi => String(pi.id) === String(income.id) ? { ...pi, transactionId: generatedId } : pi);
          localStorage.setItem('fin_property_incomes', JSON.stringify(propList));
          setPropertyIncomes(propList);
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar receita pontual:', e);
    }
  };

  const handleDeletePropertyExpensePermanent = (id: string) => {
    const expense = propertyExpenses.find(pe => String(pe.id) === String(id));
    if (expense) {
      if (expense.fixedExpenseId) {
        try {
          const savedFixed = localStorage.getItem('fin_fixed_expenses');
          if (savedFixed) {
            const currentFixed = JSON.parse(savedFixed);
            if (Array.isArray(currentFixed)) {
              const updatedFixed = currentFixed.filter((fe: any) => 
                String(fe.id) !== String(expense.fixedExpenseId) &&
                (!fe.propertyExpenseId || String(fe.propertyExpenseId) !== String(expense.id))
              );
              localStorage.setItem('fin_fixed_expenses', JSON.stringify(updatedFixed));
              queryClient.setQueryData(['fixedExpenses'], updatedFixed);
              queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });
            }
          }
        } catch (e) {
          console.error('Erro ao eliminar custo fixo global sincronizado:', e);
        }
      }
      if (expense.transactionId) {
        try {
          const savedExpenses = localStorage.getItem('fin_expenses');
          if (savedExpenses) {
            const currentExpenses = JSON.parse(savedExpenses);
            if (Array.isArray(currentExpenses)) {
              const updatedExpenses = currentExpenses.filter((e: any) => 
                String(e.id) !== String(expense.transactionId) &&
                (!e.propertyExpenseId || String(e.propertyExpenseId) !== String(expense.id))
              );
              localStorage.setItem('fin_expenses', JSON.stringify(updatedExpenses));
              queryClient.setQueryData(['expenses'], updatedExpenses);
              queryClient.invalidateQueries({ queryKey: ['expenses'] });
            }
          }
        } catch (e) {
          console.error('Erro ao eliminar despesa pontual sincronizada:', e);
        }
      }
    }

    removeAssetExpenseEmbedded(id);

    setPropertyExpenses(prev => {
      const next = prev.filter(pe => String(pe.id) !== String(id));
      localStorage.setItem('fin_property_expenses', JSON.stringify(next));
      return next;
    });

    queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });

    scheduleSheetsBackgroundSync(300, true);
  };

  const handleDeletePropertyIncomePermanent = (id: string) => {
    const income = propertyIncomes.find(pi => String(pi.id) === String(id));
    if (income) {
      if (income.fixedIncomeId) {
        try {
          const savedFixed = localStorage.getItem('fin_fixed_incomes');
          if (savedFixed) {
            const currentFixed = JSON.parse(savedFixed);
            if (Array.isArray(currentFixed)) {
              const updatedFixed = currentFixed.filter((fi: any) => 
                String(fi.id) !== String(income.fixedIncomeId) &&
                (!fi.propertyIncomeId || String(fi.propertyIncomeId) !== String(income.id))
              );
              localStorage.setItem('fin_fixed_incomes', JSON.stringify(updatedFixed));
              queryClient.setQueryData(['fixedIncomes'], updatedFixed);
              queryClient.invalidateQueries({ queryKey: ['fixedIncomes'] });
            }
          }
        } catch (e) {
          console.error('Erro ao eliminar rendimento fixo global sincronizado:', e);
        }
      }
      if (income.transactionId) {
        try {
          const savedIncomes = localStorage.getItem('fin_incomes');
          if (savedIncomes) {
            const currentIncomes = JSON.parse(savedIncomes);
            if (Array.isArray(currentIncomes)) {
              const updatedIncomes = currentIncomes.filter((i: any) => 
                String(i.id) !== String(income.transactionId) &&
                (!i.propertyIncomeId || String(i.propertyIncomeId) !== String(income.id))
              );
              localStorage.setItem('fin_incomes', JSON.stringify(updatedIncomes));
              queryClient.setQueryData(['incomes'], updatedIncomes);
              queryClient.invalidateQueries({ queryKey: ['incomes'] });
            }
          }
        } catch (e) {
          console.error('Erro ao eliminar receita pontual sincronizada:', e);
        }
      }
    }

    removeAssetIncomeEmbedded(id);

    setPropertyIncomes(prev => {
      const next = prev.filter(pi => String(pi.id) !== String(id));
      localStorage.setItem('fin_property_incomes', JSON.stringify(next));
      return next;
    });

    queryClient.invalidateQueries({ queryKey: ['fixedIncomes'] });
    queryClient.invalidateQueries({ queryKey: ['incomes'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });

    scheduleSheetsBackgroundSync(300, true);
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

          {/* Property / Financial Asset Expenses Panel */}
          <div ref={detailsRef}>
            <AnimatePresence>
              {selectedAsset && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 30 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 30 }}
                className="overflow-hidden"
              >
                <Card className={`border-none shadow-xl backdrop-blur-xl rounded-[2.5rem] overflow-hidden ${
                  selectedAsset.category === 'imovel' ? 'bg-card/60' : 'bg-emerald-500/5 dark:bg-emerald-500/10'
                }`}>
                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-border/40 pb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg ${
                          selectedAsset.category === 'imovel' ? 'bg-primary shadow-primary/20' : 'bg-emerald-600 shadow-emerald-600/20'
                        }`}>
                          {selectedAsset.category === 'imovel' ? <Building2 className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-black text-xl tracking-tight text-foreground">
                            Análise de {selectedAsset.category === 'imovel' ? 'Custos' : 'Performance'}: <span className={selectedAsset.category === 'imovel' ? 'text-primary dark:text-primary/80' : 'text-emerald-600 dark:text-emerald-400'}>{selectedAsset.name}</span>
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Info className="w-3 h-3 text-muted-foreground" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {selectedAsset.category === 'imovel' 
                                ? 'Controlo de Seguros, IMI e Manutenção' 
                                : 'Controlo de Dividendos, Taxas e Rendimentos'}
                            </p>
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
                    
                    {selectedAsset && (
                      <>
                        <PropertyFinancialSummary 
                          asset={selectedAsset}
                          expenses={propertyExpenses}
                          incomes={propertyIncomes}
                        />

                        {selectedAsset.category === 'imovel' && (
                          <PropertyRealExpensesCard
                            asset={selectedAsset}
                            propertyExpenses={propertyExpenses}
                          />
                        )}

                        <PropertyExpensesSection 
                          asset={selectedAsset}
                          expenses={propertyExpenses}
                          onAddExpense={handleAddPropertyExpense}
                          onUpdateExpense={handleUpdatePropertyExpense}
                          onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                        />

                        <div className="pt-8 border-t border-border/40">
                          <PropertyIncomesSection 
                            asset={selectedAsset}
                            incomes={propertyIncomes}
                            onAddIncome={handleAddPropertyIncome}
                            onUpdateIncome={handleUpdatePropertyIncome}
                            onDeleteIncome={(inc) => setIncomeToDelete(inc)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

      {/* Confirm & Delete Modal for Property Incomes */}
      <ConfirmDeleteModal
        open={!!incomeToDelete}
        onClose={() => setIncomeToDelete(null)}
        onConfirmPermanent={() => {
          if (incomeToDelete) {
            handleDeletePropertyIncomePermanent(incomeToDelete.id);
            setIncomeToDelete(null);
          }
        }}
        entityLabel={
          incomeToDelete?.title
            ? `Rendimento de Imóvel "${incomeToDelete.title}" (${formatter.format(incomeToDelete.amount || 0)})`
            : 'Rendimento'
        }
        entityName="Património"
        entityId={incomeToDelete?.id || ''}
        entityData={incomeToDelete}
        onMoveToTrashSuccess={() => {
          if (incomeToDelete) {
            handleDeletePropertyIncomePermanent(incomeToDelete.id);
            setIncomeToDelete(null);
          }
        }}
      />
    </motion.div>
  );
}
