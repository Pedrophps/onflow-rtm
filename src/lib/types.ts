
export type OnboardingStatus = 'pendente' | 'em_revisao' | 'concluida';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'client';
export type AdminType = 'suporte' | 'comercial' | 'coordenador_suporte';
export type ResponsibleRole = 'suporte' | 'comercial' | 'cliente' | 'infraestrutura' | 'compliance';
export type StepType = 'upload' | 'form';
export type InstanceStatus = 'pending' | 'active' | 'completed' | 'blocked';

export interface UserProfile {
  id?: string;
  email: string;
  role: UserRole;
  adminType?: AdminType;
  status: UserStatus;
  displayName: string;
  institutionName?: string;
  cnpj?: string;
  clientCode?: string;
  activeProduct?: string;
  phoneNumber?: string;
  consultantName?: string;
  orderValue?: string;
  commercialNotes?: string;
  createdAt: string;
  approvedAt?: string;
  updatedAt?: any;
}

export interface OnCallSchedule {
  id?: string;
  userId: string;
  userName: string;
  startAt: string;
  endAt: string;
  status: 'scheduled' | 'active' | 'cancelled';
  observations?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: any;
}

export interface OnCallCheckin {
  id?: string;
  scheduleId: string;
  userId: string;
  confirmedAt: string;
  status: 'confirmed' | 'pending';
}

export interface OnCallNotification {
  id?: string;
  scheduleId: string;
  userId: string;
  requestedBy: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'sent' | 'received' | 'started' | 'finished';
  sentAt: string;
  receivedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  finishNotes?: string;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  published: boolean;
  createdAt: string;
  updatedAt: any;
  createdBy: string;
  visibility: {
    suporte: boolean;
    comercial: boolean;
  };
}

export interface ActivationFlow {
  id?: string;
  productId: string;
  name: string;
  description: string;
  active: boolean;
  published: boolean;
  status: 'active' | 'draft';
  version: number;
  createdAt: string;
  updatedAt: any;
  createdBy: string;
}

export interface FlowStep {
  id?: string;
  order: number;
  name: string;
  description: string;
  responsible: ResponsibleRole;
  estimatedTimeInHours: number;
  required: boolean;
  type: StepType;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: any;
}

export interface OnboardingInstance {
  id?: string;
  clientId: string;
  productId: string;
  flowId?: string;
  techId?: string;
  techName?: string;
  status: InstanceStatus;
  currentStepOrder: number;
  startedAt: string;
  updatedAt: any;
  institutionName?: string;
  productName?: string;
}

export interface StepInteraction {
  id?: string;
  instanceId: string;
  stepId: string;
  clientId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: any;
}
