export interface Entity {
  id: string;
}

export interface Expense extends Entity {
  date: string;
  amount: number;
  category: string;
  description: string;
  entity: string;
  method: string;
  recurring: boolean;
  vehicle?: boolean;
  notes: string;
  fixedExpenseId?: string;
}

export interface Income extends Entity {
  date: string;
  amount: number;
  category: string;
  entity: string;
  method: string;
  recurring: boolean;
  notes: string;
  description: string;
  isFixed: boolean;
  fixedIncomeId?: string;
}

export type AssetCategory = 'imovel' | 'financeiro' | 'outros';

export interface Asset extends Entity {
  name: string;
  category: AssetCategory;
  subType: string;
  currentValue: number;
  purchaseValue: number;
  acquisitionDate: string;
  notes?: string;
  documentName?: string;
  documentUrl?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  monthlyExpense?: number;
  annualExpense?: number;
  quantity?: number;
  averagePrice?: number;
  interestRate?: number;
  startDate?: string;
  endDate?: string;
  institution?: string;
}

export interface Vehicle extends Entity {
  name: string;
  value: number;
}
