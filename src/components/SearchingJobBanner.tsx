import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Persistent banner shown on UserLanding when the client has an active
 * job in 'searching' status. Styled to match ClientActiveJobBanner.
 */
export const SearchingJobBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchingJob, setSearchingJob] = useState<{ id: string; title: string; category: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchSearching = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, category")
        .eq("client_id", user.id)
        .eq("status", "searching")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setSearchingJob(data[0]);
      } else {
        setSearchingJob(null);
      }
    };

    fetchSearching();

    const channel = supabase
      .channel("searching-banner")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "jobs",
        filter: `client_id=eq.${user.id}`,
      }, () => {
        fetchSearching();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <AnimatePresence>
      {searchingJob && (
        <motion.button
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          onClick={() => navigate(`/esperando-proveedor?job_id=${searchingJob.id}`)}
          className="w-full bg-amber-500 text-white px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-amber-500/90 transition-colors rounded-xl shadow-md"
        >
          {/* Pulsing search dot */}
          <span className="relative flex-shrink-0 w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-white motion-safe:animate-ping opacity-75" />
            <span className="relative block w-2.5 h-2.5 rounded-full bg-white" />
          </span>

          {/* Text */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold truncate">
              Buscando un proveedor para tu servicio...
            </p>
            <p className="text-[11px] text-white/70 truncate">
              Te notificaremos cuando un proveedor acepte
            </p>
          </div>

          {/* CTA */}
          <span className="flex-shrink-0 bg-white text-amber-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            Ver estado
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
