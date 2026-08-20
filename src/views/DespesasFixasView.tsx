import React, { useState } from 'react';
import { PageHeader } from '../components/layout';
import { DespesasFixasHeader, FixedExpenseList, FixedExpenseForm } from '../components/despesas-fixas';
import { useFixedExpenses } from '../hooks/queries';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

export default function DespesasFixasView() {
  const { fixedExpenses, deleteFixedExpense } = useFixedExpenses();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Despesas Fixas" 
        subtitle="Contratos e pagamentos recorrentes"
      />
      
      <DespesasFixasHeader 
        onAdd={handleOpenAdd} 
        expenses={fixedExpenses}
      />
      
      <FixedExpenseList 
        expenses={fixedExpenses}
        onEdit={handleOpenEdit}
        onDelete={(item) => setItemToDelete(item)}
      />

      <FixedExpenseForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        initialData={editingExpense}
      />

      {/* Delete / Move to Trash Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          open={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirmPermanent={async () => {
            await deleteFixedExpense(itemToDelete.id);
            setItemToDelete(null);
          }}
          entityLabel={
            itemToDelete.name || itemToDelete.description
              ? `${itemToDelete.name || itemToDelete.description} (${itemToDelete.amount}€)`
              : 'Despesa Fixa'
          }
          entityName="Despesas Fixas"
          entityId={itemToDelete.id}
          entityData={itemToDelete}
          onMoveToTrashSuccess={async () => {
            await deleteFixedExpense(itemToDelete.id);
            setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}
