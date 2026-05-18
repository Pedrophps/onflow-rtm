
# OnFlow RTM - Hub Integrador de Onboarding

O **OnFlow RTM** é a plataforma central de orquestração para ativação de serviços financeiros no ecossistema RTM. O sistema foi projetado para eliminar silos entre os times Comercial e Suporte, oferecendo ao Cliente Institucional uma jornada de ativação transparente, previsível e em tempo real.

---

## 🛡️ POLÍTICA DE VERSIONAMENTO ADITIVO
Este documento segue uma **Política de Persistência**: informações obsoletas são ~~tachadas~~, nunca apagadas. Novos blocos de atualização são inseridos no topo da seção de logs.

---

## 🚀 CICLO OPERACIONAL (WORKFLOW)

O ciclo de vida de um cliente no OnFlow segue quatro macro-fases:

1. **Admissão (Self-Service)**: O cliente realiza o cadastro institucional (CNPJ, Razão Social, Contato). O estado inicial é `pending`.
2. **Qualificação (Comercial)**: O time Comercial valida os dados, atribui o **ID RTM (Client Code)**, define o produto contratado e libera o acesso.
3. **Engajamento Técnico (Suporte)**: O Suporte visualiza o novo cliente na fila de "Disponíveis". Um analista assume a responsabilidade técnica e vincula o **Roteiro Técnico (Flow)** adequado ao produto.
4. **Execução e Entrega**: Cliente e Suporte interagem em uma timeline síncrona. O Suporte avança as etapas conforme as evidências são validadas no log de interações até a conclusão final.

---

## 👥 PERFIS E RESPONSABILIDADES

### 🏢 Cliente Institucional
- **Acompanhamento**: Visualiza o progresso percentual da sua ativação.
- **Interação**: Envia mensagens e evidências (arquivos) exclusivamente nas etapas sob sua responsabilidade.
- **Conformidade**: Mantém seus dados de contato atualizados para agilizar o suporte.

### 💼 Gestão Comercial (Admin)
- **Aprovação**: Atua como o "Gatekeeper" do sistema, aprovando ou rejeitando novos acessos.
- **Parâmetros**: Define códigos de cliente e produtos.
- **Relacionamento**: Insere notas comerciais que aparecem como "Boas-vindas" no dashboard do cliente.

### 🎧 Suporte Técnico (Admin)
- **Catálogo**: Gerencia os produtos e cria os roteiros de etapas (Fluxos).
- **Operação**: Assume atendimentos, avança/retrocede etapas e valida as configurações de infraestrutura (VPN, SWIFT, Rede).
- **Interação**: Pode intervir em qualquer etapa para orientar o cliente ou o time comercial.

---

## 🛠️ ARQUITETURA TÉCNICA

- **Frontend**: Next.js 15 (App Router) com React 19.
- **Estilização**: Tailwind CSS + ShadCN UI (Tematização institucional baseada em HSL).
- **Persistência**: Firebase Firestore (NoSQL) com atualizações via Listeners Real-time (`onSnapshot`).
- **Segurança**: RBAC (Role-Based Access Control) implementado via Firestore Security Rules e filtragem de queries no Client-side.
- **Observabilidade**: Sistema de Logs de Auditoria (`system_logs`) e Log de Interações (`interactions`).

---

## 🧪 FERRAMENTAS DE QA E DIAGNÓSTICO

O sistema possui uma suíte de depuração avançada para garantir a confiabilidade:
- **Diagnóstico de Rede**: `/debug` (Valida conexão com serviços Firebase).
- **Suíte de Testes (Seeding)**: `/debug/suite` (Gera cenários completos de produtos, fluxos e clientes para teste de estresse).
- **Auditoria de Logs**: `/debug/logs` (Histórico persistente de eventos técnicos).
- **Validação de Escrita**: `/debug/integration-test` (Testa as Security Rules contra tentativas de bypass).

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
