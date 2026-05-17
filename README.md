
# OnFlow RTM - Memória Operacional e Snapshot

Este documento consolida toda a arquitetura e progresso do projeto para continuidade absoluta.

---

## ⚡ ESTADO ATUAL: CONFIGURAÇÃO DE SEGURANÇA CONCLUÍDA
As regras do Firestore e o banco de dados foram provisionados. O sistema agora possui persistência total e proteção por RBAC.

### 🏗 ESTRUTURA TÉCNICA
- **Auth**: E-mail/Senha + RBAC (Role-Based Access Control).
- **Firestore**: Coleções `/users`, `/onboardingFlows`, `/submissions`.
- **RBAC**: 
  - `admin`: Pode gerenciar fluxos e usuários.
  - `client`: Acompanha sua própria jornada e envia evidências.

---

## 🧪 VALIDAÇÃO
Para testar se sua configuração manual do Firebase funcionou, acesse:
`http://localhost:9002/debug/integration-test`

---

## 🎯 PRÓXIMOS PASSOS (PENDÊNCIAS)
1.  **Módulo de Documentos**: Implementar o upload real para o Firebase Storage na página do cliente.
2.  **Relatórios**: Gerar gráficos de progressão na página `/dashboard/admin/reports`.
3.  **Gestão de Fluxos**: Permitir que o Admin crie novas etapas dinamicamente salvando em `/onboardingFlows/{id}/stages`.

---

## 📋 REGRAS OPERACIONAIS PARA PRÓXIMAS IAs
- **Não alterar o fluxo de login**: O sistema identifica administradores pelo domínio `@rtm.net.br` e clientes pelo `cnpj`.
- **Persistência**: Sempre aguarde `setDoc` ou `updateDoc` antes de redirecionar (`router.push`).
- **Erros**: Use o `errorEmitter.emit('permission-error', ...)` para falhas de segurança.

*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
