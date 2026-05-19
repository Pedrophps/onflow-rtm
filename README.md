
# OnFlow RTM - Hub Integrador de Onboarding

Plataforma de alta precisão para orquestração e ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 GUIA DE INTEGRAÇÃO TÉCNICA (POWER AUTOMATE / POSTMAN)

Para validar a ingestão automática via IA, utilize o endpoint público abaixo.

### 1. Endpoint de Produção
`https://6000-firebase-studio-1779040400544.cluster-xvr5pmatm5a4gx76fmat6kxt6o.cloudworkstations.dev/api/erp/process`

### 2. Configuração de Autenticação
- **Type**: `No Auth` (Rota simplificada para desenvolvimento)

### 3. Payload de Exemplo (JSON)
```json
{
  "subject": "[ATIVAÇÃO CRÍTICA] SOLICITAÇÃO #2024-999 - BANCO OMEGA",
  "body": "Prezada equipe RTM,\n\nConfirmamos a venda do produto MENSAGERIA SWIFT para o cliente BANCO OMEGA S.A., inscrito no CNPJ 99.888.777/0001-11.\n\nFavor priorizar devido ao prazo regulatório.\n\nAtt,\nDiretoria Comercial RTM."
}
```

---

## 🏗️ ARQUITETURA E STACK
- **Engine de IA**: Genkit + Google Gemini (NVIDIA Nemotron Reasoning).
- **Backend**: Firebase Firestore (NoSQL) + Auth.
- **Frontend**: Next.js 15 (Turbopack) + ShadCN UI + Tailwind CSS.
- **Porta Operacional**: 6000 (Obrigatório para este ambiente).

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
