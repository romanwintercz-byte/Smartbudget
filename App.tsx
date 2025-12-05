import React, { useState, useEffect, useMemo } from 'react';
import { SmartInput } from './components/SmartInput.tsx';
import { FileUploader } from './components/FileUploader.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { BudgetChart } from './components/BudgetChart.tsx';
import { Advisor } from './components/Advisor.tsx';
import { HistoryChart } from './components/HistoryChart.tsx';
import { MonthSelector } from './components/MonthSelector.tsx';
import { CategoryDetailModal } from './components/CategoryDetailModal.tsx';
import { SavingsAccountsChart } from './components/SavingsAccountsChart.tsx';
import { Transaction, BUDGET_RULES, CategoryType, ImportedDocument, AccountMetadata } from './types.ts';
import { Wallet, Settings, LayoutDashboard, Plus, FileText, Trash2, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sb_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [documents, setDocuments] = useState<ImportedDocument[]>(() => {
    const saved = localStorage.getItem('sb_documents');
    return saved ? JSON.parse(saved) : [];
  });

  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem('sb_income');
    return saved ? parseFloat(saved) : 50000;
  });

  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Modal state
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryType | null>(null);

  // Save data
  useEffect(() => {
    localStorage.setItem('sb_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sb_income', manualMonthlyIncome.toString());
  }, [manualMonthlyIncome]);

  useEffect(() => {
    localStorage.setItem('sb_documents', JSON.stringify(documents));
  }, [documents]);

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
    } else if (transactions.length === 0 && !selectedMonth) {
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
    
    // Switch view to this month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonthKey);
  };

  const addBulkTransactions = (newTransactions: Omit<Transaction, 'id'>[], fileName: string, metadata: AccountMetadata) => {
    const docId = crypto.randomUUID();
    
    // Create new document entry with metadata
    const newDoc: ImportedDocument = {
      id: docId,
      name: fileName,
      uploadDate: new Date().toISOString(),
      transactionCount: newTransactions.length,
      ...metadata // Spread metadata (balance, type, accountName...)
    };
    
    setDocuments(prev => [...prev, newDoc]);

    const formatted = newTransactions.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      documentId: docId
    }));
    setTransactions(prev => [...prev, ...formatted]);
    
    if (formatted.length > 0) {
       const lastDate = new Date(formatted[0].date);
       const monthKey = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;
       setSelectedMonth(monthKey);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransactionCategory = (id: string, newCategory: CategoryType) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, category: newCategory } : t
    ));
  };

  const deleteDocument = (docId: string) => {
    if (confirm('Opravdu chcete smazat tento dokument a všechny jeho transakce?')) {
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setTransactions(prev => prev.filter(t => t.documentId !== docId));
    }
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
      {/* Category Modal */}
      <CategoryDetailModal 
        isOpen={!!selectedCategoryDetail}
        onClose={() => setSelectedCategoryDetail(null)}
        category={selectedCategoryDetail}
        transactions={currentMonthTransactions}
      />

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
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${isSettingsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Nastavení</span>
            </button>
          </div>
        </div>
        
        {/* Settings Drawer */}
        {isSettingsOpen && (
          <div className="border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 shadow-inner">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
              
              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Column 1: Advisor & General */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Smart Poradce</h3>
                    <Advisor transactions={currentMonthTransactions} totalIncome={currentMonthIncome} />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Obecné nastavení</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex flex-col gap-2">
                         <label className="font-medium text-slate-600 text-sm">Očekávaný měsíční příjem (pro manuální režim):</label>
                         <div className="flex items-center gap-2">
                           <input 
                            type="number" 
                            value={manualMonthlyIncome}
                            onChange={(e) => setManualMonthlyIncome(parseFloat(e.target.value) || 0)}
                            className="px-3 py-2 border border-slate-300 rounded-md text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                           />
                           <span className="text-slate-500 text-sm">CZK</span>
                         </div>
                         <p className="text-xs text-slate-400 mt-1">Pokud nahráváte výpisy s příjmy, tato hodnota bude ignorována.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Imported Documents */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Importované výpisy</h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {documents.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Zatím žádné importované soubory.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {documents.map(doc => (
                          <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-sm truncate">{doc.name}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(doc.uploadDate).toLocaleDateString('cs-CZ')} • {doc.transactionCount} transakcí
                                </p>
                                {doc.balance && (
                                   <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                                     Zůstatek: {doc.balance.toLocaleString('cs-CZ')} {doc.currency}
                                   </p>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => deleteDocument(doc.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Smazat soubor a transakce"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

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
            
            {/* Budget Cards - Clickable now */}
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
                     <div 
                        key={cat} 
                        onClick={() => setSelectedCategoryDetail(cat)}
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all cursor-pointer hover:shadow-md"
                      >
                       <div className={`absolute top-0 left-0 h-1 transition-all duration-1000 ease-out`} style={{ width: `${percentUsed}%`, backgroundColor: rule.color }}></div>
                       
                       <div className="flex justify-between items-start mb-1">
                         <p className="text-xs font-semibold text-slate-400">
                           {rule.percentage}% {rule.label.split('(')[0].trim()}
                         </p>
                         <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>

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
              
              {/* Savings Accounts Chart (Replaces Advisor Link) */}
              <SavingsAccountsChart documents={documents} />
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
              onCategoryChange={updateTransactionCategory}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;