import React from 'react';
import { Transaction, BUDGET_RULES, CategoryType } from '../types.ts';
import { Trash2, TrendingUp, Heart, Home, ShoppingBag, ArrowRightLeft, Banknote, Edit2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, newCategory: CategoryType) => void;
}

const getIcon = (category: string) => {
  switch (category) {
    case 'NEEDS': return <Home className="w-4 h-4" />;
    case 'WANTS': return <ShoppingBag className="w-4 h-4" />;
    case 'SAVINGS': return <TrendingUp className="w-4 h-4" />;
    case 'GIVING': return <Heart className="w-4 h-4" />;
    case 'TRANSFER': return <ArrowRightLeft className="w-4 h-4" />;
    case 'INCOME': return <Banknote className="w-4 h-4" />;
    default: return <div className="w-4 h-4 rounded-full bg-slate-200" />;
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onCategoryChange }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
        <p className="text-slate-400">Zatím žádné transakce. Zkuste nahrát PDF výpis!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Historie transakcí</h3>
        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{transactions.length} položek</span>
      </div>
      <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
        {transactions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => {
            const rule = BUDGET_RULES[t.category];
            const isIncome = t.category === 'INCOME';
            const isTransfer = t.category === 'TRANSFER';
            
            return (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  
                  {/* Category Changer */}
                  <div className="relative group/icon cursor-pointer">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover/icon:scale-105 ${isTransfer ? 'opacity-70' : ''}`}
                      style={{ backgroundColor: rule.color }}
                    >
                      {getIcon(t.category)}
                    </div>
                    {/* Invisible Select overlay for easy category switching */}
                    <select
                      value={t.category}
                      onChange={(e) => onCategoryChange(t.id, e.target.value as CategoryType)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Změnit kategorii"
                    >
                      {(Object.keys(BUDGET_RULES) as CategoryType[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {BUDGET_RULES[cat].label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none">
                      <Edit2 className="w-2 h-2 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <p className={`font-medium ${isTransfer ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                      {t.description}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {new Date(t.date).toLocaleDateString('cs-CZ')} • 
                      <span className="text-slate-400">{rule.label.split('(')[0]}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`font-bold block ${
                      isIncome ? 'text-emerald-600' : isTransfer ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {isIncome ? '+' : isTransfer ? '' : '-'}{t.amount.toLocaleString('cs-CZ')} <span className="text-xs font-normal opacity-70">{t.currency}</span>
                    </span>
                  </div>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Smazat transakci"
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