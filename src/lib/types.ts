
export type OnboardingStatus = 'pendente' | 'em_revisao' | 'concluida';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'client';
export type AdminType = 'suporte' | 'comercial';

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
