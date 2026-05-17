
export type OnboardingStatus = 'pendente' | 'em_revisao' | 'concluida';

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

export type UserRole = 'admin' | 'client';

export interface ClientProgress {
  clientId: string;
  clientName: string;
  stages: OnboardingStage[];
  completionPercentage: number;
}
