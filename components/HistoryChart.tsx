import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Transaction } from '../types.ts';

interface HistoryChartProps {
  transactions: Transaction[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ transactions }) => {
  // 1. Group transactions by month (YYYY-MM)
  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[key]) {
      acc[key] = { month: key, income: 0, expenses: 0, savings: 0 };
    }

    if (t.category === 'INCOME') {
      acc[key].income += t.amount;
    } else if (t.category !== 'TRANSFER') {
      // Transfer se nepočítá do výdajů
      acc[key].expenses += t.amount;
    }

    return acc;
  }, {} as Record<string, { month: string, income: number, expenses: number, savings: number }>);

  // 2. Calculate savings and format for chart
  const data = Object.values(monthlyData)
    .map(item => ({
      ...item,
      savings: item.income - item.expenses,
      label: new Date(item.month + '-01').toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' })
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Show only last 6 months

  if (data.length === 0) return null;

  return (
    <div className="h-[350px] w-full bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Trend úspor a výdajů</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={(value: number) => value.toLocaleString('cs-CZ') + ' CZK'}
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          <Bar name="Příjmy" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar name="Výdaje" dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar name="Bilance (Úspora)" dataKey="savings" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};