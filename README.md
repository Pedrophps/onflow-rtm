
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
  "productName": "slc",
  "commercialNotes": "Observações sobre a venda ou urgência"
}
```

### Regras de Negócio:
*   **Resolução de Identidade**: O sistema utiliza o `email` e o `cnpj` para verificar se a instituição já possui cadastro. Se identificado, a nova ativação é vinculada ao perfil existente em vez de criar um novo usuário.
*   **Mapeamento de Produto**: Se o `productName` for igual ao nome de um produto cadastrado (ex: "SLC", "SWIFT"), o sistema vinculará automaticamente o roteiro técnico correto.
*   **Aprovação**: Registros via API já nascem com status `approved` no perfil do usuário para agilizar o handoff.
*   **Visibilidade**: O registro aparecerá instantaneamente na aba **"Disponíveis"** para o Suporte Técnico.

---

## 🗄️ DICIONÁRIO DE DADOS (FIRESTORE)

### 1. Coleção `users`
Dados mestres de perfil. Registros via API criam ou atualizam usuários com `role: "client"` e `status: "approved"`.

### 2. Coleção `onboardingInstances`
Projetos de ativação em curso. Se `techId` for nulo, está na fila de espera. O `productId` é resolvido automaticamente pela API.

### 3. Coleção `products`
Catálogo mestre. Contém as definições de nomes e roteiros técnicos (subcoleção `activationFlows`).

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
