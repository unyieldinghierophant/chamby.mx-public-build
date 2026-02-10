import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  created_at: string;
  client: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const ReviewsTab = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;

    try {
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, client_id, tags, reviewer_role")
        .eq("provider_id", user.id)
        .eq("reviewer_role", "client")
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch client profiles for each review
      const reviewsWithClients = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: clientData } = await supabase
            .from("users")
            .select("full_name, avatar_url")
            .eq("id", review.client_id)
            .single();

          return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            tags: (review as any).tags || [],
            created_at: review.created_at,
            client: {
              full_name: clientData?.full_name || null,
              avatar_url: clientData?.avatar_url || null,
            },
          };
        })
      );

      setReviews(reviewsWithClients);

      // Calculate average rating
      if (reviewsWithClients && reviewsWithClients.length > 0) {
        const avg = reviewsWithClients.reduce((sum, review) => sum + review.rating, 0) / reviewsWithClients.length;
        setAvgRating(avg);
        setTotalReviews(reviewsWithClients.length);
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Calculate frequent tags
  const tagCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    (r.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Calificación General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(avgRating))}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"}
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter((r) => r.rating === stars).length;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-8">{stars}★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frequent Tags */}
          {topTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Lo que más destacan</p>
              <div className="flex flex-wrap gap-1.5">
                {topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium"
                  >
                    {tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Todas las Reseñas
          </CardTitle>
          <CardDescription>
            Lo que dicen tus clientes sobre tu trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.client.avatar_url || undefined} />
                        <AvatarFallback>
                          {review.client.full_name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {review.client.full_name || "Cliente"}
                        </p>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), "d 'de' MMMM, yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-12">
                      {review.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {review.comment && (
                    <p className="text-sm text-muted-foreground pl-12">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aún no tienes reseñas
              </h3>
              <p className="text-muted-foreground">
                Completa tus primeros trabajos para recibir reseñas de clientes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
