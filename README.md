
# OnFlow RTM - Hub Integrador de Onboarding

Plataforma de alta precisão para orquestração e ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 GUIA DE INTEGRAÇÃO (API DIRETA)

O OnFlow possui um endpoint de ingestão automática que deve ser chamado pelo seu ERP ou via Power Automate.

### Endpoint de Ingestão
`POST /api/erp/process`

### Estrutura de Envio (JSON)

O envio deve ser estruturado com os seguintes campos obrigatórios:

```json
{
  "institutionName": "Nome da Instituição",
  "cnpj": "00.000.000/0001-91",
  "consultantName": "Nome do Consultor RTM",
  "email": "contato@instituicao.com.br",
  "phoneNumber": "(11) 99999-8888",
  "orderValue": "OV-2024-001",
  "productName": "MENSAGERIA SWIFT",
  "commercialNotes": "Observações sobre a venda ou urgência"
}
```

*Nota: Ao enviar este JSON, um novo registro aparecerá instantaneamente na aba **"Disponíveis"** para o Suporte Técnico iniciar o onboarding.*

---

## 🗄️ DICIONÁRIO DE DADOS (FIRESTORE)

### 1. Coleção `users`
Contém os perfis institucionais. Registros criados via API recebem `status: "approved"` automaticamente.

### 2. Coleção `onboardingInstances`
São os projetos reais. Qualquer registro com `techId: null` aparece como disponível para o suporte na aba de gestão.

### 3. Coleção `products`
O catálogo mestre que serve de modelo para os produtos citados no campo `productName` da API.

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
