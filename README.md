# OnFlow RTM - Hub de Onboarding Institucional

## VISÃO GERAL DO PROJETO
O **OnFlow** é a plataforma central de onboarding da **RTM**, projetada para automatizar e gerenciar a entrada de novas instituições financeiras no ecossistema de serviços da empresa (RSFN, SWIFT, PIX, Cloud, etc.). O sistema atua como uma ponte entre o time Comercial/Suporte da RTM e os clientes, garantindo conformidade e transparência em todas as etapas da implantação.

---

## OBJETIVOS DO USUÁRIO

### Principais
1. **Gestão de Acesso Rigorosa**: Diferenciar claramente Administradores RTM de Clientes Institucionais.
2. **Dashboard Multi-Visão**: Prover visões específicas para o time de **Suporte Técnico** (infra) e **Gestão Comercial** (contratos/ativação).
3. **Fluxo de Conformidade**: Bloquear o acesso de clientes que ainda não foram aprovados ou que não possuem identificadores críticos (ID RTM e Produto Ativo).

### Secundários
- Monitoramento de saúde da conexão Firebase via portal de diagnóstico (`/debug`).
- Automatização da coleta de evidências de onboarding.
- Interface moderna e profissional que transmita a autoridade da RTM no mercado financeiro.

---

## DECISÕES JÁ TOMADAS (Não Redefinir)
- **Tecnologia Base**: Next.js 15 (App Router), Firebase SDK v11, Tailwind CSS, ShadCN UI.
- **Modelo de Dados**: Coleção única `/users` no Firestore para identidades.
- **Regras de Negócio de Perfil**: 
  - Emails `@rtm.net.br` ou com a palavra `admin` são tratados como administradores.
  - O campo `adminType` (`suporte` ou `comercial`) é obrigatório para admins e define a rota do dashboard.
  - Clientes só acessam o hub após `status: 'approved'`, `clientCode` preenchido e `activeProduct` definido.
- **Estética**: Uso obrigatório do Vermelho RTM (`primary`) e Bege Suave (`background`) definidos no `globals.css`.

---

## CONTEXTO TÉCNICO

### Arquitetura de Código
- **Firebase Abstraction**: Localizada em `src/firebase/`. Inclui hooks customizados (`useUser`, `useDoc`, `useCollection`) e um provedor de contexto centralizado.
- **Tratamento de Erros**: Sistema robusto via `errorEmitter.ts`. Erros de permissão do Firestore são capturados pela classe `FirestorePermissionError` e exibidos como Toasts destrutivos via `FirebaseErrorListener.tsx`.
- **Navegação**: Uso intensivo de `router.replace` em fluxos de login/perfil para evitar que o usuário volte a telas de configuração após o sucesso.
- **Componentes UI**: Baseados em Radix (via ShadCN). Customizados para suportar o tema institucional da RTM.

### Estrutura de Dados (Firestore)
- **`/users/{uid}`**:
  - `role`: 'admin' | 'client'
  - `adminType`: 'suporte' | 'comercial'
  - `status`: 'pending' | 'approved' | 'rejected'
  - `clientCode`: Ex: "RTM-BR-001"
  - `activeProduct`: Ex: "RSFN", "SWIFT"

---

## CONTEXTO COMPORTAMENTAL
- **Perfil do Usuário**: Engenheiro técnico sênior. Valoriza código limpo, tipagem rigorosa (TypeScript) e arquiteturas resilientes.
- **Expectativas**: A IA deve ser capaz de auto-corrigir falhas de infraestrutura (como erros de provisionamento) e antecipar problemas de sincronização de estado.
- **Tom de Resposta**: Direto, técnico e focado em resolução de problemas.

---

## HISTÓRICO DE TENTATIVAS
- **O que funcionou**: A lógica de redirecionamento baseada em `adminType` e o filtro de clientes pendentes para o time comercial.
- **O que falhou**: O provisionamento automático do backend via ferramenta externa apresentou instabilidades (`thought_signature`), exigindo reforço na lógica de escrita resiliente (uso de `.then()` e `.catch()` explícitos em mutações Firestore).
- **Correções aplicadas**: Implementação de verificação dupla no `select-profile` e `AdminPage` para evitar loops de redirecionamento caso o Firestore demore a propagar a atualização do perfil.

---

## PENDÊNCIAS ATUAIS
1. **Módulo de Evidências**: Implementar o upload real de arquivos na jornada do cliente (integrar com Firebase Storage).
2. **Relatórios**: Desenvolver a página `/dashboard/admin/reports` com métricas reais extraídas da coleção de usuários.
3. **Configuração de Etapas**: Permitir que o admin crie novas etapas de onboarding via UI (atualmente mockado em `src/app/dashboard/admin/onboarding/page.tsx`).

---

## REGRAS OPERACIONAIS PARA A PRÓXIMA IA
1. **Nunca** use `await` diretamente em mutações Firestore (`setDoc`, `updateDoc`). Use o padrão `.then().catch()` com `errorEmitter`.
2. **Preserve** os identificadores de dados de IA nas imagens (`data-ai-hint`).
3. **Mantenha** a internacionalização em Português do Brasil (pt-BR).
4. **Respeite** a hierarquia de pastas: componentes de UI em `src/components/ui/`, lógica de dados em `src/firebase/`.

---

## MEMÓRIA ESTRATÉGICA
A RTM é um agente neutro no mercado. O sistema OnFlow deve refletir essa neutralidade e segurança. Qualquer falha de permissão no Firestore deve ser tratada como um evento crítico que ajuda o desenvolvedor a ajustar as Security Rules. O arquivo `backend.json` é a planta baixa para a infraestrutura e deve ser sincronizado a cada nova funcionalidade de banco de dados.

---

## RESUMO EXECUTIVO FINAL (SNAPSHOT)
Sistema OnFlow RTM em estágio avançado de prototipagem funcional. Autenticação e RBAC (Role-Based Access Control) implementados. Perfil administrativo bifurcado entre Suporte e Comercial funcional. Desafio atual: estabilização do provisionamento do backend e implementação da persistência de arquivos para onboarding. Prossiga para a implementação do Firebase Storage para documentos de clientes.

*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
