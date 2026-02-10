import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tags per role
const PROVIDER_TAGS = ["Puntual", "Limpio", "Profesional", "Buena comunicación"];
const CLIENT_TAGS = ["Claro en instrucciones", "Puntual", "Respetuoso"];

interface RatingDialogProps {
  jobId: string;
  otherUserId: string; // the person being rated
  reviewerRole: "client" | "provider";
  onComplete: () => void;
  onDismiss: () => void;
}

export const RatingDialog = ({
  jobId,
  otherUserId,
  reviewerRole,
  onComplete,
  onDismiss,
}: RatingDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tags = reviewerRole === "client" ? PROVIDER_TAGS : CLIENT_TAGS;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error("Selecciona una calificación");
      return;
    }

    setSubmitting(true);

    try {
      // Check if other party already reviewed
      const { data: otherReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("job_id", jobId)
        .eq("reviewer_role", reviewerRole === "client" ? "provider" : "client")
        .maybeSingle();

      // Set visible_at: if other party already reviewed, make both visible now
      // Otherwise, set to 7 days from now
      const visibleAt = otherReview
        ? new Date().toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const reviewData = {
        job_id: jobId,
        client_id: reviewerRole === "client" ? user.id : otherUserId,
        provider_id: reviewerRole === "provider" ? user.id : otherUserId,
        rating,
        comment: comment.trim() || null,
        tags: selectedTags,
        reviewer_role: reviewerRole,
        visible_at: visibleAt,
      };

      const { error } = await supabase.from("reviews").insert(reviewData);
      if (error) throw error;

      // If other party already reviewed, make their review visible now too
      if (otherReview) {
        await supabase
          .from("reviews")
          .update({ visible_at: new Date().toISOString() })
          .eq("id", otherReview.id);
      }

      // System message in chat
      const systemMsg =
        reviewerRole === "client"
          ? "⭐ El cliente calificó el trabajo"
          : "⭐ El proveedor calificó el trabajo";

      await supabase.from("messages").insert({
        job_id: jobId,
        sender_id: user.id,
        receiver_id: otherUserId,
        message_text: systemMsg,
        is_system_message: true,
        system_event_type: "rating_submitted",
        read: false,
      });

      toast.success("¡Gracias por tu calificación!");
      onComplete();
    } catch (err: any) {
      console.error("Rating error:", err);
      toast.error("Error al enviar calificación");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-lg space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          {reviewerRole === "client"
            ? "¿Cómo fue el servicio?"
            : "¿Cómo fue el cliente?"}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileTap={{ scale: 0.85 }}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(star)}
            className="p-1"
          >
            <Star
              className={cn(
                "w-9 h-9 transition-colors",
                star <= (hoveredStar || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          </motion.button>
        ))}
      </div>

      {/* Rating label */}
      {rating > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground"
        >
          {rating === 1 && "Malo"}
          {rating === 2 && "Regular"}
          {rating === 3 && "Bueno"}
          {rating === 4 && "Muy bueno"}
          {rating === 5 && "Excelente"}
        </motion.p>
      )}

      {/* Quick Tags */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Selecciona hasta 3 (opcional)
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                selectedTags.includes(tag)
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Comentario opcional (máx. 250 caracteres)"
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 250))}
        className="min-h-[70px] text-sm resize-none"
      />
      <p className="text-[10px] text-muted-foreground text-right">
        {comment.length}/250
      </p>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full gap-2"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Enviar calificación
      </Button>
    </motion.div>
  );
};
