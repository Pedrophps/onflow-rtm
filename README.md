
# OnFlow RTM - Hub Integrador de Onboarding

Plataforma de alta precisão para orquestração e ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 GUIA DE INTEGRAÇÃO (API DIRETA)

O OnFlow possui um endpoint de ingestão automática que deve ser chamado pelo seu ERP ou via Power Automate.

### Endpoint de Ingestão (POST)
`https://6000-firebase-studio-1779040400544.cluster-xvr5pmatm5a4gx76fmat6kxt6o.cloudworkstations.dev/api/erp/process`

### Segurança
**Autenticação:** Nenhuma (Rota Pública).

### Estrutura de Envio (JSON)

O envio deve ser estruturado com os seguintes campos obrigatórios. Ao enviar este JSON, um novo registro aparecerá instantaneamente na aba **"Disponíveis"** para o Suporte Técnico.

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

---

## 🗄️ DICIONÁRIO DE DADOS (FIRESTORE)

### 1. Coleção `users`
Contém os perfis institucionais. Registros criados via API recebem `status: "approved"` automaticamente. Cada documento representa um usuário ou empresa.

### 2. Coleção `onboardingInstances`
São os projetos reais em andamento. Representam a jornada técnica de um cliente para um produto específico. Se `techId` for nulo, o projeto está aguardando um analista na fila.

### 3. Coleção `products`
O catálogo mestre que serve de modelo para os produtos. Contém as subcoleções de `steps` (etapas) que definem o roteiro técnico.

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
