import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Users, 
  TrendingUp 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface DashboardStats {
  total_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
  active_users: number;
  active_providers: number;
  total_payments: number;
  jobs_today: number;
  bookings_today: number;
}

interface TopProvider {
  user_id: string;
  full_name: string;
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  total_earnings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProviders, setTopProviders] = useState<TopProvider[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (statsError) throw statsError;
      setStats(statsData);

      // Fetch top providers
      const { data: providersData, error: providersError } = await supabase
        .rpc('get_top_providers', { limit_count: 5 });

      if (!providersError && providersData) {
        setTopProviders(providersData);
      }

      // Fetch recent jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, profiles!jobs_provider_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!jobsError && jobsData) {
        setRecentJobs(jobsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats?.total_jobs || 0,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `+${stats?.jobs_today || 0} today`
    },
    {
      title: 'Completed Jobs',
      value: stats?.completed_jobs || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${stats?.completed_jobs ? Math.round((stats.completed_jobs / stats.total_jobs) * 100) : 0}% success rate`
    },
    {
      title: 'Cancelled Jobs',
      value: stats?.cancelled_jobs || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: `${stats?.total_jobs ? Math.round((stats.cancelled_jobs / stats.total_jobs) * 100) : 0}% cancellation`
    },
    {
      title: 'Total Payments',
      value: `$${((stats?.total_payments || 0) / 1).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: 'MXN'
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'Clients'
    },
    {
      title: 'Active Providers',
      value: stats?.active_providers || 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: 'Verified'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Jobs Overview</CardTitle>
              <CardDescription>Job status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Total', value: stats?.total_jobs || 0 },
                  { name: 'Completed', value: stats?.completed_jobs || 0 },
                  { name: 'Cancelled', value: stats?.cancelled_jobs || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Providers</CardTitle>
              <CardDescription>Best performing providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProviders.slice(0, 5).map((provider, index) => (
                  <div key={provider.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{provider.full_name || 'Provider'}</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.completed_jobs} jobs • ⭐ {provider.rating?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${provider.total_earnings?.toLocaleString('es-MX') || '0'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest job postings and requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Job ID</th>
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Provider</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-medium">{job.title}</td>
                      <td className="py-3 px-4">{job.profiles?.full_name || 'N/A'}</td>
                      <td className="py-3 px-4">{job.category}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          job.status === 'active' ? 'bg-green-100 text-green-700' :
                          job.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">${job.rate}</td>
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
