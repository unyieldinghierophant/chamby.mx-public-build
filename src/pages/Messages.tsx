import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Phone,
  User,
  Search
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from 'sonner';

const Messages = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for conversations
  const [conversations] = useState([
    {
      id: '1',
      providerName: 'María González',
      service: 'Limpieza de Casa',
      lastMessage: 'Perfecto, nos vemos mañana a las 10 AM',
      timestamp: '2 min ago',
      unread: true,
      status: 'confirmed'
    },
    {
      id: '2', 
      providerName: 'Carlos Rodríguez',
      service: 'Jardinería',
      lastMessage: 'Gracias por reservar nuestro servicio',
      timestamp: '1 hora ago',
      unread: false,
      status: 'pending'
    }
  ]);

  if (!user) {
    return <Navigate to="/auth/user" replace />;
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    toast.success('Mensaje enviado');
    setNewMessage('');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Volver al Perfil
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mensajes</h1>
            <p className="text-muted-foreground">Comunícate con tus proveedores de servicios</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversaciones
                </CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conversaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                        selectedChat === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedChat(conv.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">{conv.providerName}</h4>
                            {conv.unread && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{conv.service}</p>
                          <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                            <Badge variant={conv.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                              {conv.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised lg:col-span-2">
              {selectedChat ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {conversations.find(c => c.id === selectedChat)?.providerName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {conversations.find(c => c.id === selectedChat)?.service}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <Separator />
                  
                  <CardContent className="flex-1 p-4">
                    <div className="space-y-4 mb-4 h-96 overflow-y-auto">
                      {/* Mock messages */}
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                          <p className="text-sm">Hola, me interesa tu servicio de limpieza</p>
                          <span className="text-xs opacity-70">10:30 AM</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg max-w-xs">
                          <p className="text-sm">¡Hola! Claro, estaré encantada de ayudarte. ¿Para qué fecha necesitas el servicio?</p>
                          <span className="text-xs opacity-70">10:32 AM</span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                          <p className="text-sm">Para mañana por la mañana si es posible</p>
                          <span className="text-xs opacity-70">10:35 AM</span>
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg max-w-xs">
                          <p className="text-sm">Perfecto, nos vemos mañana a las 10 AM</p>
                          <span className="text-xs opacity-70">10:36 AM</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Escribe tu mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[80px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Selecciona una conversación</h3>
                    <p className="text-muted-foreground">
                      Elige una conversación para comenzar a chatear
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;