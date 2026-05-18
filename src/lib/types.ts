
export type OnboardingStatus = 'pendente' | 'em_revisao' | 'concluida';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'client';
export type AdminType = 'suporte' | 'comercial';
export type ResponsibleRole = 'suporte' | 'comercial' | 'cliente' | 'infraestrutura' | 'compliance';
export type StepType = 'upload' | 'form';

export interface UserProfile {
  id?: string;
  email: string;
  role: UserRole;
  adminType?: AdminType;
  displayName: string;
  institutionName?: string;
  cnpj?: string;
  status: UserStatus;
  clientCode?: string;
  activeProduct?: string;
  createdAt: string;
  approvedAt?: string;
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

export interface OnboardingStage {
  id: string;
  title: string;
  description: string;
  order: number;
  status: OnboardingStatus;
  requirements?: {
    type: 'file' | 'text';
    label: string;
    description?: string;
  }[];
  submittedEvidence?: {
    type: 'file' | 'text';
    value: string;
    submittedAt: string;
  }[];
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  stages: OnboardingStage[];
  completionPercentage: number;
}
