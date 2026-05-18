
# OnFlow RTM - Hub Integrador de Onboarding

O **OnFlow RTM** é a plataforma central de orquestração para ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 INTEGRAÇÃO VIA POSTMAN (IMPORTANTE)

Como este projeto está rodando em um ambiente de nuvem, você **não pode** usar `localhost` no seu Postman local.

### 1. Como obter a URL correta
1. No painel do seu editor, procure pelo ícone de **Preview** ou abra a URL que o sistema gerou para visualizar o app.
2. A URL será algo como `https://9002-port-xxxxxxxx.googleusercontent.com`.
3. Use esta URL base para suas chamadas de API.

### 2. Configuração do Request no Postman
- **Método**: `POST`
- **URL**: `https://SUA-URL-GERADA/api/erp/process`
- **Auth**: `Bearer Token`
- **Token**: `RTM-TEST-TOKEN-2024`

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
