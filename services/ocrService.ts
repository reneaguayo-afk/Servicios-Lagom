import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface ExtractedData {
  name: string;
  taxId: string; // RFC
  address: string;
  fiscalRegime: string;
  type: 'Moral' | 'Física';
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/png;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const analyzeTaxDocument = async (file: File): Promise<ExtractedData | null> => {
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }

  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;

    const prompt = `
      Analiza este documento legal/fiscal mexicano (probablemente una Constancia de Situación Fiscal o Identificación).
      Extrae la siguiente información con precisión:
      1. Nombre completo o Razón Social.
      2. RFC (Tax ID).
      3. Dirección Fiscal completa (Calle, Número, Colonia, CP, Estado).
      4. Régimen Fiscal (si aparece).
      5. Determina si es Persona Física o Moral basado en el RFC o nombre.

      Si algún dato no es visible, déjalo como cadena vacía.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            taxId: { type: Type.STRING },
            address: { type: Type.STRING },
            fiscalRegime: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Moral', 'Física'] }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractedData;
    }
    return null;

  } catch (error) {
    console.error("Error analyzing document:", error);
    return null;
  }
};