import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parsePdfStatement } from '../services/geminiService.ts';
import { Transaction } from '../types.ts';

interface FileUploaderProps {
  onTransactionsParsed: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onTransactionsParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Prosím nahrajte pouze PDF soubory.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        // Odstranění prefixu "data:application/pdf;base64,"
        const base64Content = base64Data.split(',')[1];
        
        try {
          const transactions = await parsePdfStatement(base64Content);
          if (transactions.length > 0) {
            onTransactionsParsed(transactions);
          } else {
            setError("Nepodařilo se nalézt žádné transakce v tomto dokumentu.");
          }
        } catch (err) {
            console.error(err);
            setError("Chyba při analýze AI. Zkuste to prosím znovu.");
        } finally {
            setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Chyba při čtení souboru.");
        setIsLoading(false);
      };
    } catch (err) {
      setError("Neočekávaná chyba.");
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full mb-8">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center text-center group
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-700">Analyzuji bankovní výpis...</p>
            <p className="text-xs text-slate-500 mt-1">Hledám transakce a detekuji převody</p>
          </div>
        ) : (
          <>
            <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-indigo-200' : 'bg-white shadow-sm'}`}>
               <Upload className={`w-6 h-6 ${isDragging ? 'text-indigo-700' : 'text-slate-400 group-hover:text-indigo-600'}`} />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Klikněte pro nahrání PDF výpisu
            </p>
            <p className="text-xs text-slate-400 mt-1">
              nebo přetáhněte soubor sem. AI automaticky detekuje kategorie a ignoruje vnitřní převody.
            </p>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};