const fs = require('fs');

function fixForm(filename) {
  let code = fs.readFileSync(filename, 'utf-8');
  
  if (!code.includes('if (isOpen) {') && !code.includes('// Reset form when opened')) {
    const resetEffect = `
  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setCategory('');
      setEntity('');
      setMethod('');
      setRecurring(false);
      setNotes('');
      setIsSubmitting(false);
      setSuggestedCategory(null);
      setIsAddingCustom(false);
      setNewCustomCategory('');
    }
  }, [isOpen]);
`;
    // Insert after the state declarations
    code = code.replace(/const \[newCustomCategory, setNewCustomCategory\] = useState\(''\);/, `const [newCustomCategory, setNewCustomCategory] = useState('');\n${resetEffect}`);
    fs.writeFileSync(filename, code);
    console.log('Fixed ' + filename);
  }
}

fixForm('src/components/financas/ExpenseForm.tsx');
fixForm('src/components/financas/IncomeForm.tsx');
