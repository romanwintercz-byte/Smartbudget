import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthSelectorProps {
  currentMonth: string; // Format YYYY-MM
  availableMonths: string[];
  onChange: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonth, availableMonths, onChange }) => {
  const currentIndex = availableMonths.indexOf(currentMonth);
  
  const handlePrev = () => {
    if (currentIndex > 0) onChange(availableMonths[currentIndex - 1]);
  };

  const handleNext = () => {
    if (currentIndex < availableMonths.length - 1) onChange(availableMonths[currentIndex + 1]);
  };

  const formatDate = (isoMonth: string) => {
    if (!isoMonth) return 'Vyberte měsíc';
    const [year, month] = isoMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-slate-100 min-w-[250px]">
      <button 
        onClick={handlePrev} 
        disabled={currentIndex <= 0}
        className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 px-4">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="font-semibold text-slate-800 capitalize">
          {formatDate(currentMonth)}
        </span>
      </div>

      <button 
        onClick={handleNext} 
        disabled={currentIndex >= availableMonths.length - 1 || currentIndex === -1}
        className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};