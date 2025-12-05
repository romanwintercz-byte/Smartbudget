import React, { useState, useEffect } from 'react';
import { SmartInput } from './components/SmartInput.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { BudgetChart } from './components/BudgetChart.tsx';
import { Advisor } from './components/Advisor.tsx';
import { Transaction, BUDGET_RULES, CategoryType } from './types.ts';
import { Wallet, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sb_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem('sb_income');
    return saved ? parseFloat(saved) : 50000;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sb_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sb_income', monthlyIncome.toString());
  }, [monthlyIncome]);

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const calculateTotal = (category?: CategoryType) => {
    return transactions
      .filter(t => !category || t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('cs-CZ', { maximumFractionDigits: 0 });
  };

  return (
    <div className="min-h-screen bg-bg font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">SmartBudget</h1>
              <p className="text-xs text-slate-500 font-medium">Strategie 40 / 30 / 20 / 10</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        {/* Simple Income Settings Dropdown */}
        {isSettingsOpen && (
          <div className="border-t border-slate-100 bg-slate-50 p-4 animate-in slide-in-from-top-2">
            <div className="max-w-5xl mx-auto flex items-center gap-4">
              <label className="text-sm font-medium text-slate-600">Čistý měsíční příjem:</label>
              <input 
                type="number" 
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                className="px-3 py-1 border border-slate-300 rounded-md text-sm w-32"
              />
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Smart Input Hero */}
        <section className="max-w-2xl mx-auto">
          <SmartInput onAddTransaction={addTransaction} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          
          {/* Left Column: Stats & Chart */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {(Object.keys(BUDGET_RULES) as CategoryType[]).map(cat => {
                 const rule = BUDGET_RULES[cat];
                 const spent = calculateTotal(cat);
                 const target = (monthlyIncome * rule.percentage) / 100;
                 const percentUsed = Math.min((spent / target) * 100, 100);
                 const isOver = spent > target;

                 return (
                   <div key={cat} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                     <div className={`absolute top-0 left-0 h-1 transition-all duration-500`} style={{ width: `${percentUsed}%`, backgroundColor: rule.color }}></div>
                     <p className="text-xs font-semibold text-slate-400 mb-1">{rule.percentage}% {rule.label.split('(')[0].trim()}</p>
                     <p className="text-lg font-bold text-slate-800">{formatCurrency(spent)}</p>
                     <p className="text-xs text-slate-400">z {formatCurrency(target)}</p>
                     {isOver && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Překročen rozpočet"></span>}
                   </div>
                 )
               })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BudgetChart transactions={transactions} totalIncome={monthlyIncome} />
              <Advisor transactions={transactions} totalIncome={monthlyIncome} />
            </div>

          </div>

          {/* Right Column: Transactions */}
          <div className="lg:col-span-1">
             <TransactionList transactions={transactions} onDelete={deleteTransaction} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;