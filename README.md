# OnFlow RTM - Memória Operacional de Longo Prazo

Este documento é a fonte única de verdade (Single Source of Truth) para o projeto OnFlow RTM. Ele segue uma **Política de Versionamento Aditivo**: nenhuma informação é apagada, apenas acrescentada ou corrigida visualmente.

---

## 🛡️ POLÍTICA DE VERSIONAMENTO E PERSISTÊNCIA
- **NUNCA APAGAR**: Informações antigas, decisões passadas ou logs técnicos não devem ser removidos.
- **CORREÇÃO**: Caso uma informação esteja errada ou obsoleta, utilize o formato ~~tachado~~ e aponte para a nova versão logo abaixo.
- **ADITIVIDADE**: Novas decisões e progresso devem ser inseridos em blocos de [UPDATE - DATA/VERSÃO].
- **OBJETIVO**: Garantir continuidade absoluta entre diferentes IAs e modelos, sem perda de contexto histórico.

---

## [V1.0 - ESTRUTURA INICIAL E SNAPSHOT DE CONTINUIDADE]

### 🏗️ VISÃO GERAL DO PROJETO
O **OnFlow** é um hub integrador B2B desenvolvido para a **RTM** (Rede de Telecomunicações para o Mercado Financeiro). O sistema gerencia o onboarding de instituições financeiras, dividindo-se em:
- **Admin (Comercial/Suporte)**: Gestão de fluxos, aprovação de documentos e monitoramento.
- **Cliente**: Jornada de implantação, envio de evidências e conformidade.

### 🎯 OBJETIVOS DO USUÁRIO
- **Principal**: Automação total do processo de onboarding RTM com persistência segura no Firestore.
- **Secundários**: Gestão dinâmica de etapas, relatórios de progresso e integração GenAI para análise documental.
- **Expectativa**: Sistema robusto, resiliente a falhas de rede e com regras de segurança rigorosas.

### 📝 DECISÕES JÁ TOMADAS
- **Auth**: Firebase Auth com identificação automática de admins via domínio `@rtm.net.br`.
- **Database**: Firestore como única fonte de persistência institucional.
- **UI**: ShadCN UI + Tailwind com paleta RTM (Vermelho #D32F2F / Bege #F5F5DC).
- **Security Rules**: Implementação de RBAC (Role-Based Access Control) via Firestore Security Rules.

### 🛠️ CONTEXTO TÉCNICO
- **Arquitetura**: Next.js 15 (App Router), React 19, Firebase SDK 11+.
- **Padrão de Erros**: Custom `errorEmitter` capturando falhas de permissão do Firestore e exibindo via Toasts.
- **Lógica de Perfil**: O campo `role` no documento do usuário define o acesso. O campo `adminType` define a visão (Comercial vs Suporte).
- **Redirecionamento**: Fluxo de login inteligente que valida se o admin já selecionou seu ambiente de trabalho.

### 🧠 CONTEXTO COMPORTAMENTAL
- **Perfil do Usuário**: Especialista técnico, exige precisão operacional e transparência em logs de erro.
- **Tom de Resposta**: Colaborativo, mas extremamente técnico e direto.
- **Ponto de Satisfação**: Verificação em tempo real de conexão e testes de integridade (Página de Debug).
- **Ponto de Irritação**: Redirecionamentos em loop ou perda de estado de autenticação.

### 📜 HISTÓRICO DE TENTATIVAS
- **TENTATIVA 1**: Provisionamento automático via `RequestFirebaseBackendTool`.
  - **Resultado**: FALHA (Erro de `thought_signature` no modelo Gemini 3 Flash Preview).
- **TENTATIVA 2**: Configuração manual do banco de dados e regras de segurança.
  - **Resultado**: SUCESSO. O usuário aplicou as regras manualmente no Console do Firebase.
- **TENTATIVA 3**: Validação de Regras via Página de Teste.
  - **Resultado**: PARCIAL. Identificada necessidade de elevar o usuário para `role: admin` para testar fluxos.

### ⏳ PENDÊNCIAS ATUAIS
1. Implementar o módulo real de upload para o Firebase Storage.
2. Criar o gerador de fluxos dinâmicos para o Comercial.
3. Desenvolver os relatórios agregados na página `/dashboard/admin/reports`.

### 🚨 REGRAS OPERACIONAIS PARA A PRÓXIMA IA
1. **NÃO APAGUE O README**: Siga a política de versionamento aditivo acima.
2. **VERIFIQUE O PAPEL**: Antes de qualquer operação administrativa, verifique se o usuário tem `role: admin` no Firestore.
3. **ERROS DE SEGURANÇA**: Se o Firestore retornar "Permission Denied", use o `errorEmitter` para informar o usuário.

### 💾 MEMÓRIA ESTRATÉGICA
A RTM é um ambiente neutro. O OnFlow não deve apenas "funcionar", ele deve "passar confiança". A interface deve ser limpa, com badges de status claros e feedback imediato de cada ação do usuário.

### 🚀 RESUMO EXECUTIVO FINAL
O núcleo de autenticação e persistência está estabelecido. As regras de segurança do Firestore foram configuradas manualmente pelo usuário para contornar limitações da API do Google. O sistema agora está pronto para a fase de **Funcionalidades de Negócio**, começando pela gestão real de submissões e construção dinâmica de fluxos.

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
