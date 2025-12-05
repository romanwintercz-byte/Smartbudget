
export type CategoryType = 'NEEDS' | 'WANTS' | 'SAVINGS' | 'GIVING' | 'INCOME' | 'TRANSFER';

export interface BudgetRule {
  type: CategoryType;
  label: string;
  percentage: number; // 0 for income/transfer
  color: string;
  description: string;
  isBudgetCategory: boolean; // Helper to filter charts
}

export interface AccountMetadata {
  accountName: string;
  accountType: 'CURRENT' | 'SAVINGS'; // CURRENT = Běžný, SAVINGS = Spořicí
  balance: number | null;
  currency: string;
}

export interface ImportedDocument extends Partial<AccountMetadata> {
  id: string;
  name: string;
  uploadDate: string;
  transactionCount: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: CategoryType;
  date: string;
  isAiGenerated?: boolean;
  documentId?: string; // Reference na importovaný soubor
}

export interface AiParseResult {
  amount: number | null;
  currency: string;
  category: CategoryType | null;
  description: string;
  confidence: number;
}

export const BUDGET_RULES: Record<CategoryType, BudgetRule> = {
  NEEDS: {
    type: 'NEEDS',
    label: 'Nutné výdaje (40%)',
    percentage: 40,
    color: '#3b82f6', // Blue
    description: 'Bydlení, jídlo, energie, doprava',
    isBudgetCategory: true
  },
  WANTS: {
    type: 'WANTS',
    label: 'Radosti (30%)',
    percentage: 30,
    color: '#a855f7', // Purple
    description: 'Zábava, restaurace, koníčky, nákupy',
    isBudgetCategory: true
  },
  SAVINGS: {
    type: 'SAVINGS',
    label: 'Budoucnost (20%)',
    percentage: 20,
    color: '#22c55e', // Green
    description: 'Investice, spoření, splácení dluhů',
    isBudgetCategory: true
  },
  GIVING: {
    type: 'GIVING',
    label: 'Dary a pomoc (10%)',
    percentage: 10,
    color: '#f97316', // Orange
    description: 'Charita, dárky, finanční rezerva',
    isBudgetCategory: true
  },
  INCOME: {
    type: 'INCOME',
    label: 'Příjem',
    percentage: 0,
    color: '#10b981', // Emerald
    description: 'Mzda, dividendy, vklady',
    isBudgetCategory: false
  },
  TRANSFER: {
    type: 'TRANSFER',
    label: 'Interní převod',
    percentage: 0,
    color: '#94a3b8', // Slate
    description: 'Převody mezi vlastními účty, splátky kreditek',
    isBudgetCategory: false
  }
};