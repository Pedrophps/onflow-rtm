# OnFlow RTM - Manual Técnico e de Governança

O **OnFlow RTM** é uma plataforma de missão crítica para a orquestração e ativação de serviços financeiros no ecossistema RTM. Este documento detalha a infraestrutura, lógica de dados, protocolos de segurança e diretrizes operacionais.

---

## 1. Arquitetura do Sistema

A solução utiliza uma arquitetura **Serverless de Alta Performance**, baseada no paradigma de "Event-Driven Onboarding".

### 1.1. Stack Tecnológica
*   **Frontend**: Next.js 15+ (App Router) com React 19.
*   **Backend-as-a-Service (BaaS)**: Firebase (Firestore, Authentication, App Hosting).
*   **IA & Orquestração**: Genkit 1.x (Google AI) integrado ao OpenRouter (Owl-Alpha) para processamento de linguagem natural.
*   **UI/UX**: Tailwind CSS, Radix UI e Shadcn UI, seguindo o Brandbook RTM.
*   **Automação**: Endpoints de API estruturados para ingestão via Power Automate e ERPs legados.

### 1.2. Fluxo de Dados de Ponta a Ponta
1.  **Ingestão**: Dados chegam via API `/api/erp/process` ou Webhook.
2.  **Resolução de Identidade**: O `automation-service.ts` executa uma busca em cascata (E-mail -> CNPJ -> Nome) para evitar duplicidade de clientes.
3.  **Persistência**: Criação de `onboardingInstances` vinculadas ao `clientId`.
4.  **Ativação Técnica**: O analista de suporte assume o ticket e avança nas `activationFlows`.
5.  **Conclusão**: O fechamento global promove o status institucional do cliente para "Ativo".

---

## 2. Dicionário de Dados (Firestore)

O banco de dados é NoSQL, organizado em coleções otimizadas para leitura e auditoria.

*   **`users`**: Perfis mestres. Campos chave: `role`, `adminType` (suporte, comercial, coordenador), `institutionalStatus`, `cnpj`, `orderValue`.
*   **`products`**: Catálogo de serviços RTM. Contém subcoleções de `activationFlows`.
*   **`onboardingInstances`**: Projetos de ativação ativos. Armazena o estado atual, técnico responsável e previsão de entrega (`expectedDeliveryDate`).
*   **`interactions`**: Log de chat e evidências documentais (arquivos simulados) por etapa de projeto.
*   **`system_logs`**: Trilha de auditoria (Auditoria Interna/Compliance). Registra quem, o quê e quando para cada ação crítica.

---

## 3. Dependências e Integrações

### 3.1. Core Dependencies
*   `genkit`: Framework de IA para fluxos de trabalho determinísticos.
*   `firebase`: SDK para tempo real e autenticação.
*   `lucide-react`: Biblioteca de ícones padronizada.
*   `recharts`: Visualização de dados operacionais no dashboard admin.

### 3.2. External APIs
*   **OpenRouter**: Gateway para LLMs de última geração (usado no chat de suporte inteligente).
*   **Google AI (Gemini)**: Processamento de documentos e parsing de e-mails via Genkit Flows.

---

## 4. Segurança e Privacidade

O sistema opera sob o modelo de **Segurança em Camadas**.

### 4.1. RBAC (Role-Based Access Control)
As `firestore.rules` impõem as seguintes restrições:
*   **Clientes**: Podem ler apenas seus próprios dados e interagir em seus próprios onboarding.
*   **Comercial**: Pode criar clientes e visualizar progresso, mas não alterar etapas técnicas.
*   **Suporte**: Pode editar workflows, assumir ativações e realizar o fechamento técnico.
*   **Coordenador**: Acesso irrestrito a escalas de sobreaviso e configurações mestras.

### 4.2. Proteção de Dados
*   **Resolução de Identidade**: Chaves únicas baseadas em CNPJ normalizado.
*   **Auditoria**: Logs não-editáveis na coleção `system_logs` para conformidade com normas do Banco Central/CVM sobre histórico de ativação de infraestrutura.

---

## 5. Custos Operacionais (Estimativa)

| Serviço | Modelo de Cobrança | Impacto no OnFlow |
| :--- | :--- | :--- |
| **Firebase (Firestore)** | Operações de Leitura/Escrita | Baixo (Otimizado por snapshots) |
| **Firebase App Hosting** | Instâncias de computação | Escalável conforme tráfego |
| **OpenRouter / AI** | Tokens (Input/Output) | Médio (Depende do volume de interações no chat) |
| **Google Workstations** | Horas de desenvolvimento | Variável (Ambiente de Dev) |

---

## 6. Monitoramento e Saúde

A plataforma possui um sistema de monitoramento nativo:
*   **Endpoint de Saúde**: `/api/system/health` (Exige Bearer Token). Verifica latência do banco e estado dos serviços de IA.
*   **Logs em Tempo Real**: Disponíveis em `/debug/logs` para administradores, capturando falhas de permissão e erros de runtime.
*   **Firebase Analytics**: Monitoramento de funil (onde os clientes travam no onboarding).

---

## 7. Testes e Validação

Localizados na rota `/debug/*`, a suíte de testes permite validar:
1.  **Integridade de Banco**: Ferramenta de auditoria que identifica instâncias órfãs ou produtos sem roteiro.
2.  **Simulador ERP**: Permite disparar payloads JSON idênticos aos do Power Automate para testar a criação de fluxos.
3.  **Master Test (E2E)**: Simula o ciclo completo: Lead -> Aprovação Comercial -> Fila do Suporte -> Atendimento Técnico.

---

## 8. Implantação e Rollback

### 8.1. Estratégia de Deploy
*   Utiliza **Firebase App Hosting** integrado ao GitHub.
*   Cada commit na branch `main` dispara um build automático com verificação de tipos (TypeScript).

### 8.2. Protocolo de Rollback
1.  **Interface Firebase**: Selecionar a versão anterior estável no painel de App Hosting.
2.  **Git**: Reverter o merge da branch estável via `git revert`.
3.  **Firestore**: Em caso de erro de dados, o `system_logs` permite identificar o estado anterior para recuperação manual ou via script de correção (disponível no `DatabaseAuditPage`).

---

## 9. Limitações e Continuidade

### 9.1. Limitações Atuais
*   **Arquivos**: O upload de evidências é simulado (Base64/Link Externo). Integração total com Firebase Storage pendente para volumes > 10MB.
*   **Concorrência**: Atualmente configurado para `maxInstances: 1` no `apphosting.yaml` para controle de custos de MVP.

### 9.2. Continuidade de Negócio (Disaster Recovery)
*   **Backup**: Exportação diária do Firestore via Google Cloud Storage.
*   **Alta Disponibilidade**: Multi-region configurada para o banco de dados.
*   **Fallback Humano**: Caso a IA falhe, o sistema prioriza a exibição do canal de atendimento via e-mail e telefone 24h na aba de Suporte.

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
**RTM - Rede de Telecomunicações para o Mercado**
