
# OnFlow RTM - Hub de Onboarding Institucional

## Visão Geral
O **OnFlow** é a plataforma oficial da RTM para gestão de onboarding de instituições financeiras no mercado brasileiro. Ele automatiza a coleta de evidências, aprovação de contratos e ativação de serviços críticos (RSFN, SWIFT, PIX, etc).

## Arquitetura Técnica
- **Framework**: Next.js 15 (App Router)
- **Database**: Cloud Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Estilização**: Tailwind CSS + ShadCN UI
- **AI**: Google Genkit (Gemini 2.5 Flash) para análise de conformidade.

## Modelagem de Dados (Firestore)
- **Coleção `/users`**: 
  - `role`: 'admin' (Equipe RTM) ou 'client' (Instituição).
  - `adminType`: 'comercial' (foco em aprovação/vendas) ou 'suporte' (foco técnico).
  - `status`: 'pending' (bloqueia acesso total do cliente até aprovação RTM).

## Fluxo de Autenticação e Autorização
1. Usuário se cadastra/loga.
2. Se for admin sem `adminType`, é forçado para `/dashboard/admin/select-profile`.
3. Se for cliente sem `status: approved`, visualiza tela de bloqueio com progresso de análise.

## Diretrizes de Desenvolvimento
- Todas as mutações do Firestore devem usar o `errorEmitter` para capturar falhas de Security Rules.
- Evitar `await` em mutações simples para manter a fluidez da UI (Optimistic UI), exceto em transições críticas de perfil.
