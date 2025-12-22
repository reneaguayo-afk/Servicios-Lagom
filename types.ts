
export enum ClientType {
  INDIVIDUAL = 'Física',
  CORPORATE = 'Moral'
}

export enum CaseStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  ARCHIVED = 'Archived'
}

export enum StageStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  BLOCKED = 'Blocked'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface Contract {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Pending';
}

export interface FirmProfile {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  slogan?: string;
  calendarUrl?: string;
}

export interface LibraryDocument {
  id: string;
  title: string;
  category: string; // e.g., 'Fiscal', 'Corporativo'
  description: string;
  fileUrl: string;
  uploadDate: string;
  fileType: 'PDF' | 'DOC' | 'IMG' | 'OTHER';
  targetAudience: 'ALL' | 'SPECIFIC';
  allowedClientIds?: string[]; // If SPECIFIC, list of client IDs
}

export interface Client {
  id: string;
  name: string; // Razón Social or Name
  email: string;
  phone: string;
  additionalEmails?: string[]; // New: Multiple emails
  additionalPhones?: string[]; // New: Multiple phones
  type: ClientType;
  taxId?: string; // RFC
  address?: string; // Dirección Fiscal
  fiscalRegime?: string; // Régimen Fiscal
  legalRepresentative?: string; // Representante Legal
  accessEnabled: boolean;
  avatarUrl?: string;
  tags?: string[]; // VIP, Nuevo, etc.
  notes?: string;
  contacts?: Contact[];
  contracts?: Contract[];
  sla?: number; // Percentage 0-100
}

export interface Stage {
  id: string;
  title: string;
  description?: string;
  status: StageStatus;
  dueDate?: string;
  completedDate?: string;
  priority: Priority;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'CREATION' | 'UPDATE' | 'MEETING' | 'EMAIL' | 'CALL' | 'DOCUMENT' | 'SLA_WARNING' | 'STATUS_CHANGE' | 'DELEGATION' | 'CLOSURE' | 'ROUTINE';
  author: 'System' | 'Lawyer' | 'Client';
  attachments?: string[];
  metadata?: {
    previousStatus?: string;
    newStatus?: string;
    delegatedTo?: string;
    slaLimit?: string;
    routineIcon?: string; // To store the specific icon for routine activities
  };
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  concept: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  method?: 'Transferencia' | 'Efectivo' | 'Tarjeta' | 'Cheque';
  reference?: string;
}

export interface Case {
  id: string;
  folio: string;
  clientId: string;
  serviceName: string; // e.g., "Registro de Marca"
  specificGoal?: string; // NEW: Diferenciador del servicio
  status: CaseStatus;
  startDate: string;
  stages: Stage[];
  timeline: TimelineEvent[];
  payments: Payment[];
  totalCost: number;
  assignee?: string; // Lawyer Name
}

export interface ServiceStageTemplate {
  title: string;
  description?: string;
  defaultPriority?: Priority; // NEW
  estimatedDays?: number; // NEW: Days from start date to due date
}

export interface ServiceTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  // New AI Fields
  scope?: string;
  risks?: string[];
  prevention?: string;
  estimatedDuration?: string;
  defaultStages: ServiceStageTemplate[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'DEADLINE' | 'SLA' | 'DELEGATION' | 'REMINDER' | 'RISK' | 'AI_PREDICTION';
  priority: Priority;
  date: string;
  read: boolean;
  relatedId?: string; // Case ID or Client ID
  suggestion?: string; // AI suggestion
}

export interface RiskAnalysis {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  predictions: {
    caseId: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    suggestion: string;
  }[];
  teamLoad: {
    lawyer: string;
    load: number; // 0-100%
    status: 'OPTIMAL' | 'OVERLOAD';
  }[];
}
