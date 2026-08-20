#!/bin/bash
WIDGETS=(
  "FinancasToolbar"
  "ExpenseRow"
  "IncomeRow"
  "ExpenseForm"
  "IncomeForm"
  "FinancasCharts"
  "ComparativeAnalysis"
  "CSVImportModal"
  "ExportPDFModal"
  "ExportExcelModal"
  "ExportCSVDialog"
  "index"
)

for widget in "${WIDGETS[@]}"; do
  if [ "$widget" == "index" ]; then
    echo "export * from './FinancasToolbar';" > "src/components/financas/${widget}.ts"
    echo "export * from './ExpenseRow';" >> "src/components/financas/${widget}.ts"
    echo "export * from './IncomeRow';" >> "src/components/financas/${widget}.ts"
    echo "export * from './ExpenseForm';" >> "src/components/financas/${widget}.ts"
    echo "export * from './IncomeForm';" >> "src/components/financas/${widget}.ts"
    echo "export * from './FinancasCharts';" >> "src/components/financas/${widget}.ts"
    echo "export * from './ComparativeAnalysis';" >> "src/components/financas/${widget}.ts"
    echo "export * from './CSVImportModal';" >> "src/components/financas/${widget}.ts"
    echo "export * from './ExportPDFModal';" >> "src/components/financas/${widget}.ts"
    echo "export * from './ExportExcelModal';" >> "src/components/financas/${widget}.ts"
    echo "export * from './ExportCSVDialog';" >> "src/components/financas/${widget}.ts"
  else
    cat << FILE_EOF > "src/components/financas/${widget}.tsx"
import React from 'react';

export function ${widget}() {
  return (
    <div>
      ${widget}
    </div>
  );
}
FILE_EOF
  fi
done
