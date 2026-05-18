
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, FileText, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { StepInteraction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface StepInteractionsProps {
  instanceId: string;
  stepId: string;
  clientId: string;
  canInteract: boolean;
  userName?: string;
  userRole?: string;
}

export function StepInteractions({ 
  instanceId, 
  stepId, 
  clientId,
  canInteract, 
  userName, 
  userRole 
}: StepInteractionsProps) {
  const db = useFirestore();
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Consulta simplificada para evitar dependência de índices complexos durante debug de permissão
  const interactionsQuery = useMemo(() => {
    if (!instanceId || !stepId || !clientId || !user) return null;
    
    return query(
      collection(db, 'interactions'),
      where('clientId', '==', clientId),
      where('instanceId', '==', instanceId),
      where('stepId', '==', stepId)
    );
  }, [db, instanceId, stepId, clientId, user?.uid]);

  const { data, loading, error } = useCollection<StepInteraction>(interactionsQuery);

  // Ordenação manual no client-side para garantir cronologia sem exigir índice composto imediato
  const interactions = useMemo(() => {
    return [...data].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeA - timeB;
    });
  }, [data]);

  const handleSendMessage = (e?: React.FormEvent, fileName?: string) => {
    e?.preventDefault();
    if ((!message.trim() && !fileName) || isSending || !user) return;

    setIsSending(true);
    const interactionData = {
      instanceId,
      stepId,
      clientId, 
      userId: user.uid, 
      userName: userName || user.displayName || user.email?.split('@')[0],
      userRole: userRole || 'usuário',
      message: message.trim(),
      fileName: fileName || null,
      fileUrl: fileName ? 'https://picsum.photos/seed/doc/800/600' : null,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'interactions'), interactionData)
      .then(() => {
        setMessage('');
      })
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'interactions',
          operation: 'create',
          requestResourceData: interactionData
        } satisfies SecurityRuleContext));
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  const simulateFileUpload = () => {
    const fileName = prompt('Simular Upload: Digite o nome do arquivo (ex: comprovante.pdf)');
    if (fileName) {
      handleSendMessage(undefined, fileName);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Log de Interação</h4>
        </div>
        {error && (
          <div className="flex items-center gap-1 text-[10px] text-destructive font-bold animate-pulse">
            <AlertCircle className="size-3" /> ERRO DE SINCRONIZAÇÃO
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4 bg-background/50">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary/20" />
          </div>
        ) : interactions.length > 0 ? (
          <div className="space-y-4">
            {interactions.map((msg) => {
              const isMe = msg.userId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                    isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase opacity-90">{msg.userName}</span>
                      <span className="text-[9px] font-bold opacity-70">• {msg.userRole}</span>
                    </div>
                    {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                    {msg.fileName && (
                      <div className={cn(
                        "mt-2 p-2 rounded-lg flex items-center gap-2 border",
                        isMe ? "bg-white/10 border-white/20" : "bg-background border-border"
                      )}>
                        <FileText className="size-4" />
                        <span className="text-xs font-medium truncate max-w-[150px]">{msg.fileName}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 font-bold">
                    {msg.createdAt?.seconds 
                      ? format(msg.createdAt.seconds * 1000, "HH:mm 'de' d MMM", { locale: ptBR }) 
                      : 'Enviando...'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
            <MessageSquare className="size-8 text-muted/20" />
            <p className="text-xs text-muted-foreground font-medium italic">Inicie uma conversa ou envie uma evidência.</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 bg-muted/5 border-t">
        {canInteract ? (
          <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="rounded-xl shrink-0 bg-background"
              onClick={simulateFileUpload}
              disabled={isSending}
            >
              <Paperclip className="size-4" />
            </Button>
            <Input 
              placeholder="Digite aqui..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl bg-background border-border"
              disabled={isSending}
            />
            <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!message.trim() || isSending}>
              {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        ) : (
          <div className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest py-2">
            Aguardando sua vez na jornada
          </div>
        )}
      </div>
    </div>
  );
}
