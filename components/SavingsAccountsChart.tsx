import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ImportedDocument } from '../types.ts';
import { Wallet } from 'lucide-react';

interface SavingsAccountsChartProps {
  documents: ImportedDocument[];
}

export const SavingsAccountsChart: React.FC<SavingsAccountsChartProps> = ({ documents }) => {
  // Filtrujeme dokumenty, které mají informace o zůstatku
  const accountsData = documents
    .filter(doc => doc.balance !== undefined && doc.balance !== null)
    .map(doc => ({
      name: doc.accountName || doc.name,
      balance: doc.balance || 0,
      type: doc.accountType,
      currency: doc.currency || 'CZK'
    }));

  if (accountsData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center items-center text-center space-y-3 h-full">
         <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
           <Wallet className="w-6 h-6" />
         </div>
         <div>
           <h3 className="font-semibold text-slate-800">Přehled účtů</h3>
           <p className="text-sm text-slate-500 mt-1 max-w-[200px]">
             Nahrajte výpis z banky (PDF) pro zobrazení zůstatků na běžných a spořících účtech.
           </p>
         </div>
      </div>
    );
  }

  // Barvy: Zelená pro spořicí, Modrá pro běžné
  const getBarColor = (type: string | undefined) => {
    return type === 'SAVINGS' ? '#22c55e' : '#3b82f6';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 px-2">Zůstatky na účtech</h3>
      <div className="flex-grow min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={accountsData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11 }} 
              interval={0}
              tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-xs">
                      <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                      <p className="text-slate-500 mb-2">
                        {data.type === 'SAVINGS' ? 'Spořicí účet' : 'Běžný účet'}
                      </p>
                      <p className="font-bold text-lg" style={{ color: payload[0].color }}>
                        {data.balance.toLocaleString('cs-CZ')} {data.currency}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="balance" radius={[6, 6, 0, 0]} barSize={40}>
              {accountsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Běžné účty</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Spořicí účty</span>
        </div>
      </div>
    </div>
  );
};