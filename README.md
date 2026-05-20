
# OnFlow RTM - Hub Integrador de Onboarding

Plataforma de alta precisão para orquestração e ativação de serviços financeiros no ecossistema RTM.

---

## 🗄️ ESTRUTURA E DICIONÁRIO DE DADOS (FIRESTORE)

Abaixo, a descrição exata de cada coleção e o que cada registro dentro delas representa:

### 1. `users` (Perfis e Instituições)
**Onde armazena**: Dados de acesso, CNPJ e informações de venda do Comercial.
*   **Cada documento (`userId`) representa**: Uma conta individual. Pode ser um Analista RTM (Admin) ou uma Instituição Financeira (Cliente).
*   **Dados chave**: Se o cliente tem uma `orderValue` (OV) preenchida, significa que a venda foi formalizada.

### 2. `products` (Catálogo RTM)
**Onde armazena**: Os modelos/templates dos serviços oferecidos.
*   **Cada documento (`productId`) representa**: Um produto comercial (ex: "Mensageria SWIFT").
*   **Subcoleção `activationFlows`**: Contém o roteiro técnico (template).
*   **Subcoleção `steps`**: Contém as etapas manuais (ex: "Configurar VPN") com o SLA de horas.

### 3. `onboardingInstances` (Jornadas Ativas)
**Onde armazena**: O processo real de ativação que está acontecendo agora para um cliente.
*   **Cada documento (`instanceId`) representa**: O "projeto" de instalação de um produto para um cliente específico.
*   **Vínculo**: Conecta o `clientId` (quem compra) ao `techId` (qual analista do suporte está trabalhando no caso).

### 4. `interactions` (Chat e Evidências)
**Onde armazena**: O histórico de conversas e arquivos enviados.
*   **Cada documento (`interactionId`) representa**: Uma mensagem única no chat ou o registro de um arquivo anexado em uma etapa específica.
*   **Uso**: Serve para a auditoria de conformidade (saber quem mandou qual arquivo e quando).

### 5. `system_logs` (IA e Auditoria Técnica)
**Onde armazena**: Eventos automáticos do sistema.
*   **Cada documento (`logId`) representa**: Um rastro técnico. Ex: "IA extraiu dados do e-mail do Banco Alpha com 95% de confiança".
*   **Uso**: Monitorar se a integração com o Power Automate está funcionando sem erros.

### 6. `submissions` & `onboardingFlows` (Legacy/QA)
**Onde armazena**: Dados de validação de segurança.
*   **Uso**: Registros temporários criados pelo "Integration Test" para garantir que as regras de firewall do banco de dados (Security Rules) estão protegendo os dados corretamente.

---

## 🚀 GUIA DE INTEGRAÇÃO TÉCNICA (POWER AUTOMATE)

Para validar a ingestão automática via IA, utilize o endpoint público abaixo.

### 1. Endpoint de Produção
`https://6000-firebase-studio-1779040400544.cluster-xvr5pmatm5a4gx76fmat6kxt6o.cloudworkstations.dev/api/erp/process`

### 2. Payload de Exemplo (JSON)
```json
{
  "subject": "[ATIVAÇÃO CRÍTICA] SOLICITAÇÃO #2024-999 - BANCO OMEGA",
  "body": "Prezada equipe RTM, Confirmamos a venda de MENSAGERIA SWIFT para o cliente BANCO OMEGA, CNPJ 99.888.777/0001-11."
}
```

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
