import React, { useState } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Target, Plus, AlertCircle, CheckCircle2, TrendingUp, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { useBudgets, useExpenses } from '../hooks/queries';
import { useDashboard, usePrivacy } from '../contexts';
import { BudgetFormModal } from '../components/orcamentos/BudgetFormModal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': '🛒',
  'Habitação': '🏠',
  'Transportes': '🚌',
  'Combustível': '⛽',
  'Lazer': '🍿',
  'Saúde': '💊',
  'Educação': '📚',
  'Outros': '📦',
};

export default function OrcamentosView() {
  const { currentMonth, setCurrentMonth } = useDashboard();
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { expenses } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Filter budgets for selected month
  const monthBudgets = budgets.filter((b: any) => !b.month || b.month === currentMonth);

  // Calculate actual spending per category from expenses for this month
  const monthExpenses = expenses.filter(
    (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
  );

  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach((exp: any) => {
    const cat = exp.category || 'Outros';
    spentByCategory[cat] = (spentByCategory[cat] || 0) + (Number(exp.amount) || 0);
  });

  // Calculate summary metrics
  const totalLimit = monthBudgets.reduce((acc, b) => acc + (Number(b.limit) || 0), 0);
  const totalSpent = monthBudgets.reduce((acc, b) => {
    const cat = b.category || 'Outros';
    const spent = spentByCategory[cat] ?? Number(b.spent || 0);
    return acc + spent;
  }, 0);

  const remainingTotal = totalLimit - totalSpent;
  const overBudgetsCount = monthBudgets.filter((b) => {
    const cat = b.category || 'Outros';
    const spent = spentByCategory[cat] ?? Number(b.spent || 0);
    return spent > Number(b.limit || 0);
  }).length;

  const handleSaveBudget = async (data: { id?: string; category: string; limit: number; month?: string }) => {
    try {
      if (data.id) {
        await updateBudget({
          id: data.id,
          category: data.category,
          limit: data.limit,
          month: data.month || currentMonth
        });
      } else {
        await addBudget({
          id: 'bgt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          category: data.category,
          limit: data.limit,
          month: data.month || currentMonth,
          spent: 0
        });
      }
    } catch (err) {
      console.error('Erro ao guardar orçamento:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Erro ao eliminar orçamento:', err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos & Tetos de Gastos"
        subtitle="Defina limites mensais por categoria de despesa e acompanhe a sua disciplina financeira."
      >
        <Button onClick={() => { setEditingBudget(null); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Orçamento
        </Button>
      </PageHeader>

      {/* Month Filter Selector */}
      <div className="flex items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Mês de Referência:</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={currentMonth}
            onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
            className="w-44 h-9 text-sm"
          />
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Teto Total Orçado</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">{maskValue(totalLimit, formatter.format)}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Target className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Consumido</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">{maskValue(totalSpent, formatter.format)}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Margem Disponível</p>
              <h3 className={`text-xl font-bold mt-1 ${remainingTotal < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                {maskValue(remainingTotal, formatter.format)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-lg ${remainingTotal < 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Alertas Excedidos</p>
              <h3 className={`text-xl font-bold mt-1 ${overBudgetsCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {overBudgetsCount} {overBudgetsCount === 1 ? 'categoria' : 'categorias'}
              </h3>
            </div>
            <div className={`p-2.5 rounded-lg ${overBudgetsCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Budget Grid / Empty State */}
      {monthBudgets.length === 0 ? (
        <Card className="border border-dashed border-border p-12 text-center rounded-2xl bg-card/50">
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <div className="p-4 bg-primary/10 text-primary rounded-full">
              <Target className="w-10 h-10" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Nenhum orçamento para {currentMonth}</h3>
            <p className="text-sm text-muted-foreground">
              Defina limites de despesas por categoria para monitorizar em tempo real o seu teto de gastos.
            </p>
            <Button onClick={() => { setEditingBudget(null); setIsModalOpen(true); }} className="mt-2 gap-2">
              <Plus className="w-4 h-4" /> Criar Primeiro Orçamento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthBudgets.map((b: any) => {
            const category = b.category || 'Geral';
            const limit = Number(b.limit) || 0;
            const spent = spentByCategory[category] ?? Number(b.spent || 0);
            const ratio = limit > 0 ? (spent / limit) * 100 : 0;
            const isOver = ratio > 100;
            const isWarning = ratio >= 80 && !isOver;
            const icon = CATEGORY_ICONS[category] || '🎯';

            return (
              <Card key={b.id} className="border border-border shadow-sm flex flex-col justify-between">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <span className="text-xl">{icon}</span>
                    <span>{category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditingBudget(b); setIsModalOpen(true); }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(b)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted-foreground text-xs uppercase font-medium">Gasto Real / Teto</span>
                    <div className="text-right">
                      <span className={`font-bold ${isOver ? 'text-destructive' : 'text-foreground'}`}>
                        {maskValue(spent, formatter.format)}
                      </span>
                      <span className="text-muted-foreground text-xs"> / {maskValue(limit, formatter.format)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOver ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>

                  {/* Warning / Status Label */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className={`font-semibold ${isOver ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {ratio.toFixed(0)}% Utilizado
                    </span>
                    <span className="text-muted-foreground">
                      {isOver
                        ? `Excedido em ${maskValue(spent - limit, formatter.format)}`
                        : `Resta ${maskValue(limit - spent, formatter.format)}`}
                    </span>
                  </div>

                  {isOver && (
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-destructive/10 text-destructive text-xs font-medium mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Limite ultrassassado para este mês.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Budget Form Modal */}
      <BudgetFormModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBudget(null); }}
        onSubmit={handleSaveBudget}
        initialData={editingBudget}
        currentMonth={currentMonth}
      />

      {/* Confirm Delete & Trash Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirmPermanent={handleDeleteConfirm}
          entityLabel={`Orçamento de ${deleteTarget.category} (${formatter.format(deleteTarget.limit)})`}
          entityName="Orçamentos"
          entityId={deleteTarget.id}
          entityData={deleteTarget}
          onMoveToTrashSuccess={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
