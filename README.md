
# OnFlow RTM - Hub Integrador de Onboarding

Plataforma de alta precisão para orquestração e ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 GUIA DE INTEGRAÇÃO (API DIRETA)

O OnFlow possui um endpoint de ingestão estruturada que deve ser chamado pelo seu ERP ou via Power Automate.

### Endpoint de Ingestão (POST)
`https://6000-firebase-studio-1779040400544.cluster-xvr5pmatm5a4gx76fmat6kxt6o.cloudworkstations.dev/api/erp/process`

### ⚠️ NOTA SOBRE ERRO 401 (POSTMAN)
Se você tentar usar o Postman diretamente e receber **401 Unauthorized**, é devido à proteção do ambiente de desenvolvimento (Google Cloud Workstations).
**Para testar agora:** Use o **Simulador ERP** dentro do próprio portal (disponível no rodapé da Home ou via link direto):
`[URL-DO-APP]/debug/erp-simulator`

---

## 🛠️ PAYLOAD JSON (PASSO A PASSO)

Use o modelo abaixo para enviar os dados:

```json
{
  "institutionName": "NOME DA INSTITUIÇÃO",
  "cnpj": "00.000.000/0001-91",
  "consultantName": "NOME DO CONSULTOR RTM",
  "email": "contato@instituicao.com.br",
  "phoneNumber": "(11) 99999-8888",
  "orderValue": "OV-2024-001",
  "productName": "MENSAGERIA SWIFT",
  "commercialNotes": "Observações sobre a venda ou urgência"
}
```

### Resultado
Ao enviar, o registro criará um usuário `approved` e disparará uma instância na aba **"Disponíveis"** para o Suporte Técnico.

---

## 🗄️ DICIONÁRIO DE DADOS (FIRESTORE)

### 1. Coleção `users`
Dados mestres. Cada documento é uma instituição. Registros via API já nascem com `status: "approved"`.

### 2. Coleção `onboardingInstances`
Projetos de ativação. Se `techId` for nulo, está na fila de espera. Se tiver `flowId`, o roteiro técnico já foi escolhido.

### 3. Coleção `products`
Catálogo mestre. Onde ficam os roteiros técnicos (subcoleção `activationFlows/steps`).

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
