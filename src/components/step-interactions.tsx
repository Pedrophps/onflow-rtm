
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, FileText, Loader2, MessageSquare } from 'lucide-react';
import { StepInteraction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const interactionsQuery = useMemo(() => {
    if (!instanceId || !stepId) return null;
    return query(
      collection(db, 'interactions'),
      where('instanceId', '==', instanceId),
      where('stepId', '==', stepId),
      orderBy('createdAt', 'asc')
    );
  }, [db, instanceId, stepId]);

  const { data: interactions, loading } = useCollection<StepInteraction>(interactionsQuery);

  const handleSendMessage = async (e?: React.FormEvent, fileName?: string) => {
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
      fileUrl: fileName ? 'https://example.com/mock-file-url' : null, // Simulado
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'interactions'), interactionData);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const simulateFileUpload = () => {
    const fileName = prompt('Simular Upload: Digite o nome do arquivo (ex: vpn_config.pdf)');
    if (fileName) {
      handleSendMessage(undefined, fileName);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-white border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-slate-50/50 flex items-center gap-2">
        <MessageSquare className="size-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">Log de Interação e Evidências</h4>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary/20" /></div>
        ) : interactions.length > 0 ? (
          <div className="space-y-4">
            {interactions.map((msg) => {
              const isMe = msg.userId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                    isMe ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase opacity-70">{msg.userName}</span>
                      <span className="text-[9px] font-bold opacity-50">• {msg.userRole}</span>
                    </div>
                    {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                    {msg.fileName && (
                      <div className={cn(
                        "mt-2 p-2 rounded-lg flex items-center gap-2 border",
                        isMe ? "bg-white/10 border-white/20" : "bg-white border-slate-200"
                      )}>
                        <FileText className="size-4" />
                        <span className="text-xs font-medium truncate max-w-[150px]">{msg.fileName}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto"><Paperclip className="size-3" /></Button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-bold">
                    {msg.createdAt?.seconds ? format(msg.createdAt.seconds * 1000, "HH:mm 'de' d MMM", { locale: ptBR }) : 'Enviando...'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
            <MessageSquare className="size-8 text-slate-200" />
            <p className="text-xs text-slate-400 font-medium italic">Nenhuma interação registrada para esta etapa.</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 bg-slate-50 border-t">
        {canInteract ? (
          <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="rounded-xl shrink-0"
              onClick={simulateFileUpload}
              disabled={isSending}
            >
              <Paperclip className="size-4" />
            </Button>
            <Input 
              placeholder="Escreva sua mensagem ou anote o envio..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl bg-white"
              disabled={isSending}
            />
            <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!message.trim() || isSending}>
              {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        ) : (
          <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest py-2">
            Aguardando sua vez na jornada
          </div>
        )}
      </div>
    </div>
  );
}
