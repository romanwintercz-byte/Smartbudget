import React from 'react';
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';

interface YearSelectorProps {
  currentYear: number;
  availableYears: number[];
  onChange: (year: number) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({ currentYear, availableYears, onChange }) => {
  const currentIndex = availableYears.indexOf(currentYear);
  
  // Ensure we have at least the current year if list is empty
  const displayYears = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];
  const safeIndex = displayYears.indexOf(currentYear) !== -1 ? displayYears.indexOf(currentYear) : 0;

  const handlePrev = () => {
    if (safeIndex > 0) onChange(displayYears[safeIndex - 1]);
  };

  const handleNext = () => {
    if (safeIndex < displayYears.length - 1) onChange(displayYears[safeIndex + 1]);
  };

  return (
    <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-slate-100 min-w-[180px]">
      <button 
        onClick={handlePrev} 
        disabled={safeIndex <= 0}
        className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 px-2">
        <CalendarRange className="w-4 h-4 text-indigo-600" />
        <span className="font-bold text-slate-800 text-lg">
          {currentYear}
        </span>
      </div>

      <button 
        onClick={handleNext} 
        disabled={safeIndex >= displayYears.length - 1}
        className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};