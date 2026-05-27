"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá. Sou a IA da RTM OnFlow. Como posso ajudar você hoje?",
    },
  ]);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro ao conectar com a IA.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex flex-col">
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              RTM <span className="text-primary">OnFlow AI</span>
            </h1>
            <p className="text-sm text-slate-400">
              Integração OpenRouter + Next.js
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-300">Online</span>
          </div>
        </div>
      </header>

      <section className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-3xl p-5 shadow-2xl border transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-primary border-accent text-white"
                    : "bg-slate-900/80 border-white/10 text-slate-100 backdrop-blur-xl"
                }`}
              >
                <div className="flex items-center gap-2 mb-3 opacity-70 text-xs uppercase tracking-widest font-bold">
                  {msg.role === "user" ? (
                    <>
                      <User className="size-4" /> Usuário
                    </>
                  ) : (
                    <>
                      <Bot className="size-4" /> IA
                    </>
                  )}
                </div>

                <p className="leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl px-6 py-5 flex items-center gap-3 backdrop-blur-xl">
                <Loader2 className="animate-spin size-5 text-primary" />
                <span className="text-slate-300">
                  IA digitando...
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-xl sticky bottom-0">
        <div className="max-w-4xl mx-auto p-6">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full resize-none rounded-3xl bg-slate-900/90 border border-white/10 px-6 py-5 pr-20 text-white outline-none focus:border-primary transition-all min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="absolute bottom-4 right-4 size-12 rounded-2xl bg-primary hover:bg-accent transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}