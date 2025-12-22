import { Case, CaseStatus, Client, ClientType, Priority, StageStatus, ServiceTemplate, Stage, Payment, AppNotification, TimelineEvent, FirmProfile, LibraryDocument } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'lagom_clients',
  CASES: 'lagom_cases',
  SERVICES: 'lagom_services',
  NOTIFICATIONS: 'lagom_notifications',
  FIRM_PROFILE: 'lagom_firm_profile',
  LIBRARY: 'lagom_library',
  TAGS: 'lagom_client_tags' // New Key
};

// Helper for dynamic dates
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const DEFAULT_FIRM_PROFILE: FirmProfile = {
  name: 'Lagom Legal S.C.',
  taxId: 'LLE230101ABC',
  address: 'Av. Paseo de la Reforma 483, CDMX',
  email: 'contacto@lagom-legal.mx',
  phone: '+52 55 1234 5678',
  website: 'www.lagom-legal.mx',
  slogan: 'Just enough legal protection.',
  calendarUrl: 'https://calendar.app.google/QWM14CzpgvYMd4bt8' // Connected real calendar link
};

const DEFAULT_TAGS = ['CLIENTE VIP', 'MOROSO', 'NUEVO', 'RECURRENTE', 'CONFLICTIVO', 'CORPORATIVO', 'PRO BONO'];

// Seed Data
const MOCK_CLIENTS: Client[] = [
  {
    id: 'CLI-001-IAS-LGCO',
    name: 'Inversiones Andina SpA',
    email: 'gerencia@invandina.cl',
    phone: '+523312345678',
    type: ClientType.CORPORATE,
    accessEnabled: true,
    taxId: 'IAN123456789',
    address: 'Av. Vallarta 2440, Guadalajara, JAL',
    legalRepresentative: 'Carlos Mendoza',
    fiscalRegime: 'General de Ley Personas Morales',
    tags: ['CLIENTE VIP', 'RECURRENTE'],
    sla: 85,
    notes: 'Cliente prefiere comunicación vía WhatsApp. Requiere facturación los días 1 de cada mes.',
    contacts: [
      { name: 'Ana Sofía Lopez', role: 'Asistente Dirección', email: 'asistente@invandina.cl', phone: '+523311112222' },
      { name: 'Lic. Eduardo Ruiz', role: 'Director Jurídico', email: 'juridico@invandina.cl', phone: '+523333334444' }
    ],
    contracts: [
      { id: 'CTR-001', title: 'Contrato de Prestación de Servicios Anual', startDate: '2025-01-01', endDate: '2025-12-31', status: 'Active' },
      { id: 'CTR-002', title: 'NDA Corporativo', startDate: '2024-06-15', endDate: '2029-06-15', status: 'Active' }
    ]
  },
  {
    id: 'CLI-002-RMS-LGCO',
    name: 'Roberto Manuel Silva Pérez',
    email: 'roberto.silva@email.com',
    phone: '+523398765432',
    type: ClientType.INDIVIDUAL,
    accessEnabled: true,
    tags: ['NUEVO'],
    sla: 100,
    notes: 'Contactar solo por las tardes. Interesado en registro de marcas personales.',
    contacts: [],
    contracts: [
       { id: 'CTR-003', title: 'Acuerdo de Confidencialidad', startDate: '2025-11-01', endDate: '2026-11-01', status: 'Active' }
    ]
  },
  {
    id: 'CLI-003-TSO-LGCO',
    name: 'Tech Solutions',
    email: 'contacto@techsol.mx',
    phone: '+523311112222',
    type: ClientType.CORPORATE,
    accessEnabled: true,
    taxId: 'TEC200101XYZ',
    tags: ['CORPORATIVO'],
    sla: 85,
    notes: 'Empresa referida por Grupo Alfa. Pendiente revisión de estatutos.',
    contacts: [
       { name: 'Jorge Williams', role: 'CTO', email: 'jorge@techsol.mx', phone: '+523355556666' }
    ],
    contracts: []
  }
];

