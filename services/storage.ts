
import { Case, CaseStatus, Client, ClientType, Priority, StageStatus, ServiceTemplate, Stage, Payment, AppNotification, TimelineEvent, FirmProfile, LibraryDocument } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'lagom_clients',
  CASES: 'lagom_cases',
  SERVICES: 'lagom_services',
  NOTIFICATIONS: 'lagom_notifications',
  FIRM_PROFILE: 'lagom_firm_profile',
  LIBRARY: 'lagom_library',
  TAGS: 'lagom_client_tags',
  ADMIN_AUTH: 'lagom_admin_auth',
  ADMIN_PASS: 'lagom_admin_password'
};

const DEFAULT_ADMIN_PASS = 'admin123';

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
  calendarUrl: 'https://calendar.app.google/QWM14CzpgvYMd4bt8'
};

const DEFAULT_TAGS = ['CLIENTE VIP', 'MOROSO', 'NUEVO', 'RECURRENTE', 'CONFLICTIVO', 'CORPORATIVO', 'PRO BONO'];

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
    contracts: []
  }
];

export const StorageService = {
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PASS)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, DEFAULT_ADMIN_PASS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FIRM_PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.FIRM_PROFILE, JSON.stringify(DEFAULT_FIRM_PROFILE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TAGS)) {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(DEFAULT_TAGS));
    }
  },

  // Admin Auth
  getAdminPassword: (): string => localStorage.getItem(STORAGE_KEYS.ADMIN_PASS) || DEFAULT_ADMIN_PASS,
  setAdminPassword: (newPass: string) => localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, newPass),
  isAdminAuthenticated: (): boolean => localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true',
  loginAdmin: () => localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true'),
  logoutAdmin: () => localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH),

  getClients: (): Client[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'),
  saveClient: (client: Client) => {
    const clients = StorageService.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) clients[index] = client;
    else clients.push(client);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },
  deleteClient: (id: string) => {
    const clients = StorageService.getClients();
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients.filter(c => c.id !== id)));
  },

  getTags: (): string[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS) || JSON.stringify(DEFAULT_TAGS)),
  saveTags: (tags: string[]) => localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags)),

  getServices: (): ServiceTemplate[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) || '[]'),
  saveService: (service: ServiceTemplate) => {
    const services = StorageService.getServices();
    const index = services.findIndex(s => s.id === service.id);
    if (index >= 0) services[index] = service;
    else services.push(service);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  },
  deleteService: (id: string) => {
    const services = StorageService.getServices();
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services.filter(s => s.id !== id)));
  },
  
  getCases: (): Case[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]'),
  getCaseById: (id: string): Case | undefined => StorageService.getCases().find(c => c.id === id),
  getCasesByClientId: (clientId: string): Case[] => StorageService.getCases().filter(c => c.clientId === clientId),
  updateCase: (updatedCase: Case) => {
    const cases = StorageService.getCases();
    const index = cases.findIndex(c => c.id === updatedCase.id);
    if (index !== -1) {
      cases[index] = updatedCase;
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  },
  // Added deleteCase method to fix the missing property error in Cases.tsx
  deleteCase: (id: string) => {
    const cases = StorageService.getCases();
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases.filter(c => c.id !== id)));
  },
  createCase: (caseData: any) => {
    const cases = StorageService.getCases();
    const newCase = { ...caseData, id: `CASE-${Date.now()}`, timeline: [], payments: [] };
    cases.unshift(newCase);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    return newCase;
  },

  saveTimelineEvent: (caseId: string, event: any) => {
    const cases = StorageService.getCases();
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.timeline.unshift(event);
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  },

  addPayment: (caseId: string, payment: Payment) => {
    const cases = StorageService.getCases();
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.payments.push(payment);
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  },

  getFirmProfile: (): FirmProfile => JSON.parse(localStorage.getItem(STORAGE_KEYS.FIRM_PROFILE) || JSON.stringify(DEFAULT_FIRM_PROFILE)),
  saveFirmProfile: (profile: FirmProfile) => localStorage.setItem(STORAGE_KEYS.FIRM_PROFILE, JSON.stringify(profile)),

  getLibraryDocuments: (): LibraryDocument[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.LIBRARY) || '[]'),
  saveLibraryDocument: (doc: LibraryDocument) => {
    const docs = StorageService.getLibraryDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) docs[index] = doc;
    else docs.unshift(doc);
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(docs));
  },
  deleteLibraryDocument: (id: string) => {
    const docs = StorageService.getLibraryDocuments();
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(docs.filter(d => d.id !== id)));
  },

  getNotifications: (): AppNotification[] => {
    return []; // Simplificado para brevedad
  }
};
