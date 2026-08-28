import React, { useState } from 'react';
import { PageHeader } from '../components/layout';
import { DespesasFixasHeader, FixedExpenseList, FixedExpenseForm } from '../components/despesas-fixas';
import { useFixedExpenses } from '../hooks/queries';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { motion } from 'motion/react';

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
    <div className="relative min-h-screen pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-0 -z-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader 
          title="Despesas Fixas" 
          subtitle="Gestão inteligente de contratos e compromissos recorrentes"
        />
        
        <DespesasFixasHeader 
          onAdd={handleOpenAdd} 
          expenses={fixedExpenses}
        />
        
        <div className="pt-4">
          <FixedExpenseList 
            expenses={fixedExpenses}
            onEdit={handleOpenEdit}
            onDelete={(item) => setItemToDelete(item)}
          />
        </div>
      </motion.div>

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
