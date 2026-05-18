
# OnFlow RTM - Memória Operacional de Longo Prazo

Este documento é a fonte única de verdade (Single Source of Truth) para o projeto OnFlow RTM. Ele segue uma **Política de Versionamento Aditivo**: nenhuma informação é apagada, apenas acrescentada ou corrigida visualmente através de notações específicas.

---

## 🛡️ POLÍTICA DE VERSIONAMENTO E PERSISTÊNCIA
- **NUNCA APAGAR**: Informações antigas, decisões passadas ou logs técnicos não devem ser removidos.
- **CORREÇÃO**: Caso uma informação esteja errada ou obsoleta, utilize o formato ~~tachado~~ e aponte para a nova versão logo abaixo.
- **ADITIVIDADE**: Novas decisões e progresso devem ser inseridos em blocos de [UPDATE - DATA/VERSÃO].

---

## [UPDATE - V1.15 - CORREÇÃO DE PERMISSÕES FIRESTORE]
- **Problema**: Usuários com perfil 'suporte' enfrentavam erro de permissão ao tentar criar produtos/fluxos devido à falta de regras de segurança explícitas.
- **Solução**: Implementação de `firestore.rules` com funções auxiliares `isSupportAdmin()` e `isAdmin()`.
- **Lógica de Proteção**:
  - Escrita em `/products/**` restrita a `adminType == 'suporte'`.
  - Leitura global de produtos para usuários autenticados.
  - Usuários podem ler seus próprios perfis para garantir a resolução do RBAC no frontend.

## [UPDATE - V1.16 - REFINAMENTO DE ETAPAS E SLA]
- **Mudança de Requisito**: Removida a opção "Apenas Informação" do tipo de interação em etapas de workflow, pois toda etapa deve gerar um output (Upload ou Form).
- **Ajuste de Métrica**: Alteração da unidade de SLA de "Dias" para "Horas" para refletir a agilidade necessária em processos críticos RTM.
- **Impacto Técnico**: Atualização da interface `FlowStep` e dos componentes de criação e listagem de etapas.

---
*Identificando para integrar. Enender para atender. Conhecer para evoluir.*
