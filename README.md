
# OnFlow RTM - Hub Integrador de Onboarding

O **OnFlow RTM** é a plataforma central de orquestração para ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 INTEGRAÇÃO VIA POSTMAN (TESTE DE API)

Para testar a ingestão automática de dados via ERP usando a IA (OpenRouter/NVIDIA), utilize os seguintes parâmetros:

### 1. Configuração do Request
- **Método**: `POST`
- **URL**: `http://localhost:9002/api/erp/process` (ou a URL do seu ambiente)
- **Auth**: `Bearer Token`
- **Token**: `RTM-TEST-TOKEN-2024`

### 2. Headers
- `Content-Type: application/json`
- `Authorization: Bearer RTM-TEST-TOKEN-2024`

### 3. Body (Raw JSON)
```json
{
  "subject": "[ATIVAÇÃO] SOLICITAÇÃO #2024-001 - BANCO ALPHA",
  "body": "Prezado Suporte RTM,\n\nSolicitamos a ativação do produto MENSAGERIA SWIFT para o cliente BANCO ALPHA S.A., CNPJ 12.345.678/0001-99.\n\nAtenciosamente,\nERP Comercial."
}
```

---

## 👥 PERFIS E RESPONSABILIDADES

### 🏢 Cliente Institucional
- **Acompanhamento**: Visualiza o progresso percentual da sua ativação.
- **Interação**: Envia mensagens e evidências (arquivos).

### 💼 Gestão Comercial (Admin)
- **Aprovação**: Atua como o "Gatekeeper", aprovando novos acessos.

### 🎧 Suporte Técnico (Admin)
- **Operação**: Assume atendimentos e valida as configurações de infraestrutura.

---

## 💰 CUSTOS E ESCALABILIDADE (FREE TIER FRIENDLY)
- **IA (OpenRouter + NVIDIA)**: Processamento de e-mails e automação de triagem.
- **Database & Auth (Firebase)**: Roda sobre o plano Spark (gratuito).

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
