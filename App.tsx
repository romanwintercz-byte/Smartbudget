import React, { useState, useEffect, useMemo } from 'react';
import { SmartInput } from './components/SmartInput.tsx';
import { FileUploader } from './components/FileUploader.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { BudgetChart } from './components/BudgetChart.tsx';
import { Advisor } from './components/Advisor.tsx';
import { HistoryChart } from './components/HistoryChart.tsx';
import { MonthSelector } from './components/MonthSelector.tsx';
import { Transaction, BUDGET_RULES, CategoryType } from './types.ts';
import { Wallet, Settings, LayoutDashboard, Plus, Users } from 'lucide-react';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sb_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem('sb_income');
    return saved ? parseFloat(saved) : 50000;
  });

  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Save data
  useEffect(() => {
    localStorage.setItem('sb_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sb_income', manualMonthlyIncome.toString());
  }, [manualMonthlyIncome]);

  // Compute available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }));
    return Array.from(months).sort();
  }, [transactions]);

  // Set default month to latest available or current
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    } else if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
       // If selected month was deleted or no longer valid
       setSelectedMonth(availableMonths[availableMonths.length - 1]);
    } else if (transactions.length === 0) {
       // Default to current month if no data
       const now = new Date();
       setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
  }, [availableMonths, selectedMonth, transactions]);

  // Filter transactions for the current view
  const currentMonthTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Calculate Income for the selected month
  // Strategy: If there are INCOME transactions in the month, sum them. 
  // If not (e.g. manual usage without income tracking), use the manual setting.
  const currentMonthIncome = useMemo(() => {
    const incomeFromTransactions = currentMonthTransactions
      .filter(t => t.category === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return incomeFromTransactions > 0 ? incomeFromTransactions : manualMonthlyIncome;
  }, [currentMonthTransactions, manualMonthlyIncome]);

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      date: new Date().toISOString(), // Manual entry defaults to today
    };
    setTransactions(prev => [...prev, newTransaction]);
    // Also switch view to this month if needed
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonthKey);
  };

  const addBulkTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
    const formatted = newTransactions.map(t => ({
      ...t,
      id: crypto.randomUUID(),
    }));
    setTransactions(prev => [...prev, ...formatted]);
    
    // Switch to the month of the last transaction uploaded
    if (formatted.length > 0) {
       const lastDate = new Date(formatted[0].date);
       const monthKey = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;
       setSelectedMonth(monthKey);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const calculateTotal = (category?: CategoryType) => {
    return currentMonthTransactions
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">SmartBudget</h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Rodinné finance 40/30/20/10</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {availableMonths.length > 0 && (
               <MonthSelector 
                 currentMonth={selectedMonth} 
                 availableMonths={availableMonths} 
                 onChange={setSelectedMonth} 
               />
            )}
            
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isSettingsOpen && (
          <div className="border-t border-slate-100 bg-slate-50 p-4 animate-in slide-in-from-top-2">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-4 h-4" />
                <span>Tip: Nahrajte PDF výpisy všech členů rodiny. Aplikace data sloučí.</span>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <label className="font-medium text-slate-600">Očekávaný měsíční příjem (pro plánování):</label>
                <input 
                  type="number" 
                  value={manualMonthlyIncome}
                  onChange={(e) => setManualMonthlyIncome(parseFloat(e.target.value) || 0)}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm w-32"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Input Method Tabs */}
        <section className="max-w-2xl mx-auto mb-8">
          <div className="flex bg-slate-100 p-1 rounded-lg w-fit mx-auto mb-6">
             <button 
               onClick={() => setActiveTab('manual')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Plus className="w-4 h-4" />
               Rychlý vstup
             </button>
             <button 
               onClick={() => setActiveTab('upload')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <LayoutDashboard className="w-4 h-4" />
               Nahrát PDF Výpis
             </button>
          </div>

          <div className="animate-in fade-in zoom-in-95 duration-300">
            {activeTab === 'manual' ? (
              <SmartInput onAddTransaction={addTransaction} />
            ) : (
              <FileUploader onTransactionsParsed={addBulkTransactions} />
            )}
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Budget Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {(Object.keys(BUDGET_RULES) as CategoryType[])
                 .filter(cat => BUDGET_RULES[cat].isBudgetCategory)
                 .map(cat => {
                   const rule = BUDGET_RULES[cat];
                   const spent = calculateTotal(cat);
                   const target = (currentMonthIncome * rule.percentage) / 100;
                   const percentUsed = target > 0 ? Math.min((spent / target) * 100, 100) : 0;
                   const isOver = spent > target && target > 0;

                   return (
                     <div key={cat} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-colors">
                       <div className={`absolute top-0 left-0 h-1 transition-all duration-1000 ease-out`} style={{ width: `${percentUsed}%`, backgroundColor: rule.color }}></div>
                       <p className="text-xs font-semibold text-slate-400 mb-1 flex justify-between">
                         <span>{rule.percentage}% {rule.label.split('(')[0].trim()}</span>
                       </p>
                       <p className="text-lg font-bold text-slate-800 tracking-tight">{formatCurrency(spent)}</p>
                       <p className="text-xs text-slate-400">cíl {formatCurrency(target)}</p>
                       {isOver && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Překročen rozpočet"></span>}
                     </div>
                   )
               })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BudgetChart transactions={currentMonthTransactions} totalIncome={currentMonthIncome} />
              <Advisor transactions={currentMonthTransactions} totalIncome={currentMonthIncome} />
            </div>

            {/* History Chart - Full Width */}
            <HistoryChart transactions={transactions} />

          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
               <h3 className="text-sm font-semibold text-emerald-800 mb-1">Měsíční bilance</h3>
               <p className="text-xs text-emerald-600 mb-3">Příjmy vs. Výdaje v {selectedMonth}</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-bold text-emerald-700">
                   {formatCurrency(calculateTotal('INCOME') - (calculateTotal('NEEDS') + calculateTotal('WANTS') + calculateTotal('GIVING') + calculateTotal('SAVINGS')))}
                 </span>
                 <span className="text-sm text-emerald-600">CZK</span>
               </div>
            </div>

            <TransactionList 
              transactions={currentMonthTransactions} 
              onDelete={deleteTransaction} 
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;