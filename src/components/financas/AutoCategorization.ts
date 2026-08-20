export interface CategorizationRule {
  keyword: string;
  category: string;
  priority: number; // Higher number = higher priority
}

// Default set of rules
const defaultRules: CategorizationRule[] = [
  { keyword: 'galp', category: 'Combustível', priority: 10 },
  { keyword: 'bp', category: 'Combustível', priority: 10 },
  { keyword: 'repsol', category: 'Combustível', priority: 10 },
  { keyword: 'continente', category: 'Alimentação', priority: 10 },
  { keyword: 'pingo doce', category: 'Alimentação', priority: 10 },
  { keyword: 'auchan', category: 'Alimentação', priority: 10 },
  { keyword: 'lidl', category: 'Alimentação', priority: 10 },
  { keyword: 'aldi', category: 'Alimentação', priority: 10 },
  { keyword: 'farmácia', category: 'Saúde', priority: 10 },
  { keyword: 'hospital', category: 'Saúde', priority: 10 },
  { keyword: 'cuf', category: 'Saúde', priority: 10 },
  { keyword: 'luz', category: 'Saúde', priority: 5 }, // Might conflict with "Conta da Luz" (electricity), handle priority
  { keyword: 'edp', category: 'Habitação', priority: 10 },
  { keyword: 'meo', category: 'Habitação', priority: 10 },
  { keyword: 'nos', category: 'Habitação', priority: 10 },
  { keyword: 'vodafone', category: 'Habitação', priority: 10 },
  { keyword: 'netflix', category: 'Lazer', priority: 10 },
  { keyword: 'spotify', category: 'Lazer', priority: 10 },
  { keyword: 'cinema', category: 'Lazer', priority: 10 },
  { keyword: 'vencimento', category: 'Salário', priority: 10 },
  { keyword: 'salário', category: 'Salário', priority: 10 },
];

export function getSuggestedCategory(description: string, customRules: CategorizationRule[] = []): string | null {
  const allRules = [...customRules, ...defaultRules].sort((a, b) => b.priority - a.priority);
  const normalizedDesc = description.toLowerCase();

  for (const rule of allRules) {
    if (normalizedDesc.includes(rule.keyword.toLowerCase())) {
      return rule.category;
    }
  }

  return null;
}
