
# OnFlow RTM - Hub Integrador de Onboarding

O **OnFlow RTM** é a plataforma central de orquestração para ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 COMO TESTAR VIA POSTMAN (IMPORTANTE)

Como este projeto está rodando em um ambiente de nuvem, você deve usar a URL pública do seu workspace.

### 1. Sua URL de Teste
Baseado no seu ambiente, sua rota de API é:
`https://6000-firebase-studio-1779040400544.cluster-xvr5pmatm5a4gx76fmat6kxt6o.cloudworkstations.dev/api/erp/process`

### 2. Configuração no Postman
- **Método**: `POST`
- **URL**: A URL acima.
- **Auth**: Selecione a aba `Auth`, escolha `Bearer Token`.
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

## 💰 CUSTOS E ESCALABILIDADE
- **IA (OpenRouter + NVIDIA)**: Processamento de e-mails e automação de triagem.
- **Database & Auth (Firebase)**: Roda sobre o plano Spark (gratuito).

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
