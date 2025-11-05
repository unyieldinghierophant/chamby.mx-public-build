import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase } from 'lucide-react';
import chambyLogo from '@/assets/chamby-logo-new.png';

const RoleSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        navigate('/auth/user');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const userRoles = data.map(r => r.role);
        
        // If only one role, redirect automatically
        if (userRoles.length === 1) {
          handleRoleSelection(userRoles[0]);
          return;
        }

        setRoles(userRoles);
      } catch (error) {
        console.error('Error fetching roles:', error);
        // Default to client if error
        navigate('/user-landing');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user, navigate]);

  const handleRoleSelection = (role: string) => {
    // Store selected role in localStorage for session persistence
    localStorage.setItem('selected_role', role);
    
    // Clear login context after selection
    localStorage.removeItem('login_context');
    
    // Redirect based on role
    if (role === 'provider') {
      navigate('/provider-portal');
    } else if (role === 'admin') {
      navigate('/admin'); // TODO: Create admin dashboard
    } else {
      navigate('/user-landing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <img 
            src={chambyLogo} 
            alt="Chamby" 
            className="h-12 mx-auto"
          />
          <CardTitle className="text-3xl font-bold">
            Elige cómo usar Chamby
          </CardTitle>
          <CardDescription className="text-lg">
            Tu cuenta tiene múltiples roles. Selecciona cómo quieres continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {roles.includes('client') && (
              <Button
                onClick={() => handleRoleSelection('client')}
                className="h-auto py-8 flex flex-col items-center gap-4 bg-gradient-subtle hover:bg-gradient-button transition-all"
                variant="outline"
              >
                <Users className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <div className="font-semibold text-lg">Continuar como Cliente</div>
                  <div className="text-sm text-muted-foreground">
                    Encuentra y contrata profesionales
                  </div>
                </div>
              </Button>
            )}

            {roles.includes('provider') && (
              <Button
                onClick={() => handleRoleSelection('provider')}
                className="h-auto py-8 flex flex-col items-center gap-4 bg-gradient-subtle hover:bg-gradient-button transition-all"
                variant="outline"
              >
                <Briefcase className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <div className="font-semibold text-lg">Continuar como Chambynauta</div>
                  <div className="text-sm text-muted-foreground">
                    Ofrece tus servicios profesionales
                  </div>
                </div>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelection;
