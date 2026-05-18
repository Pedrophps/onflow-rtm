
# OnFlow RTM - Hub Integrador de Onboarding

O **OnFlow RTM** é a plataforma central de orquestração para ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 COMO TESTAR VIA POSTMAN (IMPORTANTE)

Como este projeto está rodando em um ambiente de nuvem, o endereço `localhost` ou `127.0.0.1` **não funcionará** no seu Postman local.

### 1. Obtenha a URL Pública
1. Olhe para a aba lateral ou superior onde o **Web Preview** do seu aplicativo está aberto.
2. A URL que você vê na barra de endereços do navegador (ex: `https://9002-port-xxxxxxxx.googleusercontent.com`) é o seu endpoint.
3. Copie essa URL completa até o `.com`.

### 2. Configuração no Postman
- **Método**: `POST`
- **URL**: `https://SUA-URL-BASE/api/erp/process`
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
