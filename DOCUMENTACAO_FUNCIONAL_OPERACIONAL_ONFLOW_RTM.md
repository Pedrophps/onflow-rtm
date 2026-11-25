# DOCUMENTAÇÃO FUNCIONAL E OPERACIONAL — ONFLOW RTM

## 1. VISÃO GERAL DO SISTEMA

### 1.1. Objetivo
O **OnFlow RTM** é uma plataforma de missão crítica projetada para orquestrar a ativação técnica de serviços financeiros (onboarding) no ecossistema RTM. Ele atua como uma ponte entre o fechamento comercial e a entrega operacional, garantindo que instituições financeiras sejam integradas à rede com conformidade, agilidade e rastreabilidade total.

### 1.2. Problemas Resolvidos
- **Silogismo Operacional**: Integra dados do ERP/Comercial diretamente com a fila do Suporte Técnico.
- **Opacidade no Onboarding**: Permite ao cliente e ao comercial acompanhar o progresso real de cada etapa técnica.
- **Gestão de SLAs**: Monitora o tempo estimado de execução de configurações complexas (VPNs, Mensageria, Conectividade).
- **Governança e Auditoria**: Centraliza logs de sistema e interações entre analistas e clientes para conformidade regulatória (BC/CVM).

### 1.3. Principais Módulos
- **Portal do Cliente**: Interface para acompanhamento de jornada e envio de evidências.
- **Gestão Comercial (Admin)**: Área para análise cadastral e inicialização de novos projetos.
- **Gestão de Onboarding (Suporte)**: Workflow de execução técnica dividido por etapas e roteiros (flows).
- **Módulo Sobreaviso**: Gestão de escalas 24h e acionamentos críticos.
- **Catálogo de Produtos & Flows**: Gestão de templates de roteiros técnicos.
- **Automação & IA**: Ingestão via API/ERP e parsing de e-mails via GenAI.

---

## 2. PERFIS DE ACESSO E PERMISSÕES (RBAC)

O sistema utiliza um modelo de controle de acesso baseado em papéis (Role-Based Access Control) definido no Firestore Security Rules.

### 2.1. Cliente (`role: client`)
*Perfil externo representando a instituição financeira.*
- **Visualização**: Próprio dashboard, status de suas ativações, documentos enviados por ele ou pelo suporte em seu contexto.
- **Ações**: Enviar mensagens e arquivos no log de interação (apenas em etapas sob sua responsabilidade), atualizar telefone de contato.
- **Proibições**: Ver outros clientes, alterar fluxos técnicos, acessar módulos administrativos ou de sobreaviso.
- **Segurança**: Bloqueado via regras de banco para ler ou escrever fora do seu `uid`.

### 2.2. Administrador Comercial (`adminType: comercial`)
*Perfil interno focado na pré-ativação e gestão de relacionamento.*
- **Visualização**: Todos os clientes, status institucional, progresso das ativações (visão comercial).
- **Ações**: Aprovar/Reprovar cadastros, vincular novos produtos/ativações a clientes, definir Ordem de Venda (OV), registrar notas comerciais.
- **Proibições**: Assumir tickets técnicos, concluir etapas do suporte, editar roteiros técnicos ou escalas de sobreaviso.
- **Segurança**: Permissão de escrita limitada a campos específicos do perfil do usuário e criação de `onboardingInstances`.

### 2.3. Administrador de Suporte (`adminType: suporte`)
*Perfil interno técnico executor.*
- **Visualização**: Todos os clientes, fila de onboarding, catálogo de produtos, escalas de sobreaviso.
- **Ações**: Assumir ativações pendentes, definir o roteiro técnico (flow), concluir etapas técnicas, registrar interações técnicas, realizar o fechamento técnico (conclusão).
- **Proibições**: Editar dados de Ordem de Venda (OV) ou informações estritamente comerciais (reservadas ao coordenador ou comercial).

### 2.4. Coordenador de Suporte (`adminType: coordenador_suporte`)
*Perfil de gestão operacional master.*
- **Ações**: Todas as permissões de suporte + Gestão completa de escalas de sobreaviso, criação de novos usuários administrativos, deleção de instâncias órfãs, disparo de acionamentos críticos.
- **Segurança**: Possui o maior nível de privilégio no sistema (`isAdmin()` e `isSupportCoordinator()` nas regras).

---

## 3. FLUXO DE CADASTRO E RESOLUÇÃO DE IDENTIDADE

### 3.1. Cadastro via Interface (Self-Service)
1. O usuário acessa `/login` e seleciona "Novo Cliente".
2. Preenche Nome, E-mail, Razão Social, CNPJ e Senha.
3. O sistema cria a conta no Firebase Auth e persiste o documento em `users` com `status: 'pending'`.
4. Usuários com e-mail `@rtm.net.br` são pré-identificados como potenciais administradores, mas exigem seleção de perfil em `/dashboard/admin/select-profile`.

