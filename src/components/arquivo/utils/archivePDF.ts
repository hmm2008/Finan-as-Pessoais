import { jsPDF } from 'jspdf';

export interface MonthArchiveSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionsCount: number;
  topCategories: { category: string; amount: number }[];
}

export function generateMonthArchivePDF(summary: MonthArchiveSummary) {
  const doc = new jsPDF();

  // Header background
  doc.setFillColor(5, 150, 105); // Emerald accent
  doc.rect(0, 0, 210, 35, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Relatório Financeiro Mensal', 14, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mês de Referência: ${summary.month}`, 14, 28);

  // Body content
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo de Desempenho', 14, 48);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Total de Receitas: ${summary.totalIncome.toFixed(2)} €`, 16, 58);
  doc.text(`• Total de Despesas: ${summary.totalExpense.toFixed(2)} €`, 16, 66);
  
  const savingsColor = summary.netSavings >= 0 ? [5, 150, 105] : [225, 29, 72];
  doc.setTextColor(savingsColor[0], savingsColor[1], savingsColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Saldo Líquido do Mês: ${summary.netSavings.toFixed(2)} €`, 16, 74);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Total de Movimentos Registados: ${summary.transactionsCount}`, 16, 82);

  // Top Categories Table Header
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Principais Categorias de Despesa', 14, 98);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 103, 182, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Categoria', 18, 108);
  doc.text('Valor (€)', 160, 108);

  let y = 117;
  summary.topCategories.forEach((cat, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.text(cat.category, 18, y);
    doc.text(`${cat.amount.toFixed(2)} €`, 160, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 2, 196, y + 2);
    y += 8;
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Gerado automaticamente por Finanças Pessoais em ${new Date().toLocaleDateString('pt-PT')}`, 14, 280);

  // Return Blob and filename
  const pdfBlob = doc.output('blob');
  const fileName = `Relatorio_Mensal_${summary.month}.pdf`;
  const pdfUrl = URL.createObjectURL(pdfBlob);

  return { blob: pdfBlob, url: pdfUrl, fileName };
}
