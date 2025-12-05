import React, { useMemo } from 'react';
import { X, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, CategoryType, BUDGET_RULES } from '../types.ts';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryType | null;
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#94a3b8', '#3b82f6', '#ef4444'];

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({ isOpen, onClose, category, transactions }) => {
  if (!isOpen || !category) return null;

  const rule = BUDGET_RULES[category];

  // Filtrování a seskupování transakcí podle popisu (obchodníka)
  const stats = useMemo(() => {
    const filtered = transactions.filter(t => t.category === category);
    
    // Group by description
    const groups: Record<string, number> = {};
    filtered.forEach(t => {
      const key = t.description.trim();
      groups[key] = (groups[key] || 0) + t.amount;
    });

    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

    // Convert to array and sort
    const sortedGroups = Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Take top 8 and group rest to "Ostatní" (zvýšeno z 5, když nemáme seznam)
    const topItems = sortedGroups.slice(0, 8);
    const othersValue = sortedGroups.slice(8).reduce((sum, item) => sum + item.value, 0);
    
    const chartData = [...topItems];
    if (othersValue > 0) {
      chartData.push({ name: 'Ostatní', value: othersValue });
    }

    return {
      chartData,
      totalAmount,
      transactionCount: filtered.length
    };
  }, [transactions, category]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: rule.color }}>
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{rule.label}</h2>
              <p className="text-sm text-slate-500">
                Celkem: <span className="font-semibold text-slate-700">{stats.totalAmount.toLocaleString('cs-CZ')} CZK</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Pure Chart */}
        <div className="p-6 flex flex-col items-center justify-center bg-white min-h-[400px]">
           {stats.chartData.length > 0 ? (
             <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percent = ((data.value / stats.totalAmount) * 100).toFixed(1);
                        return (
                          <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                            <p className="font-bold text-slate-800 text-sm mb-1">{data.name}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-indigo-600 font-bold">{data.value.toLocaleString('cs-CZ')} CZK</span>
                              <span className="text-xs text-slate-400">({percent}%)</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
             </ResponsiveContainer>
           ) : (
             <div className="text-center text-slate-400">
                <p>V této kategorii zatím nejsou žádné transakce.</p>
             </div>
           )}
           <p className="text-xs text-slate-400 mt-2 text-center">
             Najeďte myší na graf pro zobrazení detailů obchodníka.
           </p>
        </div>
      </div>
    </div>
  );
};