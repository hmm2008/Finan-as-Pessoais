export type AssetCategory = 'imovel' | 'financeiro' | 'outros';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  subType: string; // Imóvel: T1, T2, Moradia, Terreno, Garagem, Comercial... | Fin: Ações, ETF, Fundo, Criptomoeda, Conta Poupança, Certificados Aforro, Ouro, etc. | Outros: Veículo, Arte, Relógio, etc.
  currentValue: number;
  purchaseValue: number;
  acquisitionDate: string;
  notes?: string;
  documentName?: string;
  documentUrl?: string;

  // Imóvel specific fields (10.2)
  street?: string;
  zipCode?: string;
  city?: string;
  monthlyExpense?: number;
  annualExpense?: number;

  // Financeiro specific fields (10.3)
  quantity?: number;
  averagePrice?: number;
  interestRate?: number; // % per annum for savings accounts / certificates
  startDate?: string;
  endDate?: string;
  institution?: string; // Banco, Broker (Degiro, XTB, Trading212, etc.)
}

export interface PropertyExpense {
  id: string;
  assetId: string;
  title: string;
  amount: number;
  frequency: 'mensal' | 'anual';
  category: 'Condomínio' | 'IMI' | 'Seguro Multirriscos' | 'Manutenção' | 'Outro';
  dayOfMonth?: number;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  fixedExpenseId?: string; // Link to FixedExpense
  notes?: string;
}
