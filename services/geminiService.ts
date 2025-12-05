import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategoryType, BUDGET_RULES } from "../types.ts";

const getAiClient = () => {
  // Vite config zajistí, že process.env.API_KEY bude nahrazeno hodnotou z env proměnné
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing. Make sure to set API_KEY in Vercel Environment Variables.");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseTransactionWithGemini = async (input: string): Promise<any> => {
  try {
    const ai = getAiClient();
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "Číselná hodnota transakce. Vždy kladné číslo." },
        currency: { type: Type.STRING, description: "Kód měny, např. CZK, USD, EUR. Pokud není uvedeno, předpokládej CZK." },
        category: { 
          type: Type.STRING, 
          enum: ["NEEDS", "WANTS", "SAVINGS", "GIVING", "INCOME", "TRANSFER"],
          description: "Kategorizace dle pravidla 40/30/20/10. TRANSFER použij pro převody mezi vlastními účty." 
        },
        description: { type: Type.STRING, description: "Stručný popis výdaje v češtině." },
      },
      required: ["amount", "currency", "category", "description"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extrahuj detaily transakce z tohoto textu: "${input}". 
      Text je pravděpodobně v češtině.
      Pravidla pro kategorie:
      - 40% NEEDS (Nutné): Nájem, účty, základní potraviny, doprava do práce.
      - 30% WANTS (Radosti): Restaurace, kino, koníčky, Netflix, zbytečné nákupy.
      - 20% SAVINGS (Budoucnost): Investice, spořicí účet, ETF, splátka dluhu.
      - 10% GIVING (Dary/Buffer): Charita, dárky pro ostatní, nečekané výdaje.
      - TRANSFER: Pokud jde jen o přesun peněz mezi vlastními účty.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const parsePdfStatement = async (base64Pdf: string): Promise<Omit<Transaction, 'id'>[]> => {
  try {
    const ai = getAiClient();

    // Schema pro pole transakcí
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Datum transakce ve formátu ISO YYYY-MM-DD" },
          amount: { type: Type.NUMBER, description: "Absolutní hodnota částky." },
          currency: { type: Type.STRING, description: "Měna (CZK, EUR...)" },
          description: { type: Type.STRING, description: "Popis transakce" },
          category: { 
            type: Type.STRING, 
            enum: ["NEEDS", "WANTS", "SAVINGS", "GIVING", "INCOME", "TRANSFER"],
            description: "Kategorie výdaje nebo příjmu."
          },
          type: {
            type: Type.STRING,
            enum: ["EXPENSE", "INCOME", "TRANSFER"],
            description: "Typ pohybu. EXPENSE pro výdaje, INCOME pro příjmy (mzda), TRANSFER pro vnitřní převody."
          }
        },
        required: ["date", "amount", "currency", "description", "category", "type"]
      }
    };

    const prompt = `
      Analyzuj tento bankovní výpis (PDF). 
      Ignoruj počáteční a konečné zůstatky, zajímají mě jen jednotlivé transakce.
      
      Tvým úkolem je inteligentně kategorizovat každou položku.
      
      DŮLEŽITÁ PRAVIDLA PRO PŘEVODY (TRANSFER):
      - Pokud je transakce splátka kreditní karty z běžného účtu, označ to jako TRANSFER.
      - Pokud je transakce přesun na spořící účet, označ to jako TRANSFER (nebo SAVINGS, pokud jde o trvalé spoření).
      - Pokud je to jen převod mezi vlastními účty, je to TRANSFER.
      - TRANSFER znamená, že tato transakce se nemá počítat do grafu výdajů ani příjmů.

      PRAVIDLA PRO KATEGORIE:
      - NEEDS: Bydlení, jídlo, energie, doprava.
      - WANTS: Zábava, restaurace, nákupy pro radost.
      - SAVINGS: Investice.
      - GIVING: Dary.
      - INCOME: Mzda, příchozí platby (pokud to není převod z vlastního účtu).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    
    const parsedData = JSON.parse(text);
    
    // Mapování výsledků na Transaction interface
    return parsedData.map((item: any) => ({
      date: item.date,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      category: item.category,
      isAiGenerated: true
    }));

  } catch (error) {
    console.error("Gemini PDF Parse Error:", error);
    throw new Error("Nepodařilo se zpracovat PDF. Zkuste to prosím znovu.");
  }
};

export const getBudgetAdvice = async (transactions: Transaction[], totalIncome: number) => {
  try {
    const ai = getAiClient();
    
    // Filtrovat pouze relevantní výdaje pro analýzu (ignorovat INCOME a TRANSFER)
    const validTransactions = transactions.filter(t => 
       t.category !== 'INCOME' && t.category !== 'TRANSFER'
    );

    const breakdown = validTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<CategoryType, number>);

    const prompt = `
      Chovej se jako zkušený, ale empatický český finanční poradce, který využívá metodu rozpočtu 40/30/20/10.
      
      Kontext:
      Nastavený čistý příjem: ${totalIncome}
      Aktuální útrata (očištěná o interní převody):
      - NUTNÉ VÝDAJE (Cíl 40%): ${breakdown.NEEDS || 0}
      - RADOSTI (Cíl 30%): ${breakdown.WANTS || 0}
      - BUDOUCNOST/SPOŘENÍ (Cíl 20%): ${breakdown.SAVINGS || 0}
      - DARY/POMOC (Cíl 10%): ${breakdown.GIVING || 0}

      Analyzuj výdajové vzorce uživatele. Dodržují pravidlo? 
      Poskytni 3 konkrétní, akční body poradenství v českém jazyce.
      Buď stručný, profesionální a povzbuzující.
      Výstup formátuj pomocí Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;

  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Omlouváme se, momentálně nelze vygenerovat radu. Zkontrolujte prosím API klíč v nastavení Vercel.";
  }
};