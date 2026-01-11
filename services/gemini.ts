
import { GoogleGenAI } from "@google/genai";
import { Dataset, FilterState } from "../types";

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRetryable = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('quota');
      if (!isRetryable || i === maxRetries - 1) break;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export const getAIInsights = async (dataset: Dataset, filters: any): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const summaryString = JSON.stringify({ name: dataset.name, stats: dataset.summary, activeFilters: filters });
    const prompt = `As a Senior BI Analyst, provide narrative "AI Insights" for this dataset summary: ${summaryString}. Executive summary with bullet points. Answer in Turkish.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Unable to generate insights.";
  }).catch(() => "AI service error.");
};

export const getChartExplanation = async (chartTitle: string, chartType: string): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      As a BI Specialist, explain this specific chart:
      Title: "${chartTitle}"
      Type: "${chartType}"
      
      Provide a Turkish explanation including:
      1. What it shows (1 paragraph)
      2. How to read it (3-5 bullets)
      3. What to watch out for (1 bullet)
      Answer in Turkish language only.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Açıklama üretilemedi.";
  });
};

export const getChatQueryPlan = async (question: string, dataset: Dataset): Promise<any> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const schema = JSON.stringify(dataset.mapping);
    const prompt = `
      As a Data Analyst, translate the following Turkish question into a JSON Query Plan for a BI system.
      Question: "${question}"
      Schema: ${schema}

      JSON format:
      {
        "intent": "topN" | "trend" | "distribution",
        "groupBy": "branch" | "city" | "category" | "month" | "weekday",
        "metric": "revenue" | "profit" | "units" | "transactions",
        "chart": "bar" | "line",
        "titleTR": "string (A descriptive Turkish title for the chart, e.g., 'Haftalık Kâr Trendi')",
        "topN": number,
        "filters": { "year": number, "city": string, "category": string }
      }
      Only return the JSON object, nothing else.
    `;
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  });
};