const MOCK_SERVICES: ServiceTemplate[] = [
  {
    id: 's1',
    name: 'Constitución de Sociedad',
    category: 'Derecho Corporativo',
    description: 'Creación de empresa SpA, Ltda o EIRL con inicio de actividades.',
    basePrice: 15000,
    scope: 'Redacción de estatutos, firma notarial, inscripción en registro de comercio y alta en hacienda.',
    risks: ['Demoras en registro público', 'Observaciones de forma en estatutos', 'Falta de documentos de socios extranjeros'],
    prevention: 'Verificar vigencia de documentos de identidad y poderes antes de la firma.',
    estimatedDuration: '3 semanas',
    defaultStages: [
      { title: 'Recepción de Antecedentes', description: 'Recopilación y validación de documentos legales e información.', estimatedDays: 2, defaultPriority: Priority.MEDIUM },
      { title: 'Redacción de Estatutos', description: 'Elaboración del borrador de la constitución.', estimatedDays: 5, defaultPriority: Priority.HIGH },
      { title: 'Firma ante Notario', description: 'Coordinación y firma de escritura pública.', estimatedDays: 8, defaultPriority: Priority.HIGH },
      { title: 'Inscripción en Registro', description: 'Inscripción en el Registro de Comercio.', estimatedDays: 12, defaultPriority: Priority.MEDIUM },
      { title: 'Inicio de Actividades', description: 'Trámite ante el Servicio de Impuestos Internos.', estimatedDays: 15, defaultPriority: Priority.MEDIUM }
    ]
  },
  {
    id: 's2',
    name: 'Defensa Corporativa',
    category: 'Derecho Laboral',
    description: 'Representación legal en litigios civiles o laborales.',
    basePrice: 25000,
    scope: 'Defensa integral desde la contestación de demanda hasta sentencia de primera instancia.',
    risks: ['Sentencia desfavorable', 'Dilación excesiva del tribunal', 'Falta de pruebas documentales'],
    prevention: 'Mantener expedientes laborales de empleados actualizados y firmados.',
    estimatedDuration: '6-12 meses',
    defaultStages: [
      { title: 'Análisis del Caso', description: 'Revisión de antecedentes y estrategia.', estimatedDays: 3, defaultPriority: Priority.HIGH },
      { title: 'Contestación de Demanda', description: 'Redacción y presentación de defensa.', estimatedDays: 8, defaultPriority: Priority.HIGH },
      { title: 'Audiencia Preparatoria', description: 'Asistencia legal en audiencia preliminar.', estimatedDays: 20, defaultPriority: Priority.MEDIUM },
      { title: 'Audiencia de Juicio', description: 'Defensa en juicio oral.', estimatedDays: 60, defaultPriority: Priority.HIGH },
      { title: 'Sentencia y Recursos', description: 'Seguimiento de resolución final.', estimatedDays: 90, defaultPriority: Priority.MEDIUM }
    ]
  },
  {
    id: 's3',
    name: 'Registro de Marca',
    category: 'Propiedad Intelectual',
    description: 'Proceso de inscripción ante INAPI/IMPI.',
    basePrice: 8500,
    scope: 'Búsqueda de anterioridades, solicitud, contestación de oficios y obtención de título.',
    risks: ['Oposición de terceros', 'Negativa por falta de distintividad', 'Abandono por falta de pago'],
    prevention: 'Realizar búsqueda fonética exhaustiva antes de iniciar solicitud.',
    estimatedDuration: '4-6 meses',
    defaultStages: [
      { title: 'Búsqueda de Factibilidad', description: 'Análisis de marcas similares registradas.', estimatedDays: 2, defaultPriority: Priority.MEDIUM },
      { title: 'Solicitud de Registro', description: 'Ingreso del formulario oficial.', estimatedDays: 5, defaultPriority: Priority.HIGH },
      { title: 'Publicación Diario Oficial', description: 'Pago y gestión de publicación.', estimatedDays: 20, defaultPriority: Priority.LOW },
      { title: 'Examen de Fondo', description: 'Respuesta a observaciones de la autoridad.', estimatedDays: 60, defaultPriority: Priority.MEDIUM },
      { title: 'Entrega de Título', description: 'Recepción del certificado de registro.', estimatedDays: 120, defaultPriority: Priority.LOW }
    ]
  }
];

