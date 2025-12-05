import React, { useState } from 'react';
import { BrainCircuit, RefreshCw } from 'lucide-react';
import { getBudgetAdvice } from '../services/geminiService.ts';
import { Transaction } from '../types.ts';
import ReactMarkdown from 'react-markdown';

interface AdvisorProps {
  transactions: Transaction[];
  totalIncome: number;
}

export const Advisor: React.FC<AdvisorProps> = ({ transactions, totalIncome }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    const result = await getBudgetAdvice(transactions, totalIncome);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full filter blur-[60px] opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary rounded-full filter blur-[60px] opacity-20"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-bold">Smart Poradce</h3>
          </div>
          <button 
            onClick={handleGetAdvice}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {advice ? 'Aktualizovat' : 'Analyzovat'}
          </button>
        </div>

        <div className="min-h-[100px] text-sm text-slate-300 leading-relaxed">
           {!advice && !loading && (
             <p className="italic opacity-60">
               Klikněte na Analyzovat pro získání AI rad, jak vaše výdaje odpovídají pravidlu 40/30/20/10.
             </p>
           )}
           {loading && (
             <div className="space-y-2 animate-pulse">
               <div className="h-2 bg-white/10 rounded w-3/4"></div>
               <div className="h-2 bg-white/10 rounded w-full"></div>
               <div className="h-2 bg-white/10 rounded w-5/6"></div>
             </div>
           )}
           {advice && !loading && (
             <div className="prose prose-invert prose-sm max-w-none">
                {/* Simplified markdown rendering for the demo */}
                <ReactMarkdown>{advice}</ReactMarkdown>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};