import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Plus, Loader2, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ActiveJob {
  id: string;
  title: string;
  category: string;
  status: string | null;
}

const ProviderCreateHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActiveJobs = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, category, status")
        .eq("provider_id", user.id)
        .in("status", ["assigned", "confirmed", "in_progress", "completed"])
        .order("created_at", { ascending: false })
        .limit(10);

      setActiveJobs(data || []);
      setLoading(false);
    };

    fetchActiveJobs();
  }, [user]);

  const handleCreateInvoice = (jobId: string) => {
    navigate(`/provider/invoices/create/${jobId}`);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground font-jakarta">Crear</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acciones rápidas para tu negocio
          </p>
        </div>

        {/* Create Invoice Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Crear Factura</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed border-border bg-muted/30">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No tienes trabajos activos para facturar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Acepta un trabajo desde Inicio para poder crear facturas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeJobs.map((job, index) => (
                <motion.button
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCreateInvoice(job.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {job.category} · {job.status === "completed" ? "Completado" : "Activo"}
                    </p>
                  </div>
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProviderCreateHub;
