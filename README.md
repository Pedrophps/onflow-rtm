
# OnFlow RTM - Hub Integrador de Onboarding

Plataforma de alta precisão para orquestração e ativação de serviços financeiros no ecossistema RTM.

---

## 🚀 GUIA DE INTEGRAÇÃO (POWER AUTOMATE / ERP)

O OnFlow possui um endpoint de ingestão automática que pode ser chamado pelo seu ERP ou via Power Automate (leitura de Outlook).

### Endpoint de Ingestão
`POST /api/erp/process`

### Estrutura de Envio (JSON)

Você pode enviar os dados de duas formas:

#### 1. Modo IA (Recomendado para E-mails)
Envie o assunto e corpo do e-mail. A IA fará a extração do CNPJ, Instituição e Produto.
```json
{
  "subject": "Solicitação de Ativação #2024",
  "body": "Favor iniciar onboarding do Banco X, CNPJ 00.111.222/0001-33 para o produto RSFN."
}
```

#### 2. Modo Direto (Sistemas Estruturados)
Se o seu ERP já tem os dados, envie diretamente:
```json
{
  "institutionName": "Nome da Instituição",
  "cnpj": "00.000.000/0000-00",
  "productName": "MENSAGERIA SWIFT",
  "priority": "high"
}
```

*Nota: Ao enviar via API, uma nova atividade aparecerá instantaneamente na aba **"Disponíveis"** para o Suporte Técnico assumir.*

---

## 🗄️ DICIONÁRIO DE DADOS (FIRESTORE)

### 1. Coleção `users`
Onde ficam os perfis. Registros com `status: "pending"` são leads vindos da API ou novos cadastros aguardando o Comercial.

### 2. Coleção `onboardingInstances`
São os projetos reais de instalação. Cada registro aqui representa um ticket que o suporte está trabalhando.

### 3. Coleção `products`
O catálogo mestre. Contém as regras e etapas (steps) que a IA e o Suporte utilizam como modelo.

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
