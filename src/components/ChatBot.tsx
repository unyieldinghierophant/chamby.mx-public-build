import { useState, useRef, useEffect } from "react";
import { X, Send, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ufoChamby from "@/assets/ufo-chamby-final.png";
import chatbotAlienLogo from "@/assets/chatbot-alien-logo.png";

// Preload images immediately
const preloadUfo = new window.Image();
preloadUfo.src = ufoChamby;
const preloadAlien = new window.Image();
preloadAlien.src = chatbotAlienLogo;

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy el asistente virtual de Chamby. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleWhatsAppRedirect = () => {
    const phoneNumber = "523325438136"; // Formato internacional con código de país
    const message = encodeURIComponent("Hola, vengo del chatbot de Chamby y necesito ayuda");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { messages: [...messages, userMessage] },
      });

      if (error) throw error;

      const assistantMessage = data.message;

      // Verificar si el bot quiere conectar con humano
      try {
        const parsed = JSON.parse(assistantMessage);
        if (parsed.action === "contact_human") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: parsed.message },
          ]);
          setTimeout(() => {
            handleWhatsAppRedirect();
          }, 1000);
          return;
        }
      } catch {
        // No es JSON, es respuesta normal
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No pude procesar tu mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Abrir chat de ayuda"
      >
        <div className="relative flex items-center justify-center w-[5.6rem] h-[5.6rem] rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border-2 border-primary/30 shadow-elegant hover:shadow-glow hover:scale-110 hover:border-primary/50 transition-all duration-300 animate-subtle-bounce">
          <img 
            src={ufoChamby} 
            alt="UFO Chamby - Ayuda" 
            className="w-24 h-24 drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
            loading="eager"
          />
          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 shadow-lg animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <img src={chatbotAlienLogo} alt="Chamby Assistant" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h3 className="font-semibold">Asistente Chamby</h3>
            <p className="text-xs text-white/80">En línea</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-[400px] p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="bg-blue-100 rounded-full p-1.5 h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <img src={chatbotAlienLogo} alt="Assistant" className="w-6 h-6 object-contain" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-800 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="bg-blue-800 rounded-full p-2 h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="bg-blue-100 rounded-full p-1.5 h-8 w-8 flex items-center justify-center">
                <img src={chatbotAlienLogo} alt="Assistant" className="w-6 h-6 object-contain" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleWhatsAppRedirect}
          className="text-xs text-blue-800 hover:text-blue-900 font-medium"
        >
          💬 Hablar con un humano
        </button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-blue-800 hover:bg-blue-900"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
