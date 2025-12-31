import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MovieDetails } from '@/types/movie';
import { getMovieDetails, getImageUrl } from '@/services/tmdbApi';

interface MovieDetailProps {
  movieId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MovieDetail({ movieId, isOpen, onClose }: MovieDetailProps) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId || !isOpen) return;

    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMovieDetails(movieId);
        setMovie(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-white/20 text-white">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {movie && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop Image */}
            {movie.backdrop_path && (
              <div className="relative -mx-6 -mt-6 mb-6 h-64 overflow-hidden rounded-t-lg">
                <img
                  src={getImageUrl(movie.backdrop_path, 'w1280')}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
            )}

            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-white">
                {movie.title}
              </DialogTitle>
              {movie.tagline && (
                <p className="text-gray-300 italic mt-2">{movie.tagline}</p>
              )}
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Movie Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white font-semibold">
                      {movie.vote_average.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({movie.vote_count.toLocaleString()})
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Release Date</p>
                  <p className="text-white font-semibold mt-1">
                    {new Date(movie.release_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {movie.runtime && (
                  <div>
                    <p className="text-gray-400 text-sm">Runtime</p>
                    <p className="text-white font-semibold mt-1">
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-white font-semibold mt-1">{movie.status}</p>
                </div>
              </div>

              {/* Genres */}
              {movie.genres.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white border border-white/20"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Overview</p>
                <p className="text-white leading-relaxed">{movie.overview}</p>
              </div>

              {/* Budget & Revenue */}
              {(movie.budget > 0 || movie.revenue > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {movie.budget > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm">Budget</p>
                      <p className="text-white font-semibold mt-1">
                        ${movie.budget.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {movie.revenue > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm">Revenue</p>
                      <p className="text-white font-semibold mt-1">
                        ${movie.revenue.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Production Companies */}
              {movie.production_companies.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Production Companies</p>
                  <div className="flex flex-wrap gap-3">
                    {movie.production_companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                      >
                        {company.logo_path && (
                          <img
                            src={getImageUrl(company.logo_path, 'w200')}
                            alt={company.name}
                            className="h-6 object-contain"
                          />
                        )}
                        <span className="text-white text-sm">{company.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
