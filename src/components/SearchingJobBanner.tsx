import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Persistent banner shown on UserLanding when the client has an active
 * job in 'searching' status. Clicking navigates to EsperandoProveedor.
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

    // Listen for changes
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mx-4 mb-4"
        >
          <button
            onClick={() => navigate(`/esperando-proveedor?job_id=${searchingJob.id}`)}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border border-primary/30"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Buscando proveedor para tu solicitud
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {searchingJob.category}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
