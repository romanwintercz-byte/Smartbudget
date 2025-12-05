import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Transaction } from '../types.ts';
import { TrendingUp } from 'lucide-react';

interface HistoryChartProps {
  transactions: Transaction[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ transactions }) => {
  const [showCumulative, setShowCumulative] = useState(true);

  // 1. Group transactions by month (YYYY-MM)
  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[key]) {
      acc[key] = { 
        monthKey: key, 
        rawDate: date,
        income: 0, 
        expenses: 0, 
        invested: 0 // SAVINGS category
      };
    }

    if (t.category === 'INCOME') {
      acc[key].income += t.amount;
    } else if (t.category === 'SAVINGS') {
      acc[key].expenses += t.amount; // Technicky výdaj z běžného účtu
      acc[key].invested += t.amount; // Ale jde do úspor
    } else if (t.category !== 'TRANSFER') {
      acc[key].expenses += t.amount;
    }

    return acc;
  }, {} as Record<string, { monthKey: string, rawDate: Date, income: 0, expenses: 0, invested: 0 }>);

  // 2. Calculate savings flow and Cumulative Savings
  let runningTotal = 0;
  
  const data = Object.values(monthlyData)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map(item => {
      // Flow = Příjmy - Všechny výdaje (včetně toho, co šlo na spoření)
      // Pokud uživatel nahrává výpis ze spořícího účtu, může to být složitější, 
      // ale základní logika je: Co zbylo z příjmů + Co jsem cíleně poslal na SAVINGS
      
      const netFlow = item.income - item.expenses; 
      
      // Kumulativní úspory: K tomu, co jsem měl, přičtu čistý tok + to co jsem poslal na investice (protože to nejsou utracené peníze, ale aktiva)
      // Zjednodušeně: Úspory rostou o (Income - (Expenses - Invested)) -> Income - RealConsumed
      // RealConsumed = Expenses - Invested
      // SavingsIncrement = Income - RealConsumed = Income - (Expenses - Invested) = Income - Expenses + Invested
      // Ale jednodušeji: NetFlow (co zbylo na BÚ) + Invested (co odešlo na SÚ)
      
      const monthlySavingsGrowth = netFlow + item.invested;
      runningTotal += monthlySavingsGrowth;

      return {
        label: item.rawDate.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' }),
        income: item.income,
        expenses: item.expenses,
        savingsFlow: netFlow, // Kolik zbylo na účtu
        cumulativeSavings: runningTotal // Celkové jmění (nárůst)
      };
    })
    .slice(-12); // Show last 12 months

  if (data.length === 0) return null;

  return (
    <div className="h-[400px] w-full bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Vývoj financí</h3>
          <p className="text-xs text-slate-500">Příjmy vs. Výdaje a růst úspor</p>
        </div>
        <button 
          onClick={() => setShowCumulative(!showCumulative)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showCumulative ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
        >
          <TrendingUp className="w-3 h-3" />
          {showCumulative ? 'Skrýt kumulativní úspory' : 'Zobrazit kumulativní úspory'}
        </button>
      </div>
      
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            {showCumulative && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b5cf6', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
            )}
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'cumulativeSavings') return [value.toLocaleString('cs-CZ') + ' CZK', 'Celkové úspory'];
                if (name === 'income') return [value.toLocaleString('cs-CZ') + ' CZK', 'Příjmy'];
                if (name === 'expenses') return [value.toLocaleString('cs-CZ') + ' CZK', 'Výdaje'];
                return [value.toLocaleString('cs-CZ') + ' CZK', name];
              }}
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" />
            <ReferenceLine yAxisId="left" y={0} stroke="#cbd5e1" />
            
            {/* Bars for monthly flow */}
            <Bar yAxisId="left" name="Příjmy" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.8} />
            <Bar yAxisId="left" name="Výdaje" dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.8} />
            
            {/* Line for Cumulative Savings */}
            {showCumulative && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulativeSavings" 
                name="Kumulativní úspory" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
