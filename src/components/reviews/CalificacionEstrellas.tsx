import { Star } from "lucide-react";

interface CalificacionEstrellasProps {
  calificacion: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onCalificacionChange?: (calificacion: number) => void;
}

export function CalificacionEstrellas({
  calificacion,
  totalReviews,
  size = "md",
  interactive = false,
  onCalificacionChange
}: CalificacionEstrellasProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const handleStarClick = (rating: number) => {
    if (interactive && onCalificacionChange) {
      onCalificacionChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= calificacion
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => handleStarClick(star)}
          />
        ))}
      </div>
      
      {calificacion > 0 && (
        <span className="text-sm font-medium text-foreground ml-1">
          {calificacion.toFixed(1)}
        </span>
      )}
      
      {totalReviews !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">
          ({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})
        </span>
      )}
    </div>
  );
}