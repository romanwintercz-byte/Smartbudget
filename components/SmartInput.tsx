import React, { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { parseTransactionWithGemini } from '../services/geminiService.ts';
import { Transaction } from '../types.ts';

interface SmartInputProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({ onAddTransaction }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await parseTransactionWithGemini(input);
      
      if (result) {
        onAddTransaction({
          amount: result.amount,
          currency: result.currency,
          category: result.category,
          description: result.description,
          isAiGenerated: true,
        });
        setInput('');
      } else {
        setError("Nerozumím této transakci. Zkuste to prosím jinak.");
      }
    } catch (err) {
      setError("AI služba není dostupná. Zadejte prosím výdaj ručně.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mb-8">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
        <div className="relative flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
          <div className="pl-3 pr-2 text-primary">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <input
            type="text"
            className="flex-grow p-3 bg-transparent outline-none text-slate-700 placeholder-slate-400"
            placeholder="Řekni mi, za co jsi utratil... (např. 'Večeře s rodinou 1200 CZK')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
      <p className="text-xs text-slate-400 mt-2 ml-1">
        Zkuste: "Nájem bytu 15000" nebo "Kino a popcorn 450 CZK"
      </p>
    </div>
  );
};