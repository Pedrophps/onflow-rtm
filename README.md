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
- **UI/UX**: Estética "Modern Corporate" usando ShadCN. Cores: RTM Red (#D32F2F) e Soft Beige (#F5F5DC).
- **Security**: Regras de segurança do Firestore aplicadas **manualmente** para contornar falhas de provisionamento automático da API.

### 🛠️ # CONTEXTO TÉCNICO
- **Stack**: Next.js 15 (App Router), React 19, Firebase 11, Tailwind CSS, Lucide Icons.
- **Tratamento de Erros**: Implementado `errorEmitter` no Firebase para capturar `FirestorePermissionError`. Isso evita que falhas de regra de segurança quebrem a aplicação silenciosamente.
- **Persistência de Perfil**: O campo `role: admin` é o gatilho crítico para acesso às rotas `/dashboard/admin/*`.
- **Regras de Segurança (Firestore)**: 
  - `users/{userId}`: Somente o dono ou admins leem.
  - `onboardingFlows`: Somente admins escrevem.
  - `submissions`: Clientes criam, admins aprovam/rejeitam.

### 🧠 # CONTEXTO COMPORTAMENTAL
- **Perfil do Usuário**: Especialista técnico com alto nível de exigência em integridade de dados.
- **Expectativa**: Respostas diretas, código pronto para produção e transparência total em logs de erro.
- **Ponto de Satisfação**: Verificação em tempo real (Páginas de Debug/Testes).
- **Ponto de Irritação**: Redirecionamentos em loop ou perda de estado de autenticação por falta de sincronia com o Firestore.

### 📜 # HISTÓRICO DE TENTATIVAS
- **TENTATIVA 1 (Falha)**: Provisionamento via `RequestFirebaseBackendTool`. Erro de `thought_signature` recorrente no modelo Gemini 3 Flash Preview.
- **TENTATIVA 2 (Sucesso)**: Configuração manual das Regras de Segurança e do banco de dados no Console do Firebase pelo usuário.
- **TENTATIVA 3 (Validação)**: Criação de uma página de `/debug/integration-test` para validar as regras. Identificada a necessidade de um botão de "Auto-Elevação para Admin" para usuários de teste.

### ⏳ # PENDÊNCIAS ATUAIS
1. Implementar o módulo de upload real para Firebase Storage (Evidências).
2. Criar o gerador dinâmico de etapas para o Comercial configurar novos produtos.
3. Desenvolver os relatórios consolidados em `/dashboard/admin/reports`.
4. Integrar GenAI para análise de conformidade de PDFs submetidos.

### 🚦 # REGRAS OPERACIONAIS
1. **Prioridade de Role**: Antes de qualquer renderização administrativa, verificar `user.role == 'admin'`.
2. **Fallback de Rede**: O app deve lidar graciosamente com estados de `offline` do Firebase (implementado via `useDoc` silencioso).
3. **Additive Docs**: Siga a política de versionamento acima; nunca remova logs de decisão.

### 💾 # MEMÓRIA ESTRATÉGICA
A RTM é o coração tecnológico do mercado financeiro brasileiro. O OnFlow não é apenas um portal de arquivos; é uma ferramenta de **confiança institucional**. Cada interação deve reforçar segurança e neutralidade.

### 🚀 # RESUMO EXECUTIVO FINAL
Fundação de Auth e Firestore concluída. Regras de segurança ativas. Sistema de captura de erros operacional. O projeto está pronto para a fase de **Lógica de Negócio**: Construção de fluxos dinâmicos e gestão real de submissões. A próxima IA deve focar em transformar os modelos estáticos de onboarding em documentos reativos do Firestore.

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*