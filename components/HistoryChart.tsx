import React, { useState } from 'react';
import { ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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
      const netFlow = item.income - item.expenses; 
      const monthlySavingsGrowth = netFlow + item.invested;
      runningTotal += monthlySavingsGrowth;

      return {
        label: item.rawDate.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' }),
        income: item.income,
        expenses: item.expenses,
        savingsFlow: netFlow, 
        cumulativeSavings: runningTotal
      };
    })
    .slice(-12); // Show last 12 months

  if (data.length === 0) return null;

  return (
    <div className="h-[400px] w-full bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Vývoj majetku</h3>
          <p className="text-xs text-slate-500">Měsíční toky vs. Celkové úspory</p>
        </div>
        <button 
          onClick={() => setShowCumulative(!showCumulative)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${showCumulative ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <TrendingUp className="w-3 h-3" />
          {showCumulative ? 'Skrýt úspory' : 'Zobrazit úspory'}
        </button>
      </div>
      
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            {showCumulative && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b5cf6', fontSize: 11, fontWeight: 600 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
            )}
            <Tooltip 
              content={({ active, payload, label }) => {
                 if (active && payload && payload.length) {
                   return (
                     <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-xs">
                       <p className="font-bold text-slate-800 mb-2">{label}</p>
                       {payload.map((entry: any) => (
                         <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
                           <span style={{ color: entry.color }}>{entry.name}:</span>
                           <span className="font-semibold">{entry.value.toLocaleString('cs-CZ')}</span>
                         </div>
                       ))}
                     </div>
                   );
                 }
                 return null;
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
            <ReferenceLine yAxisId="left" y={0} stroke="#cbd5e1" />
            
            {/* Bars for monthly flow */}
            <Bar yAxisId="left" name="Příjmy" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} fillOpacity={0.6} />
            <Bar yAxisId="left" name="Výdaje" dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} fillOpacity={0.6} />
            
            {/* Area for Cumulative Savings */}
            {showCumulative && (
              <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulativeSavings" 
                name="Celkové úspory" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSavings)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};