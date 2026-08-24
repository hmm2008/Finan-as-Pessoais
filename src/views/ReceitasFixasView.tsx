import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { ReceitasFixasHeader, FixedIncomeList, FixedIncomeForm } from '../components/receitas-fixas';
import { useFixedIncomes } from '../hooks/queries';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

export default function ReceitasFixasView() {
  const { fixedIncomes, deleteFixedIncome } = useFixedIncomes();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const handleOpenAdd = () => {
    setEditingIncome(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (income: any) => {
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingIncome(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Receitas Fixas" 
        subtitle="Entradas mensais recorrentes"
      />
      
      <ReceitasFixasHeader 
        onAdd={handleOpenAdd} 
        incomes={fixedIncomes}
      />
      
      <FixedIncomeList 
        incomes={fixedIncomes}
        onEdit={handleOpenEdit}
        onDelete={(item) => setItemToDelete(item)}
      />

      <FixedIncomeForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        initialData={editingIncome}
      />

      {/* Delete / Move to Trash Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          open={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirmPermanent={async () => {
            await deleteFixedIncome(itemToDelete.id);
            setItemToDelete(null);
          }}
          entityLabel={
            itemToDelete.name || itemToDelete.description
              ? `${itemToDelete.name || itemToDelete.description} (${itemToDelete.amount}€)`
              : 'Receita Fixa'
          }
          entityName="Receitas Fixas"
          entityId={itemToDelete.id}
          entityData={itemToDelete}
          onMoveToTrashSuccess={async () => {
            await deleteFixedIncome(itemToDelete.id);
            setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}