### 3.2. Ingestão Automatizada (API/ERP)
O sistema possui uma inteligência de **Resolução de Identidade em Cascata** no `automation-service.ts`:
1. **Busca por E-mail**: Se o e-mail já existe, a nova ativação é vinculada ao ID existente.
2. **Busca por CNPJ**: Caso o e-mail seja novo, o sistema verifica o CNPJ para evitar duplicidade institucional.
3. **Busca por Nome**: Fallback final para identificar a instituição.
4. **Resultado**: Se identificado, atualiza o cliente (Reuse); se não, cria um novo perfil institucional com `status: 'approved'`.

---

## 4. JORNADA OPERACIONAL: DO LEAD À ATIVAÇÃO

### 4.1. Aprovação Comercial
- Cadastros via interface aparecem na "Gestão de Clientes" como pendentes.
- O comercial revisa os dados e clica em "Nova Ativação" ou atualiza o status para `approved`.
- É obrigatório o preenchimento da **Ordem de Venda (OV)** para garantir a rastreabilidade financeira.

### 4.2. Iniciação Técnica (Fila de Espera)
- Ao vincular um produto, uma `onboardingInstance` é criada com `status: 'pending'` e `supportStatus: 'fila_suporte'`.
- Esta instância aparece no módulo de Onboarding para todos os técnicos na aba "Disponíveis".

### 4.3. Execução do Onboarding
1. **Assunção**: Um analista de suporte clica em "Assumir". O sistema registra seu `techId`.
2. **Definição de Roteiro**: O analista seleciona um `activationFlow` (template) compatível com o produto contratado.
3. **Progressão**: O analista e o cliente interagem em cada etapa. O analista marca "Concluir Etapa" para avançar na jornada.
4. **Interações**: O log de interações permite envio de arquivos (evidências). Arquivos enviados são centralizados na biblioteca de documentos do cliente.

### 4.4. Fechamento e Conclusão
- Ao concluir a última etapa, o suporte executa o "Fechamento Técnico".
- O sistema verifica se existem outras ativações pendentes para aquele cliente.
- Caso seja a única ou última, o `institutionalStatus` do cliente é promovido para **"Ativo"**.
- Um log de sucesso é gerado em `system_logs` para auditoria.

---

## 5. MÓDULO DE SOBREAVISO (ON-CALL)

Projetado para garantir suporte 24/7 em infraestrutura crítica.
- **Escalabilidade**: Coordenadores definem turnos (início/fim) para técnicos específicos.
- **Check-in**: O técnico escalado deve confirmar sua disponibilidade via interface ("Confirmar Disponibilidade").
- **Acionamento (Trigger)**: Em incidentes graves, o coordenador dispara um acionamento. O técnico recebe a notificação no painel e deve realizar a transição de status: `sent` -> `received` -> `started` -> `finished`.
- **Monitoramento**: Painel em tempo real mostra quem é o responsável atual e se ele realizou o check-in obrigatório.

---

## 6. ESTRUTURA DE DADOS (FIRESTORE)

### 6.1. Entidades Principais
- **`users`**: Perfis, papéis, status institucional e dados de faturamento/OV.
- **`products`**: Catálogo de serviços RTM.
- **`activationFlows`**: Templates de roteiros técnicos (subcoleção de produtos).
- **`steps`**: Etapas individuais de um roteiro (subcoleção de flows).
- **`onboardingInstances`**: Projetos de ativação reais, vinculando cliente, produto, técnico e progresso.
- **`interactions`**: Mensagens e metadados de arquivos enviados por etapa.
- **`onCallSchedules`**: Datas e horários da escala técnica.
- **`system_logs`**: Trilha de auditoria imutável (escrita via código).

---

## 7. STATUS E ESTADOS (MAQUINA DE ESTADOS)

### 7.1. Status Institucional (`UserProfile`)
- `cadastro_recebido`: Cliente se cadastrou mas não foi revisado.
- `aprovado_comercialmente`: Comercial validou a entrada e OV.
- `ativo`: Onboarding técnico concluído com sucesso.

### 7.2. Status Operacional (`OnboardingInstance`)
- `pending`: Na fila de espera do suporte.
- `active`: Sendo executado por um técnico.
- `completed`: Ativação finalizada.
- `blocked`: Aguardando impedimento externo ou do cliente.

---

## 8. INTEGRAÇÕES E IA

- **ERP Integration**: Endpoint `/api/erp/process` recebe payloads JSON para criação automática de clientes e tickets.
- **Email Parsing (Genkit)**: Fluxo `parse-erp-email-flow.ts` utiliza IA para extrair CNPJ, Produto e Prioridade de e-mails informais do comercial, transformando-os em dados estruturados.
- **Suporte Inteligente**: Chatbot integrado com OpenRouter para auxílio em dúvidas técnicas iniciais.

---
*Documento gerado automaticamente pelo App Prototyper para fins de governança técnica.*