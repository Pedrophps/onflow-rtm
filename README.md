
# OnFlow RTM - Memória Operacional de Longo Prazo

Este documento é a fonte única de verdade (Single Source of Truth) para o projeto OnFlow RTM. Ele segue uma **Política de Versionamento Aditivo**: nenhuma informação é apagada, apenas acrescentada ou corrigida visualmente através de notações específicas.

---

## 🛡️ POLÍTICA DE VERSIONAMENTO E PERSISTÊNCIA
- **NUNCA APAGAR**: Informações antigas, decisões passadas ou logs técnicos não devem ser removidos.
- **CORREÇÃO**: Caso uma informação esteja errada ou obsoleta, utilize o formato ~~tachado~~ e aponte para a nova versão logo abaixo.
- **ADITIVIDADE**: Novas decisões e progresso devem ser inseridos em blocos de [UPDATE - DATA/VERSÃO].
- **OBJETIVO**: Garantir continuidade absoluta entre diferentes IAs e modelos, sem perda de contexto histórico.

---

## [V1.1 - SNAPSHOT DE CONTINUIDADE E ENGENHARIA REVERSA DE CONTEXTO]

### 🏗️ # VISÃO GERAL DO PROJETO
O **OnFlow** é um ecossistema digital B2B desenvolvido para a **RTM (Rede de Telecomunicações para o Mercado Financeiro)**. O sistema atua como um hub centralizador para o onboarding de instituições financeiras (Bancos, Corretoras, Fintechs). 

### 🎯 # OBJETIVOS DO USUÁRIO
- **Primário**: Automatizar o processo manual de onboarding, garantindo rastreabilidade e segurança em nível bancário.

### ✅ # DECISÕES JÁ TOMADAS
- **Auth**: Firebase Auth como provedor de identidade. Domínios `@rtm.net.br` são promovidos a candidatos administrativos automaticamente.
- **Database**: Firestore como única fonte de persistência.
- **UI/UX**: Estética "Modern Corporate" usando ShadCN. Cores: RTM Red (#D32F2F) e Cinza Médio-Claro (#F5F5F5).

### 🛠️ # CONTEXTO TÉCNICO
- **Stack**: Next.js 15 (App Router), React 19, Firebase 11, Tailwind CSS, Lucide Icons.

---

## [UPDATE - V1.13 - ARQUITETURA DE WORKFLOW ENGINE]
- **Mudança Estrutural**: Implementação da hierarquia Produto -> Fluxo -> Etapa.
- **Regras de RBAC**:
  - **Suporte**: Único perfil com permissão de CRUD em Produtos, Fluxos e Etapas.
  - **Comercial**: Somente leitura e acompanhamento.
- **Lógica Firestore**:
  - Coleção principal: `products`.
  - Subcoleção: `activationFlows`.
  - Sub-subcoleção: `steps`.
- **Objetivo**: Desacoplar a definição do fluxo (Template) da execução real por parte do cliente (Instância).
- **UX**: Navegação hierárquica implementada em `/dashboard/admin/products`.

---

## [UPDATE - V1.14 - REFINAMENTO DE CADASTRO DE PRODUTO]
- **Simplificação**: Remoção do campo "Código Identificador" do processo de criação e visualização de produtos.
- **Justificativa**: A identificação única agora é gerenciada exclusivamente pelo ID do documento Firestore para evitar redundância na interface.

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
