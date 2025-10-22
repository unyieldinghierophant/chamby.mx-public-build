import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function PhotoRedirect() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      if (!shortCode) {
        navigate('/');
        return;
      }

      try {
        // Get full URL from database
        const { data, error } = await supabase
          .from('photo_short_links')
          .select('full_url, clicks')
          .eq('short_code', shortCode)
          .single();

        if (error || !data) {
          console.error('Short link not found:', shortCode);
          navigate('/not-found');
          return;
        }

        // Increment click count (fire and forget)
        supabase
          .from('photo_short_links')
          .update({ clicks: (data.clicks || 0) + 1 })
          .eq('short_code', shortCode)
          .then(() => console.log('Click tracked'));

        // Redirect to full URL
        window.location.href = data.full_url;
      } catch (err) {
        console.error('Redirect error:', err);
        navigate('/not-found');
      }
    };

    redirect();
  }, [shortCode, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}
