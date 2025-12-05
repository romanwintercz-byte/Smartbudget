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
    
    // Schema for structured output
    // Fix: Use Type enum from @google/genai for responseSchema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "Číselná hodnota transakce. Vždy kladné číslo." },
        currency: { type: Type.STRING, description: "Kód měny, např. CZK, USD, EUR. Pokud není uvedeno, předpokládej CZK." },
        category: { 
          type: Type.STRING, 
          enum: ["NEEDS", "WANTS", "SAVINGS", "GIVING"],
          description: "Kategorizace dle pravidla 40/30/20/10. NEEDS=Nutné, WANTS=Radosti, SAVINGS=Budoucnost, GIVING=Dary" 
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

export const getBudgetAdvice = async (transactions: Transaction[], totalIncome: number) => {
  try {
    const ai = getAiClient();
    
    // Calculate current breakdown
    const breakdown = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<CategoryType, number>);

    const prompt = `
      Chovej se jako zkušený, ale empatický český finanční poradce, který využívá metodu rozpočtu 40/30/20/10.
      
      Kontext:
      Celkový měsíční příjem: ${totalIncome}
      Aktuální útrata:
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