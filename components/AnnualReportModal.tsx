import React, { useMemo } from 'react';
import { X, Trophy, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { Transaction, BUDGET_RULES, CategoryType } from '../types.ts';

interface AnnualReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  transactions: Transaction[];
}

export const AnnualReportModal: React.FC<AnnualReportModalProps> = ({ isOpen, onClose, year, transactions }) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
    const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === year);
    
    const income = yearTransactions
      .filter(t => t.category === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = yearTransactions
      .filter(t => ['NEEDS', 'WANTS', 'GIVING'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savings = yearTransactions
      .filter(t => t.category === 'SAVINGS')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses - savings; // What is left on current account
    const totalSaved = savings + Math.max(0, balance); // Conservative estimate of net worth increase
    const savingsRate = income > 0 ? (totalSaved / income) * 100 : 0;

    // Spending by category
    const byCategory = (['NEEDS', 'WANTS', 'GIVING', 'SAVINGS'] as CategoryType[]).map(cat => ({
      ...BUDGET_RULES[cat],
      amount: yearTransactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
    }));

    return {
      income,
      expenses,
      savings,
      totalSaved,
      savingsRate,
      byCategory,
      count: yearTransactions.length
    };
  }, [transactions, year]);

  const formatCurrency = (val: number) => val.toLocaleString('cs-CZ', { maximumFractionDigits: 0 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Roční přehled {year}</h2>
              <p className="text-indigo-100 opacity-90">
                Finanční bilance a úspěchy
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
               <div className="flex items-center gap-2 mb-2 text-emerald-700">
                 <TrendingUp className="w-5 h-5" />
                 <span className="font-semibold">Celkové Příjmy</span>
               </div>
               <p className="text-2xl font-bold text-emerald-800">{formatCurrency(stats.income)}</p>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
               <div className="flex items-center gap-2 mb-2 text-rose-700">
                 <TrendingDown className="w-5 h-5" />
                 <span className="font-semibold">Celkové Výdaje</span>
               </div>
               <p className="text-2xl font-bold text-rose-800">{formatCurrency(stats.expenses)}</p>
               <p className="text-xs text-rose-600 mt-1">(bez úspor)</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
               <div className="flex items-center gap-2 mb-2 text-indigo-700">
                 <Wallet className="w-5 h-5" />
                 <span className="font-semibold">Čisté jmění +</span>
               </div>
               <p className="text-2xl font-bold text-indigo-800">{formatCurrency(stats.totalSaved)}</p>
               <p className="text-xs text-indigo-600 mt-1">
                 Míra úspor: <span className="font-bold">{stats.savingsRate.toFixed(1)}%</span>
               </p>
            </div>
          </div>

          {/* Breakdown */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-500" />
              Plnění ročního rozpočtu
            </h3>
            <div className="space-y-4">
              {stats.byCategory.map(cat => {
                const percentOfIncome = stats.income > 0 ? (cat.amount / stats.income) * 100 : 0;
                const isOver = percentOfIncome > cat.percentage + 5; // 5% buffer
                
                return (
                  <div key={cat.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{cat.label.split('(')[0]}</span>
                      <span className="text-slate-500">
                        {formatCurrency(cat.amount)} ({percentOfIncome.toFixed(1)}%) / Cíl {cat.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(percentOfIncome, 100)}%`,
                          backgroundColor: isOver && cat.type !== 'SAVINGS' ? '#ef4444' : cat.color 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-slate-500 text-sm italic">
              "Tento rok jste provedli celkem {stats.count} transakcí."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};