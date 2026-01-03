import { motion } from "motion/react";
import type { Movie } from "@/types/movie";
import { getImageUrl } from "@/services/tmdbApi";

interface MovieCardProps {
  movie: Movie;
  onClick: (id: number) => void;
  className?: string;
}

export function MovieCard({ movie, onClick, className }: MovieCardProps) {
  const posterUrl = getImageUrl(movie.poster_path, "w500");
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";
  const rating =
    movie.vote_average != null ? movie.vote_average.toFixed(1) : "N/A";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(movie.id);
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onClick(movie.id)}
      onKeyDown={handleKeyDown}
      className={`modern-card cursor-pointer group overflow-hidden ${
        className || ""
      }`}
    >
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={posterUrl}
          alt={movie.title || "Movie poster"}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getImageUrl(null, "w500");
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating Badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold text-sm"
          style={{
            background: "rgba(212, 175, 55, 0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 4px 16px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            color: "#000",
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {rating}
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(212, 175, 55, 0.9)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(212, 175, 55, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <svg className="w-6 h-6 ml-1" fill="#000" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-5">
        <h3
          className="font-bold text-base mb-2 line-clamp-2 leading-tight h-10"
          style={{ color: "var(--color-text)" }}
        >
          {movie.title}
        </h3>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            {year}
          </span>
          {movie.vote_count && (
            <span
              className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{
                background: "rgba(212, 175, 55, 0.9)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 2px 8px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                color: "#000",
              }}
            >
              {movie.vote_count} votes
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