const MOCK_LIBRARY: LibraryDocument[] = [
    {
        id: 'LIB-001',
        title: 'Reforma Fiscal 2025: Resumen Ejecutivo',
        category: 'Derecho Fiscal',
        description: 'Análisis de los principales cambios en materia de IVA e ISR para personas morales.',
        fileUrl: '#',
        fileType: 'PDF',
        uploadDate: daysFromNow(-5),
        targetAudience: 'ALL'
    },
    {
        id: 'LIB-002',
        title: 'Guía de Cumplimiento Laboral',
        category: 'Derecho Laboral',
        description: 'Checklist para auditorías internas de la Secretaría del Trabajo.',
        fileUrl: '#',
        fileType: 'PDF',
        uploadDate: daysFromNow(-20),
        targetAudience: 'ALL'
    },
    {
        id: 'LIB-003',
        title: 'Estrategia de Propiedad Intelectual 2025',
        category: 'Propiedad Intelectual',
        description: 'Documento confidencial sobre la estrategia de marcas para el próximo año.',
        fileUrl: '#',
        fileType: 'DOC',
        uploadDate: daysFromNow(-2),
        targetAudience: 'SPECIFIC',
        allowedClientIds: ['CLI-001-IAS-LGCO']
    }
];

const MOCK_CASES: Case[] = [
  {
    id: 'case1',
    folio: 'CLI-001-IAS-CONST',
    clientId: 'CLI-001-IAS-LGCO',
    serviceName: 'Constitución de Sociedad',
    specificGoal: 'Constitución de holding de inversiones para expansión LATAM.',
    status: CaseStatus.ACTIVE,
    startDate: daysFromNow(-10),
    totalCost: 15000,
    assignee: 'Lic. Ruiz',
    stages: [
      { id: 'st-c1-1', title: 'Recepción de Antecedentes', status: StageStatus.COMPLETED, priority: Priority.MEDIUM, completedDate: daysFromNow(-5) },
      { id: 'st-c1-2', title: 'Redacción de Estatutos', status: StageStatus.IN_PROGRESS, priority: Priority.HIGH, dueDate: daysFromNow(1) },
      { id: 'st-c1-3', title: 'Firma ante Notario', status: StageStatus.PENDING, priority: Priority.MEDIUM, dueDate: daysFromNow(5) }
    ],
    timeline: [
        {
          id: 'tl-1',
          date: daysFromNow(-10),
          title: 'Servicio Creado',
          description: 'Se ha dado de alta el expediente y asignado el folio CLI-001-IAS-CONST.',
          type: 'CREATION',
          author: 'System',
          metadata: { slaLimit: '21 días' }
        },
        {
          id: 'tl-2',
          date: daysFromNow(-8),
          title: 'Documentos Recibidos',
          description: 'El cliente ha enviado la documentación constitutiva completa.',
          type: 'DOCUMENT',
          author: 'Client',
          attachments: ['acta_previa.pdf', 'identificaciones.zip']
        }
    ],
    payments: [
      { 
        id: 'p1', 
        amount: 7500, 
        date: daysFromNow(-9), 
        concept: 'Anticipo 50%', 
        status: 'Paid',
        method: 'Transferencia',
        reference: 'SPEI-998877'
      }
    ]
  },
  {
    id: 'case2',
    folio: 'CLI-002-RMS-DEF1',
    clientId: 'CLI-002-RMS-LGCO', 
    serviceName: 'Defensa Corporativa',
    status: CaseStatus.ACTIVE,
    startDate: daysFromNow(-20),
    totalCost: 25000,
    assignee: 'Lic. Vega',
    stages: [
      { id: 'st-c2-1', title: 'Análisis del Caso', status: StageStatus.IN_PROGRESS, priority: Priority.HIGH, dueDate: daysFromNow(-2) }, // OVERDUE
      { id: 'st-c2-2', title: 'Contestación de Demanda', status: StageStatus.PENDING, priority: Priority.HIGH, dueDate: daysFromNow(3) }
    ],
    timeline: [
       {
          id: 'tl-4',
          date: daysFromNow(0),
          title: 'Alerta SLA',
          description: 'El tiempo de respuesta inicial ha superado el límite de 24 horas.',
          type: 'SLA_WARNING',
          author: 'System',
          metadata: { slaLimit: '24h' }
        }
    ],
    payments: []
  },
  {
    id: 'case3',
    folio: 'CLI-003-TSO-AUD1',
    clientId: 'CLI-003-TSO-LGCO', 
    serviceName: 'Auditoría Legal',
    status: CaseStatus.ACTIVE,
    startDate: daysFromNow(-8),
    totalCost: 12000,
    assignee: 'Lic. Ruiz',
    stages: [
      { id: 'st-c3-1', title: 'Recopilación', status: StageStatus.IN_PROGRESS, priority: Priority.LOW, dueDate: daysFromNow(0) } // DUE TODAY
    ],
    timeline: [], // No timeline = Inactive
    payments: []
  }
];

