import { jsPDF } from 'jspdf';
import { Payment, Case, ServiceTemplate, FirmProfile } from '../types';
import { ProposalContent } from './geminiService';

export const generateReceipt = (payment: Payment, caseData: Case, clientName: string) => {
  const doc = new jsPDF({ format: 'letter' });
  
  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(194, 172, 21); // Lagom Gold
  doc.text('LAGOM LEGAL', 108, 20, { align: 'center' }); // ~Center of Letter (216mm / 2)
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Servicios Jurídicos Premium', 108, 26, { align: 'center' });

  // Line
  doc.setDrawColor(200);
  doc.line(20, 35, 196, 35);

  // Receipt Details
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('RECIBO DE PAGO', 20, 50);

  doc.setFontSize(11);
  doc.setTextColor(80);
  
  let y = 65;
  const addLine = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
    y += 10;
  };

  addLine('Folio de Recibo:', `REC-${payment.id.toUpperCase()}`);
  addLine('Fecha:', new Date(payment.date).toLocaleDateString());
  addLine('Cliente:', clientName);
  addLine('Expediente:', caseData.folio);
  addLine('Servicio:', caseData.serviceName);
  addLine('Concepto:', payment.concept);
  
  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y, 176, 20, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(`Monto Total:`, 30, y + 13);
  doc.text(`$${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 185, y + 13, { align: 'right' });

  // Footer
  y += 50;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Este documento es un comprobante interno de pago.', 108, y, { align: 'center' });
  doc.text('Lagom Legal S.C. | lagom-legal.mx', 108, y + 5, { align: 'center' });

  doc.save(`Recibo_${payment.id}.pdf`);
};

interface ProposalConfig {
  clientName: string;
  customScope: string;
  discount: number;
  retainer: number;
  validUntil: string;
  price: number;
}

const TERMS_AND_CONDITIONS = `
1. CONFIDENCIALIDAD
Toda la información contenida en esta propuesta, así como cualquier información, documento o estrategia intercambiada entre las partes durante la prestación del servicio, será tratada con estricta confidencialidad. Lagom Legal S.C. se compromete a no divulgar dicha información a terceros sin el consentimiento previo y por escrito del CLIENTE, salvo requerimiento de autoridad competente.

2. VIGENCIA DE LA PROPUESTA
La presente propuesta económica y los términos aquí descritos tienen una validez de 15 días naturales a partir de su fecha de emisión. Transcurrido este plazo, Lagom Legal S.C. se reserva el derecho de ajustar los honorarios y condiciones conforme a la disponibilidad y tarifas vigentes.

3. HONORARIOS Y GASTOS
Los honorarios profesionales descritos en la sección "Precios" no incluyen el Impuesto al Valor Agregado (IVA), el cual será desglosado en la factura correspondiente. Asimismo, no incluyen gastos notariales, derechos de registro, impuestos gubernamentales, viáticos fuera del área metropolitana, ni costos de traducciones o peritajes, los cuales serán cubiertos por el CLIENTE previo aviso y aprobación.

4. PROPIEDAD INTELECTUAL
Lagom Legal S.C. conserva todos los derechos de propiedad intelectual sobre los modelos, formatos, estrategias legales y documentos preliminares desarrollados para la prestación del servicio, otorgando al CLIENTE una licencia de uso exclusivo para los fines descritos en el Alcance del Servicio una vez liquidados los honorarios.

5. RESPONSABILIDAD PROFESIONAL
Nuestros servicios constituyen obligaciones de medio y no de resultado, comprometiéndonos a aplicar nuestro mejor saber y entender, experiencia técnica y diligencia profesional en la defensa de los intereses del CLIENTE.

6. JURISDICCIÓN
Para la interpretación y cumplimiento de los servicios derivados de esta propuesta, las partes se someten expresamente a las leyes y tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.
`;

export const generateProposalPDF = (
  service: ServiceTemplate,
  config: ProposalConfig,
  firm: FirmProfile,
  aiContent?: ProposalContent | null
) => {
  // SET FORMAT TO LETTER (Tamaño Carta)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 215.9 x 279.4 mm
  });

  const margin = 25; // Slightly larger margin for "Carta" style elegance
  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Helper Header
  const addHeader = () => {
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(194, 172, 21); // Gold
    doc.text(firm.name.toUpperCase(), pageWidth - margin, 15, { align: 'right' });
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, 18, pageWidth - margin, 18);
    y = 35; // Reset Y below header
  };

  // Helper Footer with Page Number
  const addFooter = (pageNumber: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${firm.website} | ${firm.email}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  };

  // Helper to check page break
  let pageCount = 1;
  const checkPageBreak = (heightNeeded: number) => {
    if (y + heightNeeded > (pageHeight - 25)) { // 25mm bottom margin
      addFooter(pageCount);
      doc.addPage();
      pageCount++;
      addHeader();
    }
  };

  // Helper to force new page
  const forceNewPage = () => {
      addFooter(pageCount);
      doc.addPage();
      pageCount++;
      addHeader();
  };

  // --- PAGE 1: COVER ---
  // No standard header on cover
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(194, 172, 21); // Gold
  doc.text(firm.name.toUpperCase(), pageWidth / 2, 40, { align: 'center' });

  // Decorative line
  doc.setDrawColor(194, 172, 21);
  doc.setLineWidth(1);
  doc.line(pageWidth/2 - 20, 45, pageWidth/2 + 20, 45);

  doc.setFontSize(36);
  doc.setTextColor(30);
  doc.text('PROPUESTA DE', pageWidth / 2, 100, { align: 'center' });
  doc.text('SERVICIOS', pageWidth / 2, 115, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(service.name.toUpperCase(), pageWidth / 2, 135, { align: 'center' });

  // Client Info Box
  doc.setDrawColor(230);
  doc.setFillColor(252, 252, 252);
  doc.rect(50, 160, pageWidth - 100, 45, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('PREPARADO EXCLUSIVAMENTE PARA:', pageWidth / 2, 170, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.setTextColor(0);
  doc.text(config.clientName, pageWidth / 2, 180, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(new Date().toLocaleDateString('es-ES', {year: 'numeric', month: 'long', day: 'numeric'}), pageWidth / 2, 195, { align: 'center' });

  // Cover Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(firm.address, pageWidth / 2, 250, { align: 'center' });
  
  // --- CONTENT PAGES ---
  
  const addSectionTitle = (title: string, number: string) => {
    checkPageBreak(25);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`${number}. ${title.toUpperCase()}`, margin, y);
    y += 8;
    doc.setDrawColor(194, 172, 21); // Gold
    doc.setLineWidth(0.5);
    doc.line(margin, y - 2, margin + 20, y - 2); // Short underline for elegance
    y += 8;
  };

  const addBodyText = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10); // Standard letter size font
    doc.setTextColor(60);
    
    // Split text into paragraphs by newline
    const paragraphs = text.split('\n');
    
    paragraphs.forEach(para => {
        if (!para.trim()) return;
        
        const splitText = doc.splitTextToSize(para, contentWidth);
        const height = splitText.length * 5; // Approx 5mm per line (loose spacing)
        
        checkPageBreak(height + 5);
        doc.text(splitText, margin, y);
        y += height + 4; // spacing between paragraphs
    });
  };

  // --- PAGE 2: 1) RESUMEN EJECUTIVO ---
  doc.addPage();
  pageCount++;
  addHeader();
  
  addSectionTitle('Resumen Ejecutivo', '1');
  addBodyText(aiContent?.executiveSummary || "Agradecemos la oportunidad de presentar esta propuesta. Entendemos la importancia de este asunto para su negocio.");

  // --- PAGE 3: 2) DESCRIPCIÓN DEL SERVICIO ---
  forceNewPage();
  addSectionTitle('Descripción del Servicio', '2');
  addBodyText(aiContent?.serviceDescription || service.description);

  // --- PAGE 4: 3) ALCANCE DEL SERVICIO ---
  forceNewPage();
  addSectionTitle('Alcance del Servicio', '3');
  addBodyText(aiContent?.scope || config.customScope || service.scope || 'Según descripción estándar.');
  
  if (!aiContent && service.defaultStages) {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Actividades Principales:', margin, y);
      y += 6;
      service.defaultStages.forEach(stage => {
          const stageText = `• ${stage.title}: ${stage.description || ''}`;
          const splitStage = doc.splitTextToSize(stageText, contentWidth);
          checkPageBreak(splitStage.length * 5 + 2);
          doc.setFont('helvetica', 'normal');
          doc.text(splitStage, margin, y);
          y += splitStage.length * 5 + 2;
      });
  }

  // --- PAGE 5: 4) PRECIOS ---
  forceNewPage();
  addSectionTitle('Precios e Inversión', '4');
  
  // -- PRICING TABLE --
  const tableTop = y;
  const col1Width = contentWidth * 0.7;
  const col2Width = contentWidth * 0.3;
  const rowHeight = 10;

  // Table Header
  doc.setFillColor(240, 240, 240); // Very light gray
  doc.rect(margin, y, contentWidth, rowHeight, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Concepto', margin + 5, y + 7);
  doc.text('Inversión', pageWidth - margin - 5, y + 7, { align: 'right' });
  y += rowHeight;

  // Item 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(service.name, margin + 5, y + 7);
  doc.text(`$${service.basePrice.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, pageWidth - margin - 5, y + 7, { align: 'right' });
  
  // Bottom border of item
  doc.setDrawColor(230);
  doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
  y += rowHeight;

  // Discount (if any)
  let finalPrice = service.basePrice;
  if (config.discount > 0) {
      const discountAmount = service.basePrice * (config.discount / 100);
      finalPrice -= discountAmount;
      
      doc.setTextColor(194, 172, 21); // Gold for discount
      doc.text(`Descuento Preferencial (${config.discount}%)`, margin + 5, y + 7);
      doc.text(`-$${discountAmount.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, pageWidth - margin - 5, y + 7, { align: 'right' });
      doc.setDrawColor(230);
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
      y += rowHeight;
  }

  // Total Row
  y += 5; // spacing
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('TOTAL HONORARIOS (MXN)', margin + 5, y + 7);
  doc.text(`$${finalPrice.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, pageWidth - margin - 5, y + 7, { align: 'right' });
  y += 15;

  // Terms Box
  doc.setDrawColor(194, 172, 21); // Gold Border
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 35);
  
  const boxY = y + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Condiciones Comerciales:', margin + 5, boxY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  
  const termsList = [
      `Forma de Pago: Anticipo del ${config.retainer}% a la firma de la propuesta y saldo contra entrega/avance.`,
      `Los precios mostrados son en Moneda Nacional y no incluyen IVA.`,
      `Vigencia de la propuesta: Válida hasta el ${new Date(config.validUntil).toLocaleDateString()}.`
  ];

  let termY = boxY + 6;
  termsList.forEach(term => {
      doc.text(`• ${term}`, margin + 5, termY);
      termY += 5;
  });
  
  y += 45; // Move past box

  // --- PAGE 5 (Cont.): 5) PRÓXIMOS PASOS ---
  addSectionTitle('Próximos Pasos', '5');
  addBodyText(aiContent?.nextSteps || "Para proceder, favor de firmar la presente propuesta y realizar el pago del anticipo correspondiente. Una vez recibido, coordinaremos la reunión de inicio.");

  // Signatures Area
  checkPageBreak(50);
  y += 25; 
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  
  // Firm Signature
  doc.line(margin, y, margin + 70, y);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.setTextColor(0);
  doc.text(firm.name, margin + 35, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('Firma Autorizada', margin + 35, y + 9, { align: 'center' });

  // Client Signature
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  doc.setTextColor(0);
  doc.setFont('times', 'bold');
  doc.text(config.clientName, pageWidth - margin - 35, y + 5, { align: 'center' });
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text('Aceptación del Cliente', pageWidth - margin - 35, y + 9, { align: 'center' });

  // --- PAGE 6: TÉRMINOS Y CONDICIONES (NEW) ---
  forceNewPage();
  addSectionTitle('Términos y Condiciones Generales', '6');
  
  // Render T&C slightly smaller
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  
  const splitTerms = doc.splitTextToSize(TERMS_AND_CONDITIONS.trim(), contentWidth);
  doc.text(splitTerms, margin, y);

  // Add footer to last page
  addFooter(pageCount);

  // Save
  const fileName = `Propuesta_${service.name.substring(0,10)}_${config.clientName.substring(0,5)}.pdf`;
  doc.save(fileName);
};