import React, { useState } from 'react';
import { PageHeader } from '../components/layout';
import { ReceitasFixasHeader, FixedIncomeList, FixedIncomeForm } from '../components/receitas-fixas';
import { useFixedIncomes } from '../hooks/queries';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { motion } from 'motion/react';

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
    <div className="relative min-h-screen pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader 
          title="Receitas Fixas" 
          subtitle="Acompanhamento detalhado das suas entradas mensais recorrentes"
        />
        
        <ReceitasFixasHeader 
          onAdd={handleOpenAdd} 
          incomes={fixedIncomes}
        />
        
        <div className="pt-4">
          <FixedIncomeList 
            incomes={fixedIncomes}
            onEdit={handleOpenEdit}
            onDelete={(item) => setItemToDelete(item)}
          />
        </div>
      </motion.div>

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
