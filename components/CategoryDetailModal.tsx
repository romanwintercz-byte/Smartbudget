import React, { useMemo } from 'react';
import { X, PieChart as PieIcon, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, CategoryType, BUDGET_RULES } from '../types.ts';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryType | null;
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#94a3b8'];

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({ isOpen, onClose, category, transactions }) => {
  if (!isOpen || !category) return null;

  const rule = BUDGET_RULES[category];

  // Filtrování a seskupování transakcí podle popisu (obchodníka)
  const stats = useMemo(() => {
    const filtered = transactions.filter(t => t.category === category);
    
    // Group by description
    const groups: Record<string, number> = {};
    filtered.forEach(t => {
      // Zjednodušení popisu (odstranění čísel na konci, aby se sloučily např. "Billa 01" a "Billa 02")
      // Pro jednoduchost bereme celý popis, uživatel může přejmenovat transakce
      const key = t.description.trim();
      groups[key] = (groups[key] || 0) + t.amount;
    });

    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

    // Convert to array and sort
    const sortedGroups = Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Take top 5 and group rest to "Ostatní"
    const top5 = sortedGroups.slice(0, 5);
    const othersValue = sortedGroups.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    const chartData = [...top5];
    if (othersValue > 0) {
      chartData.push({ name: 'Ostatní', value: othersValue });
    }

    return {
      chartData,
      totalAmount,
      transactionCount: filtered.length,
      topTransactions: filtered.sort((a, b) => b.amount - a.amount).slice(0, 10)
    };
  }, [transactions, category]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: rule.color }}>
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{rule.label}</h2>
              <p className="text-sm text-slate-500">Detailní analýza útraty</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Chart */}
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString('cs-CZ') + ' CZK'}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Info */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Celkem utraceno</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalAmount.toLocaleString('cs-CZ')} CZK</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Počet plateb</p>
                <p className="text-2xl font-bold text-slate-900">{stats.transactionCount}</p>
              </div>
            </div>
          </div>

          {/* Top Spenders List */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Největší platby
            </h3>
            <div className="space-y-3">
              {stats.topTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {t.description.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t.description}</p>
                      <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('cs-CZ')}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">
                    -{t.amount.toLocaleString('cs-CZ')} <span className="text-xs font-normal text-slate-400">{t.currency}</span>
                  </span>
                </div>
              ))}
              {stats.topTransactions.length === 0 && (
                 <p className="text-center text-slate-400 py-4">Žádné transakce v této kategorii.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
