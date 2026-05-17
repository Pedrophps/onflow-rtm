
# OnFlow RTM - Hub de Onboarding Institucional

## 🚀 Visão Geral
O **OnFlow** é a plataforma oficial da RTM para a gestão de onboarding de instituições financeiras no mercado brasileiro. O sistema atua como um hub centralizador que automatiza a coleta de evidências, aprovação de contratos e ativação de serviços críticos (RSFN, SWIFT, PIX, Cloud, etc.), garantindo conformidade e agilidade no atendimento.

## 🎯 Pilares Estratégicos
- **Identificar para integrar**: Mapeamento preciso das necessidades das instituições.
- **Entender para atender**: Escuta ativa do mercado para viabilizar operações críticas.
- **Conhecer para evoluir**: Desenvolvimento tecnológico contínuo focado na transformação digital financeira.

## 👥 Perfis de Acesso e Regras de Negócio

### 1. Administrador RTM - Gestão Comercial
- **Responsabilidade**: Validação de conformidade e ativação institucional.
- **Fluxo Principal**: 
  - Visualiza novos cadastros pendentes (`status: pending`).
  - Atribui o **ID RTM** (Ex: RTM-BR-001).
  - Define o **Produto Principal** contratado.
  - Aprova o acesso para liberar o Dashboard de implantação do cliente.

### 2. Administrador RTM - Suporte Técnico
- **Responsabilidade**: Monitoramento de infraestrutura e suporte à conectividade.
- **Fluxo Principal**: Focado na visão técnica de redes, RSFN e monitoramento de alertas.

### 3. Cliente Institucional
- **Responsabilidade**: Envio de evidências e acompanhamento da jornada.
- **Bloqueio de Conformidade**: Clientes não aprovados ou sem ID RTM visualizam uma tela de bloqueio com o progresso da análise da RTM.

## 🏗️ Arquitetura Técnica

### Stack
- **Framework**: Next.js 15 (App Router).
- **Banco de Dados**: Cloud Firestore (NoSQL).
- **Autenticação**: Firebase Authentication.
- **Estilização**: Tailwind CSS + ShadCN UI.
- **Tipagem**: TypeScript com interfaces rigorosas em `src/lib/types.ts`.

### Modelagem de Dados (Firestore)
A aplicação utiliza uma estrutura de coleção única para usuários:
- **Coleção `/users/{userId}`**:
  - `email`: String (emails `@rtm.net.br` são identificados como admins).
  - `role`: `'admin'` ou `'client'`.
  - `adminType`: `'comercial'` ou `'suporte'` (apenas para admins).
  - `status`: `'pending'`, `'approved'` ou `'rejected'`.
  - `clientCode`: String (ID RTM único).
  - `activeProduct`: String (Produto em implantação).

### Segurança e Tratamento de Erros
- **Optimistic UI**: Mutações Firestore são disparadas sem `await` para fluidez, exceto em transições de perfil críticas.
- **Central Error Handling**: Erros de permissão do Firestore são capturados via `errorEmitter` e disparados como Toasts através do `FirebaseErrorListener`.

## 🛠️ Fluxo de Desenvolvimento e Manutenção
1. **Provisionamento**: Sempre que houver mudanças na estrutura de dados, o `backend.json` deve ser sincronizado e a ferramenta de provisionamento disparada.
2. **Navegação**: O sistema usa o `adminType` no documento do usuário para determinar a visão do dashboard.
3. **Diagnóstico**: O portal inclui uma página `/debug` para validação de conectividade em tempo real com os serviços Firebase.

---
*OnFlow by RTM - Identificando para integrar. Entender para atender.*
