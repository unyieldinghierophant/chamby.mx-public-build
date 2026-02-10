import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ReviewsTab } from "@/components/provider/ReviewsTab";

const ProviderReviewsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <div className="bg-background border-b border-border/50 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => navigate("/provider-portal/account")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground">
          Reseñas y Calificaciones
        </h1>
      </div>
      <div className="px-4 py-4">
        <ReviewsTab />
      </div>
    </div>
  );
};

export default ProviderReviewsPage;
