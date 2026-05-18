
# OnFlow RTM - Memória Operacional de Longo Prazo

Este documento é a fonte única de verdade (Single Source of Truth) para o projeto OnFlow RTM. Ele segue uma **Política de Versionamento Aditivo**: nenhuma informação é apagada, apenas acrescentada ou corrigida visualmente através de notações específicas.

---

## 🛡️ POLÍTICA DE VERSIONAMENTO E PERSISTÊNCIA
- **NUNCA APAGAR**: Informações antigas, decisões passadas ou logs técnicos não devem ser removidos.
- **CORREÇÃO**: Caso uma informação esteja errada ou obsoleta, utilize o formato ~~tachado~~ e aponte para a nova versão logo abaixo.
- **ADITIVIDADE**: Novas decisões e progresso devem ser inseridos em blocos de [UPDATE - DATA/VERSÃO].

---

## [UPDATE - V1.17 - SIMPLIFICAÇÃO DO WORKFLOW]
- **Mudança de Requisito**: Remoção completa do seletor "Tipo de Interação" na interface de criação de etapas.
- **Lógica Padrão**: As etapas agora assumem o comportamento padrão de coleta de evidências (Upload).

## [UPDATE - V1.18 - REGRAS DE INTERAÇÃO POR RESPONSABILIDADE]
- **Nova Regra de Negócio**: Admins podem interagir com qualquer etapa. Clientes interagem apenas nas etapas onde são o `responsible`.
- **Implementação Técnica**: Atualização do `firestore.rules` para permitir CRUD em `submissions` baseado em UID ou cargo admin.
- **Dinamicidade**: Dashboard do Cliente agora consome etapas reais do produto vinculado no perfil, filtrando permissões de edição localmente.

## [UPDATE - V1.19 - FINALIZAÇÃO E PUBLICAÇÃO DO FLUXO]
- **Melhoria de UX**: Adição de botões globais de "Salvar Rascunho" e "Publicar Fluxo" no rodapé da página de detalhes.
- **Bug Fix**: Correção do tratamento de números no SLA para evitar a exibição de `NaN`.
- **Lógica de Publicação**: Fluxos publicados agora alteram seu status para `active`, sinalizando prontidão para instanciamento.

## [UPDATE - V1.20 - REFINAMENTO ESTÉTICO DOS BOTÕES]
- **Estética**: Remoção de ícones estáticos nos botões de rodapé para uma interface mais limpa e focada no texto.
- **Feedback**: Mantido apenas o loader de processamento quando em submissão.

---
*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
