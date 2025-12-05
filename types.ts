export type CategoryType = 'NEEDS' | 'WANTS' | 'SAVINGS' | 'GIVING';

export interface BudgetRule {
  type: CategoryType;
  label: string;
  percentage: number;
  color: string;
  description: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: CategoryType;
  date: string;
  isAiGenerated?: boolean;
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
    description: 'Bydlení, jídlo, energie, doprava'
  },
  WANTS: {
    type: 'WANTS',
    label: 'Radosti (30%)',
    percentage: 30,
    color: '#a855f7', // Purple
    description: 'Zábava, restaurace, koníčky, nákupy'
  },
  SAVINGS: {
    type: 'SAVINGS',
    label: 'Budoucnost (20%)',
    percentage: 20,
    color: '#22c55e', // Green
    description: 'Investice, spoření, splácení dluhů'
  },
  GIVING: {
    type: 'GIVING',
    label: 'Dary a pomoc (10%)',
    percentage: 10,
    color: '#f97316', // Orange
    description: 'Charita, dárky, finanční rezerva'
  }
};