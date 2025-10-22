import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  user_id: string;
  full_name: string;
  phone: string;
  is_tasker: boolean;
  verification_status: string;
  rating: number;
  total_reviews: number;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'clients' | 'providers'>('all');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'clients') {
        query = query.eq('is_tasker', false);
      } else if (filter === 'providers') {
        query = query.eq('is_tasker', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'verified', verified: true })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Usuario verificado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Error al verificar usuario');
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Usuario suspendido');
      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Error al suspender usuario');
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'clients' ? 'default' : 'outline'}
              onClick={() => setFilter('clients')}
            >
              Clientes
            </Button>
            <Button
              variant={filter === 'providers' ? 'default' : 'outline'}
              onClick={() => setFilter('providers')}
            >
              Proveedores
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' ? 'Todos los Usuarios' : 
               filter === 'clients' ? 'Clientes' : 'Proveedores'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium">Teléfono</th>
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium">Estado</th>
                      <th className="text-left py-3 px-4 font-medium">Rating</th>
                      <th className="text-left py-3 px-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{user.phone || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.is_tasker ? 'default' : 'secondary'}>
                            {user.is_tasker ? 'Proveedor' : 'Cliente'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={
                              user.verification_status === 'verified' ? 'default' :
                              user.verification_status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {user.verification_status === 'verified' ? 'Verificado' :
                             user.verification_status === 'pending' ? 'Pendiente' :
                             'Rechazado'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {user.is_tasker ? (
                            <div>
                              <span className="font-medium">⭐ {user.rating?.toFixed(1) || 'N/A'}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({user.total_reviews || 0})
                              </span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {user.verification_status !== 'verified' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerify(user.user_id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Verificar
                              </Button>
                            )}
                            {user.verification_status === 'verified' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSuspend(user.user_id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Suspender
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
