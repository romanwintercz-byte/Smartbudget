import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, BUDGET_RULES, CategoryType } from '../types.ts';

interface BudgetChartProps {
  transactions: Transaction[];
  totalIncome: number;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ transactions, totalIncome }) => {
  // Filter only budget categories (NEEDS, WANTS, SAVINGS, GIVING)
  const budgetCategories = (Object.keys(BUDGET_RULES) as CategoryType[]).filter(
    cat => BUDGET_RULES[cat].isBudgetCategory
  );

  const data = budgetCategories.map(catKey => {
    const totalSpent = transactions
      .filter(t => t.category === catKey)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: BUDGET_RULES[catKey].label,
      value: totalSpent,
      color: BUDGET_RULES[catKey].color,
      target: (totalIncome * BUDGET_RULES[catKey].percentage) / 100
    };
  });

  // Calculate unallocated based on income
  const totalSpent = data.reduce((sum, item) => sum + item.value, 0);
  const remaining = Math.max(0, totalIncome - totalSpent);
  
  const chartData = [
    ...data,
    ...(remaining > 0 ? [{ name: 'Zbývá z příjmu', value: remaining, color: '#e2e8f0', target: 0 }] : [])
  ];

  return (
    <div className="h-[300px] w-full bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Rozložení výdajů</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
             formatter={(value: number) => value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' CZK'}
             contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};