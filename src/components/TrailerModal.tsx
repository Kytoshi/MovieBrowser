import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHiddenTitle, DialogHiddenDescription } from "@/components/ui/dialog";
import { getMovieVideos } from "@/services/tmdbApi";
import type { MovieVideo } from "@/types/movie";

interface TrailerModalProps {
  movieId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TrailerModal({ movieId, isOpen, onClose }: TrailerModalProps) {
  const [trailer, setTrailer] = useState<MovieVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId || !isOpen) return;

    const fetchTrailer = async () => {
      setLoading(true);
      setError(null);

      try {
        const videos = await getMovieVideos(movieId);
        if (videos && videos.results.length > 0) {
          // Prioritize official trailers, then teasers, then any YouTube video
          const officialTrailer = videos.results.find(
            (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
          );
          const anyTrailer = videos.results.find(
            (v) => v.site === "YouTube" && v.type === "Trailer"
          );
          const teaser = videos.results.find(
            (v) => v.site === "YouTube" && v.type === "Teaser"
          );
          const anyVideo = videos.results.find((v) => v.site === "YouTube");

          setTrailer(officialTrailer || anyTrailer || teaser || anyVideo || null);
        } else {
          setError("No trailer available for this movie.");
        }
      } catch {
        setError("Failed to load trailer.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrailer();
  }, [movieId, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTrailer(null);
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-5xl w-[90vw] p-0 border-none overflow-hidden bg-black"
        style={{ aspectRatio: "16/9" }}
      >
        <DialogHiddenTitle>Movie Trailer</DialogHiddenTitle>
        <DialogHiddenDescription>Watch the movie trailer</DialogHiddenDescription>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
                <p className="text-white/70">Loading trailer...</p>
              </div>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black"
            >
              <div className="text-center px-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(212, 175, 55, 0.1)" }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="var(--color-accent)" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-white text-lg mb-2">No Trailer Available</p>
                <p className="text-white/50">{error}</p>
              </div>
            </motion.div>
          )}

          {trailer && !loading && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-black"
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={trailer.name}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          aria-label="Close trailer"
        >
          <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </DialogContent>
    </Dialog>
  );
}
