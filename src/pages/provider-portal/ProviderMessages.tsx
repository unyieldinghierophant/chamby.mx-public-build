import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Headset, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Thread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatarInitial?: string;
}

const supportThreads: Thread[] = [
  {
    id: "s1",
    title: "Soporte Chamby",
    lastMessage: "¡Bienvenido! Estamos aquí para ayudarte.",
    timestamp: "hace 2 min",
    unread: true,
  },
  {
    id: "s2",
    title: "Soporte Chamby",
    lastMessage: "Tu verificación ha sido aprobada.",
    timestamp: "hace 1 día",
    unread: false,
  },
];

const clientThreads: Thread[] = [
  {
    id: "c1",
    title: "Cliente: Ana García",
    lastMessage: "Perfecto, nos vemos mañana a las 10.",
    timestamp: "hace 5 min",
    unread: true,
    avatarInitial: "A",
  },
  {
    id: "c2",
    title: "Cliente: Luis Pérez",
    lastMessage: "Gracias por el servicio, todo excelente.",
    timestamp: "hace 3 hrs",
    unread: false,
    avatarInitial: "L",
  },
];

const ConversationItem = ({ thread, isSupport }: { thread: Thread; isSupport: boolean }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={() => toast("Próximamente", { description: "El chat estará disponible pronto." })}
    className="flex items-center gap-3 w-full p-4 text-left border-b border-border/50 last:border-b-0 hover:bg-muted/40 transition-colors"
  >
    {/* Avatar */}
    <div className="relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-base">
      {isSupport ? (
        <Headset className="w-5 h-5" />
      ) : (
        thread.avatarInitial ?? "?"
      )}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground truncate">{thread.title}</h3>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{thread.timestamp}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage}</p>
    </div>

    {/* Unread dot */}
    {thread.unread && (
      <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary" />
    )}
  </motion.button>
);

const EmptyState = ({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{subtitle}</p>
  </motion.div>
);

const ThreadList = ({ threads, isSupport, query }: { threads: Thread[]; isSupport: boolean; query: string }) => {
  const filtered = threads.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    return isSupport ? (
      <EmptyState icon={Headset} title="Escríbenos si necesitas ayuda" subtitle="Nuestro equipo de soporte te responderá lo antes posible." />
    ) : (
      <EmptyState icon={MessageSquare} title="Aún no tienes conversaciones con clientes" subtitle="Cuando un cliente te contacte, aparecerá aquí." />
    );
  }

  return (
    <div>
      {filtered.map((t) => (
        <ConversationItem key={t.id} thread={t} isSupport={isSupport} />
      ))}
    </div>
  );
};

const ProviderMessages = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 space-y-3">
        <h1 className="text-xl font-bold text-foreground font-jakarta">Mensajes</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="soporte" className="px-5">
        <TabsList className="w-full">
          <TabsTrigger value="soporte" className="flex-1">Soporte</TabsTrigger>
          <TabsTrigger value="clientes" className="flex-1">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="soporte" className="mt-3">
          <ThreadList threads={supportThreads} isSupport query={searchQuery} />
        </TabsContent>

        <TabsContent value="clientes" className="mt-3">
          <ThreadList threads={clientThreads} isSupport={false} query={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderMessages;
