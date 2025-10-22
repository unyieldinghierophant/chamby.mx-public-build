import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminRoles() {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select(`
          *,
          profiles!admin_users_user_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  const departmentColors: Record<string, string> = {
    operations: 'bg-blue-100 text-blue-700',
    finance: 'bg-green-100 text-green-700',
    support: 'bg-purple-100 text-purple-700',
    content: 'bg-orange-100 text-orange-700',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Admin Roles & Permissions</h2>
            <p className="text-muted-foreground">
              Manage internal admin users and their access levels
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Admin User
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {adminUsers.filter(u => u.department === 'operations').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Finance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {adminUsers.filter(u => u.department === 'finance').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {adminUsers.filter(u => u.department === 'support').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Internal team members with admin access</CardDescription>
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
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Contact</th>
                      <th className="text-left py-3 px-4 font-medium">Department</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Last Login</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((admin) => (
                      <tr key={admin.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {admin.profiles?.full_name || 'Admin User'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {admin.profiles?.phone || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={departmentColors[admin.department] || ''}>
                            {admin.department || 'general'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {admin.last_login_at 
                            ? new Date(admin.last_login_at).toLocaleDateString('es-MX')
                            : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
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

        <Card>
          <CardHeader>
            <CardTitle>Permission Levels</CardTitle>
            <CardDescription>Available access levels and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  role: 'Admin',
                  description: 'Full system access, can manage all modules',
                  permissions: ['Users', 'Jobs', 'Payments', 'Support', 'Content', 'Roles']
                },
                {
                  role: 'Moderator',
                  description: 'Can manage users and content',
                  permissions: ['Users', 'Content', 'Support']
                },
                {
                  role: 'Finance',
                  description: 'Access to payment and financial data',
                  permissions: ['Payments', 'Jobs']
                },
                {
                  role: 'Support',
                  description: 'Handle customer support and disputes',
                  permissions: ['Support', 'Users']
                }
              ].map((level) => (
                <div key={level.role} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{level.role}</h3>
                    <Badge variant="outline">{level.permissions.length} modules</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {level.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
