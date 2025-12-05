import React from 'react';
import { Transaction, BUDGET_RULES } from '../types.ts';
import { Trash2, TrendingUp, Heart, Home, ShoppingBag } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const getIcon = (category: string) => {
  switch (category) {
    case 'NEEDS': return <Home className="w-4 h-4" />;
    case 'WANTS': return <ShoppingBag className="w-4 h-4" />;
    case 'SAVINGS': return <TrendingUp className="w-4 h-4" />;
    case 'GIVING': return <Heart className="w-4 h-4" />;
    default: return <div className="w-4 h-4 rounded-full bg-slate-200" />;
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
        <p className="text-slate-400">Zatím žádné transakce. Zkuste AI vstup nahoře!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-50">
        <h3 className="text-lg font-semibold text-slate-800">Nedávná aktivita</h3>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {transactions.slice().reverse().map((t) => {
            const rule = BUDGET_RULES[t.category];
            return (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: rule.color }}
                  >
                    {getIcon(t.category)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('cs-CZ')} • {rule.label.split('(')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-700">
                    {t.amount.toLocaleString('cs-CZ')} <span className="text-xs font-normal text-slate-400">{t.currency}</span>
                  </span>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};