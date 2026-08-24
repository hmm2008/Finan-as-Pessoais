const fs = require('fs');

let code = fs.readFileSync('src/views/FinancasView.tsx', 'utf-8');

// 1. Add useTrash
if (!code.includes('useTrash')) {
  code = code.replace(
    /import \{ useExpenses, useIncomes \} from '\.\.\/hooks\/queries';/,
    `import { useExpenses, useIncomes, useTrash } from '../hooks/queries';`
  );
}

// 2. Add state and delete logic
if (!code.includes('const [editingExpense')) {
  const stateInjection = `  const { incomes, deleteIncome } = useIncomes();
  const { moveToTrash } = useTrash();

  // Modal states
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'expense' | 'income', item: any } | null>(null);`;

  code = code.replace(
    /  const \{ incomes, deleteIncome \} = useIncomes\(\);\n\n  \/\/ Modal states/,
    stateInjection
  );
}

// 3. Update Edit Handlers
code = code.replace(
  /onEdit=\{\(e\) => \{\s*\/\/\s*Would open edit form\s*\}\}/g,
  `onEdit={(e) => { setEditingExpense(e); setExpenseModalOpen(true); }}`
);
code = code.replace(
  /onEdit=\{\(i\) => \{\s*\/\/\s*Would open edit form\s*\}\}/g,
  `onEdit={(i) => { setEditingIncome(i); setIncomeModalOpen(true); }}`
);

// 4. Update Delete Handlers
code = code.replace(
  /onDelete=\{deleteExpense\}/g,
  `onDelete={(id) => setItemToDelete({ id, type: 'expense', item: expenses.find((e: any) => e.id === id) })}`
);
code = code.replace(
  /onDelete=\{deleteIncome\}/g,
  `onDelete={(id) => setItemToDelete({ id, type: 'income', item: incomes.find((i: any) => i.id === id) })}`
);

// 5. Update Form Props
code = code.replace(
  /<ExpenseForm isOpen=\{expenseModalOpen\} onClose=\{\(\) => setExpenseModalOpen\(false\)\} \/>/g,
  `<ExpenseForm isOpen={expenseModalOpen} onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }} initialData={editingExpense} />`
);
code = code.replace(
  /<IncomeForm isOpen=\{incomeModalOpen\} onClose=\{\(\) => setIncomeModalOpen\(false\)\} \/>/g,
  `<IncomeForm isOpen={incomeModalOpen} onClose={() => { setIncomeModalOpen(false); setEditingIncome(null); }} initialData={editingIncome} />`
);

// 6. Add the deletion modal
const deleteModal = `
      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-lg border-border">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Opções de Eliminação</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Pode eliminar este registo definitivamente, ou movê-lo para a lixeira onde pode ser recuperado mais tarde.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    if (itemToDelete.type === 'expense') {
                      await deleteExpense(itemToDelete.id);
                    } else {
                      await deleteIncome(itemToDelete.id);
                    }
                    setItemToDelete(null);
                  }}
                >
                  Eliminar Definitivamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    const trashItem = {
                      ...itemToDelete.item,
                      originalType: itemToDelete.type,
                      deletedAt: new Date().toISOString()
                    };
                    await moveToTrash(trashItem);
                    if (itemToDelete.type === 'expense') {
                      await deleteExpense(itemToDelete.id);
                    } else {
                      await deleteIncome(itemToDelete.id);
                    }
                    setItemToDelete(null);
                  }}
                >
                  Mover para Lixeira
                </Button>
                <Button 
                  variant="ghost" 
                  className="mt-2" 
                  onClick={() => setItemToDelete(null)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
`;

code = code.replace(
  /    <\/div>\n  \);\n\}/g,
  `      ${deleteModal}\n    </div>\n  );\n}`
);

fs.writeFileSync('src/views/FinancasView.tsx', code);
console.log('Fixed FinancasView.tsx');
