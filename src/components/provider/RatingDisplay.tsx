import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export const RatingDisplay = ({
  rating,
  totalReviews,
  size = "md",
  showNumber = true,
}: RatingDisplayProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (rating === 0 || !rating) {
    return (
      <span className={`text-muted-foreground ${textSizeClasses[size]}`}>
        Sin calificación
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      {showNumber && (
        <span className={`font-medium ${textSizeClasses[size]}`}>
          {rating.toFixed(1)}
          {totalReviews !== undefined && (
            <span className="text-muted-foreground ml-1">
              ({totalReviews})
            </span>
          )}
        </span>
      )}
    </div>
  );
};
