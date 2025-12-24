import { GoogleGenAI, Type } from "@google/genai";
import { Case, StageStatus, ServiceTemplate, RiskAnalysis } from "../types";

export const generateClientUpdate = async (caseData: Case): Promise<string> => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const clientName = "Cliente Estimado"; // Ideally fetch client name via ID
  const lastCompleted = caseData.stages.filter(s => s.status === StageStatus.COMPLETED).pop();
  const currentStage = caseData.stages.find(s => s.status === StageStatus.IN_PROGRESS) || caseData.stages.find(s => s.status === StageStatus.PENDING);
  
  const prompt = `
    Actúa como un abogado experto, profesional y empático.
    El nombre de tu firma es "Lagom Legal".
    
    Genera un mensaje corto de actualización para un cliente (WhatsApp/Email) basado en estos datos:
    - Servicio: ${caseData.serviceName}
    - Folio: ${caseData.folio}
    - Última etapa completada: ${lastCompleted ? lastCompleted.title : 'Inicio del servicio'}
    - Etapa actual/siguiente: ${currentStage ? currentStage.title : 'Finalización'}
    
    Instrucciones de tono:
    - Elegante pero claro.
    - Transmite tranquilidad ("Quiet Luxury").
    - Usa emojis moderados (máximo 2).
    - No inventes información, solo usa lo provisto.
    - Firma como "Tu equipo de Lagom Legal".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use response.text property directly as per guidelines
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Error generating update:", error);
    return "Hubo un error al conectar con el asistente de IA. Por favor intenta redactar manualmente.";
  }
};

export const generateServiceDetails = async (serviceName: string): Promise<Partial<ServiceTemplate> | null> => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Genera una plantilla detallada para un servicio legal llamado "${serviceName}".
    
    Necesito que incluyas:
    1. Una descripción profesional.
    2. El alcance del servicio (qué incluye).
    3. Riesgos comunes cubiertos o asociados.
    4. Una lista detallada de actividades (entre 15 y 20 pasos cronológicos).
    5. Recomendación preventiva para el cliente.
    6. Tiempo estimado de ejecución.
    7. Una categoría sugerida (ej. Corporativo, Laboral, etc).
    8. Un precio base estimado en MXN (número).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            scope: { type: Type.STRING },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            preventionTip: { type: Type.STRING },
            estimatedDuration: { type: Type.STRING },
            basePrice: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      // Use response.text property directly as per guidelines
      const data = JSON.parse(response.text);
      return {
        name: serviceName,
        description: data.description,
        category: data.category,
        scope: data.scope,
        risks: data.risks,
        prevention: data.preventionTip,
        estimatedDuration: data.estimatedDuration,
        basePrice: data.basePrice,
        defaultStages: data.steps.map((s: any) => ({
          title: s.title,
          description: s.description
        }))
      };
    }
    return null;
  } catch (error) {
    console.error("Error generating service template:", error);
    return null;
  }
};

export const analyzeOperationalRisk = async (cases: Case[]): Promise<RiskAnalysis | null> => {
   // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

   // Simplified case data for prompt to save tokens
   const caseSummaries = cases.map(c => ({
      id: c.id,
      service: c.serviceName,
      status: c.status,
      startDate: c.startDate,
      pendingStages: c.stages.filter(s => s.status !== StageStatus.COMPLETED).length,
      overdueStages: c.stages.filter(s => s.status !== StageStatus.COMPLETED && s.dueDate && new Date(s.dueDate) < new Date()).length
   }));

   const prompt = `
     Analiza el siguiente conjunto de casos legales activos y genera un análisis de riesgo operativo y recomendaciones.
     
     Casos: ${JSON.stringify(caseSummaries)}
     
     Reglas de Negocio:
     - Muchos casos vencidos = Alto Riesgo.
     - Casos antiguos sin terminar = Riesgo Medio/Alto.
     
     Salida JSON requerida:
     1. prediction: Lista de casos en riesgo (caseId, riskLevel, reason, suggestion).
     2. overallRisk: LOW, MEDIUM, HIGH.
   `;

   try {
      const response = await ai.models.generateContent({
         model: 'gemini-3-pro-preview',
         contents: prompt,
         config: {
            responseMimeType: 'application/json',
            responseSchema: {
               type: Type.OBJECT,
               properties: {
                  overallRisk: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                  predictions: {
                     type: Type.ARRAY,
                     items: {
                        type: Type.OBJECT,
                        properties: {
                           caseId: { type: Type.STRING },
                           riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                           reason: { type: Type.STRING },
                           suggestion: { type: Type.STRING }
                        }
                     }
                  }
               }
            }
         }
      });

      if (response.text) {
         // Use response.text property directly as per guidelines
         return JSON.parse(response.text) as RiskAnalysis;
      }
      return null;
   } catch (error) {
      console.error("Error analyzing risks", error);
      return null;
   }
};

export interface ProposalContent {
  executiveSummary: string;
  serviceDescription: string;
  scope: string;
  nextSteps: string;
}

export const generateProposalContent = async (serviceName: string, clientName: string, customScope: string): Promise<ProposalContent | null> => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Actúa como un Socio Director Senior de "Lagom Legal", una firma de élite ("Quiet Luxury").
    
    OBJETIVO: Redactar el contenido para una Propuesta de Servicios Profesionales DE ALTO VALOR (White Paper Style).
    LONGITUD OBJETIVO: El texto total debe ser muy extenso, detallado y profundo (aprox. 2000 a 3000 palabras simuladas en densidad).
    
    Cliente: ${clientName}
    Servicio Principal: ${serviceName}
    Contexto/Alcance Base: ${customScope}

    Genera el contenido en formato JSON siguiendo ESTRCITAMENTE esta estructura y directrices:

    1. executiveSummary (Resumen Ejecutivo):
       - Extensión: ~400 palabras.
       - Tono: Empático, estratégico, directivo.
       - Contenido: Reconoce la situación del cliente, valida su necesidad y presenta a Lagom Legal como el aliado estratégico ideal. No vendas, asesora.

    2. serviceDescription (Descripción del Servicio):
       - Extensión: ~1000 palabras (La sección más larga).
       - ENFOQUE ÚNICO: No describas tareas, describe BENEFICIOS y TRANQUILIDAD.
       - Usa un lenguaje que aborde directamente los beneficios ("Al contratar esto, usted obtiene X seguridad").
       - Estructura narrativa:
         a) El Desafío (Contexto legal del servicio).
         b) Nuestra Metodología (El "Lagom Way").
         c) Beneficios Tangibles e Intangibles (Mitigación de riesgos, continuidad operativa).
         d) Diferenciadores (Por qué nosotros).
       - NO parezcas un vendedor. Sé un consultor experto explicando la solución técnica.

    3. scope (Alcance del Servicio):
       - Extensión: ~600 palabras.
       - Formato: Lista detallada y exhaustiva de entregables.
       - Sé muy granular. No digas "Revisión de documentos", di "Análisis forense de la documentación corporativa existente con reporte de hallazgos...".

    4. nextSteps (Próximos Pasos):
       - Extensión: ~300 palabras.
       - Instrucciones claras, formales y ejecutables para iniciar el trabajo (Firma, KYC, Kick-off).

    IMPORTANTE:
    - Usa un español de negocios impecable, neutro y sofisticado (Latam/México).
    - Evita adjetivos vacíos ("increíble", "fantástico"). Usa términos sólidos ("robusto", "integral", "estratégico").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            serviceDescription: { type: Type.STRING },
            scope: { type: Type.STRING },
            nextSteps: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      // Use response.text property directly as per guidelines
      return JSON.parse(response.text) as ProposalContent;
    }
    return null;
  } catch (error) {
    console.error("Error generating proposal content:", error);
    return null;
  }
};
