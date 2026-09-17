export type BudgetEntryType = 'INCOME' | 'EXPENSE';

export interface BudgetEntryRequest {
  type: BudgetEntryType;
  amount: number;
  category: string;
  description: string | null;
  entryDate: string;
}

export interface BudgetEntryResponse {
  id: number;
  type: BudgetEntryType;
  amount: number;
  category: string;
  description: string | null;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface MonthlyOverviewResponse {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
}
