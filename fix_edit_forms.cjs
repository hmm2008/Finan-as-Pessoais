const fs = require('fs');

function refactorForm(filename, entityType) {
  let code = fs.readFileSync(filename, 'utf-8');
  
  // 1. Add initialData to Props
  code = code.replace(
    /interface (Expense|Income)FormProps {/,
    `interface $1FormProps {\n  initialData?: any;`
  );
  
  // 2. Extract initialData from props
  code = code.replace(
    /export function (Expense|Income)Form\(\{ isOpen, onClose \}: (Expense|Income)FormProps\) {/,
    `export function $1Form({ isOpen, onClose, initialData }: $1FormProps) {`
  );
  
  // 3. Add updateMutation
  if (entityType === 'expense') {
    code = code.replace(/const \{ addExpense \} = useExpenses\(\);/, `const { addExpense, updateExpense } = useExpenses();`);
  } else {
    code = code.replace(/const \{ addIncome \} = useIncomes\(\);/, `const { addIncome, updateIncome } = useIncomes();`);
  }

  // 4. Update the useEffect for resetting/populating
  const oldEffectRegex = /\/\/ Reset form when opened\s*useEffect\(\(\) => \{\s*if \(isOpen\) \{[\s\S]*?\}\s*\}, \[isOpen\]\);/;
  const newEffect = `// Reset or populate form when opened
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setCategory(initialData.category || '');
        setEntity(initialData.entity || '');
        setMethod(initialData.method || '');
        setRecurring(initialData.recurring || false);
        setNotes(initialData.notes || '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setCategory('');
        setEntity('');
        setMethod('');
        setRecurring(false);
        setNotes('');
      }
      setIsSubmitting(false);
      setSuggestedCategory(null);
      setIsAddingCustom(false);
      setNewCustomCategory('');
    }
  }, [isOpen, initialData]);`;
  
  code = code.replace(oldEffectRegex, newEffect);
  
  // 5. Update handleSubmit
  if (entityType === 'expense') {
    const oldSubmitRegex = /await addExpense\(\{[\s\S]*?vehicle: category === 'Combustível'\s*\}\);/;
    const newSubmit = `const payload = {
        date,
        amount: parseFloat(amount),
        category,
        entity,
        method,
        recurring,
        notes,
        vehicle: category === 'Combustível'
      };
      if (initialData) {
        await updateExpense({ ...initialData, ...payload });
      } else {
        await addExpense(payload);
      }`;
    code = code.replace(oldSubmitRegex, newSubmit);
  } else {
    const oldSubmitRegex = /await addIncome\(\{[\s\S]*?\}\);/;
    const newSubmit = `const payload = {
        date,
        amount: parseFloat(amount),
        category,
        entity,
        method,
        recurring,
        notes
      };
      if (initialData) {
        await updateIncome({ ...initialData, ...payload });
      } else {
        await addIncome(payload);
      }`;
    code = code.replace(oldSubmitRegex, newSubmit);
  }

  // 6. Update Button text
  if (entityType === 'expense') {
    code = code.replace(/\{isSubmitting \? 'A guardar\.\.\.' : 'Guardar Despesa'\}/, `{isSubmitting ? 'A guardar...' : (initialData ? 'Guardar Alterações' : 'Guardar Despesa')}`);
    code = code.replace(/Nova Despesa/g, `{initialData ? 'Editar Despesa' : 'Nova Despesa'}`);
  } else {
    code = code.replace(/\{isSubmitting \? 'A guardar\.\.\.' : 'Guardar Receita'\}/, `{isSubmitting ? 'A guardar...' : (initialData ? 'Guardar Alterações' : 'Guardar Receita')}`);
    code = code.replace(/Nova Receita/g, `{initialData ? 'Editar Receita' : 'Nova Receita'}`);
  }

  fs.writeFileSync(filename, code);
  console.log('Fixed ' + filename);
}

refactorForm('src/components/financas/ExpenseForm.tsx', 'expense');
refactorForm('src/components/financas/IncomeForm.tsx', 'income');
