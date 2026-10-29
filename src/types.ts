export interface Entity {
  id: string;
}

export interface Expense extends Entity {
  name?: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  entity: string;
  method: string;
  paymentMethod?: string;
  recurring: boolean;
  vehicle?: boolean;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleName?: string;
  liters?: number;
  kilometers?: number;
  notes: string;
  assetId?: string;
  propertyExpenseId?: string;
  fixedExpenseId?: string;
  installmentsTotal?: number;
  installmentsCurrent?: number;
  installmentId?: string;
  tags?: string[];
  receiptUrl?: string;
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
  expectedYield?: number;
  startDate?: string;
  endDate?: string;
  institution?: string;
  custodian?: string;
  ticker?: string;
}

export interface Vehicle extends Entity {
  name: string;
  value: number;
}

export interface Budget extends Entity {
  category: string;
  amount: number;
  period: 'monthly';
  icon?: string;
  color?: string;
}

export interface Notification extends Entity {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  date: string;
  read: boolean;
  link?: string;
  category?: string;
}

export interface AuditAlert {
  id: string;
  type: 'duplicate' | 'budget_overrun' | 'vehicle_deadline' | 'stale_subscription' | 'emergency_fund' | 'diversification';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityId?: string;
  entityType?: 'expense' | 'budget' | 'vehicle' | 'fixedExpense';
  dateDetected: string;
  data?: any;
  resolved: boolean;
  actionLabel?: string;
}

