import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientActiveJob {
  id: string;
  title: string;
  scheduled_at: string | null;
  provider_name: string | null;
}

export const ClientActiveJobBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<ClientActiveJob | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchActiveJob = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, scheduled_at, provider_id")
        .eq("client_id", user.id)
        .in("status", ["assigned", "accepted", "confirmed", "en_route", "on_site", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        setJob(null);
        return;
      }

      let providerName: string | null = null;
      if (data.provider_id) {
        const { data: providerData } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", data.provider_id)
          .maybeSingle();
        providerName = providerData?.full_name ?? null;
      }

      setJob({
        id: data.id,
        title: data.title,
        scheduled_at: data.scheduled_at,
        provider_name: providerName,
      });
    };

    fetchActiveJob();

    const channel = supabase
      .channel("client-active-job-banner")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        fetchActiveJob();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  if (!job) return null;

  const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : null;

  return (
    <button
      onClick={() => navigate(`/active-jobs`)}
      className="w-full bg-foreground text-background px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-foreground/90 transition-colors rounded-xl shadow-md"
    >
      {/* Pulsing dot */}
      <span className="relative flex-shrink-0 w-2.5 h-2.5">
        <span className="absolute inset-0 rounded-full bg-emerald-400 motion-safe:animate-ping opacity-75" />
        <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold truncate">
          Tu trabajo está en curso
          <span className="font-normal text-background/70"> — {job.title}</span>
        </p>
        <p className="text-[11px] text-background/60 truncate hidden sm:block">
          {job.provider_name && <span>{job.provider_name}</span>}
          {job.provider_name && scheduledDate && <span> · </span>}
          {scheduledDate && (
            <span>{format(scheduledDate, "d MMM, HH:mm", { locale: es })}</span>
          )}
        </p>
      </div>

      {/* CTA */}
      <span className="flex-shrink-0 bg-background text-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
        Ver trabajo
        <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </button>
  );
};
