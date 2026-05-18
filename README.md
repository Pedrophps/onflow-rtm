
# OnFlow RTM - Hub Integrador de Onboarding

O **OnFlow RTM** é a plataforma central de orquestração para ativação de serviços financeiros no ecossistema RTM. O sistema foi projetado para eliminar silos entre os times Comercial e Suporte, oferecendo ao Cliente Institucional uma jornada de ativação transparente, previsível e em tempo real.

---

## 🛡️ POLÍTICA DE VERSIONAMENTO ADITIVO
Este documento segue uma **Política de Persistência**: informações obsoletas são ~~tachadas~~, nunca apagadas. Novos blocos de atualização são inseridos no topo da seção de logs.

---

## 💰 CUSTOS E ESCALABILIDADE (FREE TIER FRIENDLY)
O projeto foi estruturado para operar com **custo zero** durante as fases de Prototipagem, QA e MVP:
- **IA (Genkit + Gemini 1.5 Flash)**: Utiliza a cota gratuita do Google AI Studio para processamento de e-mails e automação.
- **Database & Auth (Firebase)**: Roda sobre o plano Spark (gratuito), suportando milhares de interações mensais sem faturamento.
- **Infraestrutura**: Frontend otimizado para baixo consumo de Edge Runtime.

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

### 💼 Gestão Comercial (Admin)
- **Aprovação**: Atua como o "Gatekeeper" do sistema, aprovando novos acessos.
- **Relacionamento**: Insere notas comerciais que aparecem como "Boas-vindas" no dashboard do cliente.

### 🎧 Suporte Técnico (Admin)
- **Catálogo**: Gerencia os produtos e cria os roteiros de etapas (Fluxos).
- **Operação**: Assume atendimentos e valida as configurações de infraestrutura.

---

## 🛠️ ARQUITETURA TÉCNICA

- **Frontend**: Next.js 15 (App Router).
- **IA**: Genkit para triagem automática de e-mails do ERP.
- **Persistência**: Firebase Firestore Real-time.
- **Segurança**: RBAC via Firestore Security Rules.

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
