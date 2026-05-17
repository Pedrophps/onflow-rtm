# OnFlow RTM - Guia de Continuidade e Configuração Manual

Este documento serve como a memória central do projeto e o guia de correção para falhas de provisionamento automático.

---

## 🛠 GUIA DE CORREÇÃO MANUAL (Bypass de Erro de Sistema)

Se o sistema apresentar erros de `thought_signature` ou falhas ao criar coleções, siga estes passos no [Console do Firebase](https://console.firebase.google.com/):

### 1. Provisionamento do Firestore
- Vá em **Build > Firestore Database**.
- Clique em **Create Database**.
- Selecione **Modo de Produção**.
- Escolha a localização: `southamerica-east1` (ou a padrão sugerida).

### 2. Regras de Segurança (Firestore Rules)
Na aba **Rules** do Firestore, cole o seguinte código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Perfil do Usuário
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      // Admins podem ler todos os usuários
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Fluxos de Onboarding
    match /onboardingFlows/{flowId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      match /stages/{stageId} {
        allow read: if request.auth != null;
        allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }
    }
    
    // Submissões de Evidências
    match /submissions/{submissionId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🏗 ESTRUTURA TÉCNICA (Contexto para IA)

### Visão Geral
Sistema de gestão de onboarding B2B para a RTM, dividindo visões entre **Comercial**, **Suporte** e **Cliente**.

### Decisões de Arquitetura
- **Coleção Central**: `/users/{uid}` armazena o estado do perfil (`role`, `adminType`, `status`).
- **RBAC Implícito**: Redirecionamento baseado no campo `adminType` (`suporte` | `comercial`) para administradores.
- **Resiliência**: O componente `select-profile` aguarda a confirmação do Firestore antes do redirecionamento para evitar estados inconsistentes.

### O que funcionou e o que falhou
- **OK**: Lógica de redirecionamento, Tematização ShadCN (Vermelho RTM), Hooks de Firebase.
- **FALHA**: Provisionamento automático via ferramenta (Erros de `thought_signature` no modelo Gemini 3 Flash).

---

## 🎯 RESUMO EXECUTIVO PARA PRÓXIMA IA
Assuma o projeto focando na implementação do **Módulo de Upload de Documentos** (Firebase Storage) e na criação de **Relatórios** em `/dashboard/admin/reports`. A autenticação e a triagem de perfis administrativos já estão implementadas e testadas. Não altere o fluxo de `select-profile` sem antes verificar a persistência no Firestore.

*Identificando para integrar. Entender para atender. Conhecer para evoluir.*
