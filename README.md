
# OnFlow RTM - Hub Integrador de Onboarding

Plataforma de alta precisão para orquestração e ativação de serviços financeiros no ecossistema RTM.

---

## 🗄️ DICIONÁRIO DE DADOS (FIRESTORE)

Se você está olhando para o console do Firebase agora, aqui está o que cada coisa significa:

### 1. Coleção `users` (A Fila de Entrada)
**O que é**: Onde ficam todos os seres humanos e empresas que acessam o sistema.
*   **Registros com `status: "pending"`**: São os usuários que você mencionou. Eles estão "na porta", esperando o Comercial aprovar.
*   **Registros com `status: "approved"`**: Clientes que já possuem contrato e Ordem de Venda (OV) vinculada.
*   **Registros com `role: "admin"`**: Funcionários da RTM (Suporte ou Comercial).

### 2. Coleção `products` (Os Modelos)
**O que é**: O catálogo mestre da RTM.
*   **Cada registro aqui**: É um "molde" (ex: Mensageria SWIFT). Ele não é um projeto real, apenas as instruções de como o projeto deve ser.
*   **Subcoleção `activationFlows` -> `steps`**: São as tarefas que o suporte terá que cumprir (ex: "Configurar VPN").

### 3. Coleção `onboardingInstances` (Os Projetos Reais)
**O que é**: Onde o trabalho acontece de verdade.
*   **Cada registro aqui**: É um "Ticket" de instalação ativo. 
*   **Vínculo**: Ele conecta um ID de usuário da coleção `users` a um ID de produto da coleção `products`.
*   **Status**: Aqui você vê se o suporte já assumiu o cliente ou se ele ainda está "Disponível".

### 4. Coleção `interactions` (A Prova do Crime)
**O que é**: O log de auditoria técnica.
*   **Cada registro aqui**: Uma mensagem de chat ou um arquivo (PDF/Print) enviado como evidência de que uma etapa foi concluída.

### 5. Coleção `system_logs` (O Rastro da IA)
**O que é**: Onde o sistema "fala sozinho".
*   **Cada registro aqui**: Um log técnico. Se a IA extraiu um e-mail do Power Automate, o resultado (sucesso ou erro) aparece aqui primeiro.

---

## 🚀 GUIA DE INTEGRAÇÃO (POWER AUTOMATE)

### Endpoint de Ingestão
`POST /api/erp/process`

**Payload esperado**:
```json
{
  "subject": "Assunto do e-mail",
  "body": "Conteúdo extraído do Outlook"
}
```
*Ao enviar este JSON, um novo registro aparecerá na coleção `users` com status `pending` e uma nova instância de onboarding será criada na fila do suporte.*

---
*Identificar para integrar. Entender para atender. Conhecer para evoluir.*
