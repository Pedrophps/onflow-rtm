
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
A arquitetura é dividida em:
- **Painel Administrativo (RTM)**: Segmentado entre *Comercial* (gestão de contratos e ativação) e *Suporte* (infraestrutura e redes).
- **Portal do Cliente**: Jornada guiada para envio de evidências de conformidade e acompanhamento de implantação.

### 🎯 # OBJETIVOS DO USUÁRIO
- **Primário**: Automatizar o processo manual de onboarding, garantindo rastreabilidade e segurança em nível bancário.
- **Secundário**: Implementar inteligência GenAI para pré-análise de documentos enviados.
- **Técnico**: Estabelecer uma fundação resiliente no Firebase que suporte regras de acesso baseadas em papéis (RBAC) extremamente rígidas.

### ✅ # DECISÕES JÁ TOMADAS
- **Auth**: Firebase Auth como provedor de identidade. Domínios `@rtm.net.br` são promovidos a candidatos administrativos automaticamente.
- **Database**: Firestore como única fonte de persistência. Coleções principais: `users`, `onboardingFlows`, `submissions`.
- **UI/UX**: Estética "Modern Corporate" usando ShadCN. ~~Cores: RTM Red (#D32F2F) e Soft Beige (#F5F5DC).~~ Cores: RTM Red (#D32F2F) e Cinza Claro (#FAFAFA).
- **Security**: Regras de segurança do Firestore aplicadas **manualmente** para contornar falhas de provisionamento automático da API.

### 🛠️ # CONTEXTO TÉCNICO
- **Stack**: Next.js 15 (App Router), React 19, Firebase 11, Tailwind CSS, Lucide Icons.
- **Tratamento de Erros**: Implementado `errorEmitter` no Firebase para capturar `FirestorePermissionError`. Isso evita que falhas de regra de segurança quebrem a aplicação silenciosamente.
- **Persistência de Perfil**: O campo `role: admin` é o gatilho crítico para acesso às rotas `/dashboard/admin/*`.
- **Regras de Segurança (Firestore)**: 
  - `users/{userId}`: Somente o dono ou admins leem.
  - `onboardingFlows`: Somente admins escrevem.
  - `submissions`: Clientes criam, admins aprovam/rejeitam.

### 📜 # HISTÓRICO DE TENTATIVAS
- **TENTATIVA 1 (Falha)**: Provisionamento via `RequestFirebaseBackendTool`. Erro de `thought_signature` recorrente no modelo Gemini 3 Flash Preview.
- **TENTATIVA 2 (Sucesso)**: Configuração manual das Regras de Segurança e do banco de dados no Console do Firebase pelo usuário.
- **TENTATIVA 3 (Validação)**: Criação de uma página de `/debug/integration-test` para validar as regras. Identificada a necessidade de um botão de "Auto-Elevação para Admin" para usuários de teste.

---

## [UPDATE - V1.2 - PROTOCOLOS DE TESTE E VALIDAÇÃO]

### 🧪 # AMBIENTE DE TESTES (ABAS DE VALIDAÇÃO)

#### 1. Diagnóstico de Conexão (`/debug`)
- **Objetivo**: Validar se o SDK do Firebase está inicializado e se o navegador tem conectividade com os serviços (Auth/Firestore).
- **O que testar**: Clique em "Refazer Testes" e verifique se todos os logs aparecem em verde.

#### 2. Teste de Regras de Segurança (`/debug/integration-test`)
- **Objetivo**: Validar a eficácia das regras coladas no console do Firebase.
- **Casos de Teste**:
  - **Escrita de Perfil**: O usuário logado deve conseguir gravar em `/users/{seu_uid}`.
  - **Escrita de Fluxo**: Deve FALHAR para usuários `role: client` e SUCEDER para `role: admin`.
  - **Elevação**: O botão "Tornar meu usuário Admin agora" deve gravar `role: admin` no Firestore.

#### 3. Fluxo de Login e RBAC
- **Aba de Preenchimento Rápido**: No `/login`, utilize os botões de atalho para testar diferentes perfis (Suporte, Comercial, Cliente).
- **Validação de Visão**: Verifique se o Cliente é bloqueado na tela "Acesso Restrito" caso não tenha ID RTM e Produto Ativo.

### 🚀 # RESUMO EXECUTIVO PARA CONTINUIDADE
O sistema está com a infraestrutura de dados **validada**. As regras de segurança protegem as coleções críticas. O foco agora deve ser a **Lógica de Negócio**: transformar as submissões estáticas em um fluxo dinâmico onde o Admin possa aprovar/rejeitar documentos com feedback em tempo real.

---

## [UPDATE - V1.3 - AJUSTE ESTÉTICO E POLÍTICA DE CORES]
- **Mudança Visual**: O fundo bege foi removido para dar lugar a um cinza neutro e profissional (#FAFAFA).
- **Motivo**: Alinhamento com a identidade visual sóbria do mercado financeiro e melhoria na legibilidade.
- **Ação**: Atualizado `src/app/globals.css`.

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
