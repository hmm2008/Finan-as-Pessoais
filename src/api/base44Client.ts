export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment';
  institution: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  value: number;
}

export interface Investment {
  id: string;
  name: string;
  value: number;
  type: 'stock' | 'bond' | 'crypto' | 'real_estate';
  returns: number;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
}

// Mock Data
const MOCK_USER: User = {
  id: '1',
  name: 'Manuel Francisco',
  email: 'Manuel.Francisco3@gmail.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=manuel',
};

const MOCK_TRANSACTIONS: Transaction[] = [];

const MOCK_ACCOUNTS: Account[] = [];

const MOCK_VEHICLES: Vehicle[] = [];

const MOCK_INVESTMENTS: Investment[] = [];

const MOCK_BUDGETS: Budget[] = [];

const MOCK_GOALS: Goal[] = [];

// Base44Client Mock implementation
export const base44Client = {
  getUser: async (): Promise<User> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_USER), 500));
  },
  
  getTransactions: async (): Promise<Transaction[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_TRANSACTIONS), 500));
  },
  
  getAccounts: async (): Promise<Account[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_ACCOUNTS), 500));
  },
  
  getVehicles: async (): Promise<Vehicle[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_VEHICLES), 500));
  },

  getInvestments: async (): Promise<Investment[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_INVESTMENTS), 500));
  },

  getBudgets: async (): Promise<Budget[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_BUDGETS), 500));
  },

  getGoals: async (): Promise<Goal[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_GOALS), 500));
  },
};