export const StorageService = {
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(MOCK_SERVICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CASES)) {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(MOCK_CASES));
    }
    
    // Firm Profile logic with forced update for new calendar URL
    const existingProfile = localStorage.getItem(STORAGE_KEYS.FIRM_PROFILE);
    if (!existingProfile) {
      localStorage.setItem(STORAGE_KEYS.FIRM_PROFILE, JSON.stringify(DEFAULT_FIRM_PROFILE));
    } else {
      // Force update the calendar URL if it exists but might be old (for demo purposes)
      const parsedProfile = JSON.parse(existingProfile);
      parsedProfile.calendarUrl = DEFAULT_FIRM_PROFILE.calendarUrl;
      localStorage.setItem(STORAGE_KEYS.FIRM_PROFILE, JSON.stringify(parsedProfile));
    }

    if (!localStorage.getItem(STORAGE_KEYS.LIBRARY)) {
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(MOCK_LIBRARY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TAGS)) {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(DEFAULT_TAGS));
    }
  },

  getClients: (): Client[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'),
  
  saveClient: (client: Client) => {
    const clients = StorageService.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  deleteClient: (id: string) => {
    const clients = StorageService.getClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
  },

  // Tags Management
  getTags: (): string[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS) || JSON.stringify(DEFAULT_TAGS)),

  saveTags: (tags: string[]) => {
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  },

  getServices: (): ServiceTemplate[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) || '[]'),

  saveService: (service: ServiceTemplate) => {
    const services = StorageService.getServices();
    const index = services.findIndex(s => s.id === service.id);
    if (index >= 0) {
      services[index] = service;
    } else {
      services.push(service);
    }
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  },

  deleteService: (id: string) => {
    const services = StorageService.getServices();
    const filtered = services.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(filtered));
  },
  
  getCases: (): Case[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]'),
  
  getCaseById: (id: string): Case | undefined => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    return cases.find((c: Case) => c.id === id);
  },

  getCasesByClientId: (clientId: string): Case[] => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    return cases.filter((c: Case) => c.clientId === clientId);
  },

  deleteCase: (id: string) => {
     const cases = StorageService.getCases();
     const filtered = cases.filter(c => c.id !== id);
     localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(filtered));
  },

  getFirmProfile: (): FirmProfile => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FIRM_PROFILE) || JSON.stringify(DEFAULT_FIRM_PROFILE));
  },

  saveFirmProfile: (profile: FirmProfile) => {
    localStorage.setItem(STORAGE_KEYS.FIRM_PROFILE, JSON.stringify(profile));
  },

  // Library Methods
  getLibraryDocuments: (): LibraryDocument[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.LIBRARY) || '[]'),

  saveLibraryDocument: (doc: LibraryDocument) => {
    const docs = StorageService.getLibraryDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc); // Add to top
    }
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(docs));
  },

  deleteLibraryDocument: (id: string) => {
    const docs = StorageService.getLibraryDocuments();
    const filtered = docs.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(filtered));
  },

  // Create Case (Workflow 1)
  createCase: (caseData: Omit<Case, 'id' | 'timeline' | 'payments' | 'stages'> & { stages?: Stage[] }) => {
    const cases = StorageService.getCases();
    const id = `CASE-${Date.now()}`;
    
    // Auto-generate Timeline Creation Event
    const creationEvent: TimelineEvent = {
        id: `TL-${Date.now()}`,
        date: new Date().toISOString(),
        title: 'Servicio Creado',
        description: `Se ha iniciado el expediente con folio ${caseData.folio}.`,
        type: 'CREATION',
        author: 'System',
        metadata: { slaLimit: 'Standard' }
    };

    const newCase: Case = {
        ...caseData,
        id,
        timeline: [creationEvent],
        payments: [],
        stages: caseData.stages || []
    };

    cases.unshift(newCase);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    return newCase;
  },

  updateCase: (updatedCase: Case) => {
    const cases = StorageService.getCases();
    const index = cases.findIndex(c => c.id === updatedCase.id);
    if (index !== -1) {
      cases[index] = updatedCase;
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  },

  addPayment: (caseId: string, payment: Payment) => {
    const cases = StorageService.getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
      cases[caseIndex].payments.push(payment);
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  },

  saveTimelineEvent: (caseId: string, event: any) => {
    const cases = StorageService.getCases();
    const caseItem = cases.find(c => c.id === caseId);
    if (caseItem) {
      caseItem.timeline.unshift(event);
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  },

  // Enhanced Smart Notification System with 3 Business Rules
  getNotifications: (): AppNotification[] => {
    const notifications: AppNotification[] = [];
    const cases = StorageService.getCases();
    const clients = StorageService.getClients();
    const today = new Date();
    today.setHours(0,0,0,0);

    cases.forEach(c => {
      // RULE 1: Inactivity > 5 days (Customizable X days)
      if (c.status === CaseStatus.ACTIVE) {
        const lastActivity = c.timeline.length > 0 ? new Date(c.timeline[0].date) : new Date(c.startDate);
        const daysInactive = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysInactive > 5) {
          notifications.push({
            id: `notif-inactive-${c.id}`,
            title: 'Alerta de Inactividad',
            message: `El caso ${c.folio} lleva ${daysInactive} días sin actualizaciones.`,
            type: 'RISK',
            priority: Priority.MEDIUM,
            date: new Date().toISOString(),
            read: false,
            relatedId: c.id
          });
        }
      }

      c.stages.forEach(s => {
        // RULE 2: Urgent Activity Stagnant > 24h
        if (s.status === StageStatus.IN_PROGRESS && s.priority === Priority.HIGH) {
             const lastUpdate = c.timeline.length > 0 ? new Date(c.timeline[0].date) : new Date(c.startDate);
             const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
             
             if (hoursSinceUpdate > 24) {
                notifications.push({
                   id: `notif-urgent-stag-${s.id}`,
                   title: 'Urgencia Estancada',
                   message: `La actividad prioritaria "${s.title}" no se ha actualizado en más de 24h.`,
                   type: 'SLA',
                   priority: Priority.HIGH,
                   date: new Date().toISOString(),
                   read: false,
                   relatedId: c.id
                });
             }
        }

        if (s.status === StageStatus.IN_PROGRESS && s.dueDate) {
          const dueDate = new Date(s.dueDate);
          dueDate.setHours(0,0,0,0);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
             notifications.push({
              id: `notif-ovr-${s.id}`,
              title: 'Tarea Vencida',
              message: `La etapa "${s.title}" venció hace ${Math.abs(diffDays)} días.`,
              type: 'DEADLINE',
              priority: Priority.HIGH,
              date: new Date().toISOString(),
              read: false,
              relatedId: c.id
            });
          }
        }
      });
    });

    // RULE 4: Client SLA Critical
    clients.forEach(client => {
      if ((client.sla || 100) < 90) {
        notifications.push({
          id: `notif-sla-${client.id}`,
          title: 'SLA Crítico',
          message: `El SLA de ${client.name} está en riesgo (${client.sla}%).`,
          type: 'SLA',
          priority: Priority.HIGH,
          date: new Date().toISOString(),
          read: false,
          relatedId: client.id
        });
      }
    });

    return notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};