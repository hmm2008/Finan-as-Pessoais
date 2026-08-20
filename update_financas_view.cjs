const fs = require('fs');
let code = fs.readFileSync('src/views/FinancasView.tsx', 'utf-8');

// 1. Import useTrash
code = code.replace(
  /import \{ useExpenses, useIncomes \} from '\.\.\/hooks\/queries';/,
  `import { useExpenses, useIncomes, useTrash } from '../hooks/queries';`
);

// 2. Add states
const stateInjection = `  const { incomes, deleteIncome } = useIncomes();
  const { moveToTrash } = useTrash();

  // Modal states
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null); // { id, type, item }`;

code = code.replace(
  /  const \{ incomes, deleteIncome \} = useIncomes\(\);\n\n  \/\/ Modal states/,
  stateInjection
);

// 3. Update handlers for editing and deleting
code = code.replace(
  /onEdit=\{\(e\) => \{\s*\/\/\s*Would open edit form\s*\}\}/g,
  `onEdit={(e) => { setEditingExpense(e); setExpenseModalOpen(true); }}`
);
code = code.replace(
  /onEdit=\{\(i\) => \{\s*\/\/\s*Would open edit form\s*\}\}/g,
  `onEdit={(i) => { setEditingIncome(i); setIncomeModalOpen(true); }}`
);

// We need to capture the whole item in the delete. But wait, onDelete currently passes only `id`.
// Let's modify ExpenseRow and IncomeRow to pass the whole item?
// No, the user wants "Delete / Trash" dialog. To move to trash we need the item data.
// So let's look up the item from the lists.
