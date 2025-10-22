import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminSupport() {
  // Placeholder for support module - to be implemented with message system
  const mockTickets = [
    {
      id: '1',
      client: 'Juan Pérez',
      provider: 'María García',
      issue: 'Payment not received',
      status: 'open',
      priority: 'high',
      created: '2024-01-15'
    },
    {
      id: '2',
      client: 'Ana López',
      provider: 'Carlos Ruiz',
      issue: 'Service quality complaint',
      status: 'in_progress',
      priority: 'medium',
      created: '2024-01-14'
    },
    {
      id: '3',
      client: 'Pedro Santos',
      provider: 'Laura Martínez',
      issue: 'Scheduling conflict',
      status: 'resolved',
      priority: 'low',
      created: '2024-01-13'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <MessageSquare className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Being handled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Successfully closed</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>Manage disputes and customer support requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Ticket ID</th>
                    <th className="text-left py-3 px-4 font-medium">Client</th>
                    <th className="text-left py-3 px-4 font-medium">Provider</th>
                    <th className="text-left py-3 px-4 font-medium">Issue</th>
                    <th className="text-left py-3 px-4 font-medium">Priority</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        #{ticket.id}
                      </td>
                      <td className="py-3 px-4 font-medium">{ticket.client}</td>
                      <td className="py-3 px-4">{ticket.provider}</td>
                      <td className="py-3 px-4">{ticket.issue}</td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          ticket.priority === 'high' ? 'destructive' :
                          ticket.priority === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          ticket.status === 'resolved' ? 'default' :
                          ticket.status === 'in_progress' ? 'secondary' :
                          'destructive'
                        }>
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
