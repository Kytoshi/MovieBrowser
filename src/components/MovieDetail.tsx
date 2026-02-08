import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogHiddenDescription,
} from "@/components/ui/dialog";
import type { MovieDetails, Movie, WatchProviderRegion, MovieVideo, CastMember, CrewMember, CollectionDetails } from "@/types/movie";
import { getMovieDetails, getImageUrl, getSimilarMovies, getWatchProviders, getMovieVideos, getMovieCredits, getCollectionDetails } from "@/services/tmdbApi";

interface MovieDetailProps {
  movieId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MovieDetail({ movieId, isOpen, onClose }: MovieDetailProps) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [collectionMovies, setCollectionMovies] = useState<Movie[]>([]);
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProviderRegion | null>(null);
  const [trailer, setTrailer] = useState<MovieVideo | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [director, setDirector] = useState<CrewMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!movieId || !isOpen) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      setShowTrailer(false);
      setCollectionMovies([]);
      setCollectionName(null);

      try {
        // Fetch all data in parallel
        const [movieData, similar, providers, videos, credits] = await Promise.all([
          getMovieDetails(movieId),
          getSimilarMovies(movieId),
          getWatchProviders(movieId),
          getMovieVideos(movieId),
          getMovieCredits(movieId),
        ]);

        setMovie(movieData);
        setSimilarMovies(similar.slice(0, 10));

        // Fetch collection if movie belongs to one
        if (movieData.belongs_to_collection) {
          const collection = await getCollectionDetails(movieData.belongs_to_collection.id);
          if (collection) {
            // Filter out current movie and sort by release date
            const otherMovies = collection.parts
              .filter((m) => m.id !== movieId)
              .sort((a, b) => {
                const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
                const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
                return dateA - dateB;
              });
            setCollectionMovies(otherMovies);
            setCollectionName(collection.name);
          }
        }

        // Get US watch providers
        if (providers?.results?.US) {
          setWatchProviders(providers.results.US);
        } else {
          setWatchProviders(null);
        }

        // Find best trailer
        if (videos?.results) {
          const officialTrailer = videos.results.find(
            (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
          );
          const anyTrailer = videos.results.find(
            (v) => v.site === "YouTube" && v.type === "Trailer"
          );
          const teaser = videos.results.find(
            (v) => v.site === "YouTube" && v.type === "Teaser"
          );
          setTrailer(officialTrailer || anyTrailer || teaser || null);
        }

        // Get top cast and director
        if (credits) {
          setCast(credits.cast.slice(0, 6));
          const directorCredit = credits.crew.find((c) => c.job === "Director");
          setDirector(directorCredit || null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load movie details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [movieId, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setShowTrailer(false);
    }
  };

  const handleSimilarMovieClick = (id: number) => {
    // This will trigger a re-fetch with the new movie ID
    onClose();
    // Small delay to allow modal to close before reopening
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openMovieDetail', { detail: id }));
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] border-none text-white p-0 overflow-y-auto rounded-2xl"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
              <p className="text-white/70">Loading movie details...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {movie && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col w-full"
          >
            {/* Backdrop Image / Trailer */}
            {showTrailer && trailer ? (
              <div className="w-full bg-black">
                {/* Expanded Trailer Container */}
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title={trailer.name}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                </div>
                {/* Back to details button below video */}
                <button
                  onClick={() => setShowTrailer(false)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors"
                  style={{ background: "rgba(255, 255, 255, 0.05)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Back to details
                </button>
              </div>
            ) : (
              <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ height: "clamp(250px, 40vh, 384px)", minWidth: "100%" }}>
                <img
                  src={getImageUrl(movie.backdrop_path || movie.poster_path, "w1280")}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />

                {/* Play Trailer Button */}
                {trailer && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setShowTrailer(true)}
                      className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                      style={{
                        background: "rgba(212, 175, 55, 0.9)",
                        backdropFilter: "blur(12px)",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: "0 8px 32px rgba(212, 175, 55, 0.5)",
                      }}
                    >
                      <svg className="w-8 h-8 ml-1 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 md:px-10 py-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-3xl md:text-4xl font-bold text-white">
                  {movie.title}
                </DialogTitle>
                <DialogHiddenDescription>
                  {movie.overview ? movie.overview.slice(0, 150) : `Details for ${movie.title}`}
                </DialogHiddenDescription>
                {movie.tagline && (
                  <p className="text-white/60 italic mt-2 text-lg">
                    "{movie.tagline}"
                  </p>
                )}
              </DialogHeader>

              <div className="space-y-8">
                {/* Quick Info Row */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(212, 175, 55, 0.2)" }}>
                    <svg className="w-5 h-5" fill="var(--color-accent)" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                      {movie.vote_average.toFixed(1)}
                    </span>
                    <span className="text-white/50 text-sm">({movie.vote_count.toLocaleString()})</span>
                  </div>

                  <span className="text-white/70">
                    {new Date(movie.release_date).getFullYear()}
                  </span>

                  {movie.runtime && (
                    <span className="text-white/70">
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </span>
                  )}

                  <span className="px-3 py-1 rounded-full text-sm" style={{ background: "rgba(255, 255, 255, 0.1)" }}>
                    {movie.status}
                  </span>
                </div>

                {/* Director */}
                {director && (
                  <div>
                    <p className="text-white/50 text-sm mb-1">Directed by</p>
                    <p className="text-white font-semibold">{director.name}</p>
                  </div>
                )}

                {/* Genres */}
                {movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-4 py-2 rounded-full text-sm font-medium"
                        style={{
                          background: "rgba(212, 175, 55, 0.15)",
                          border: "1px solid rgba(212, 175, 55, 0.3)",
                          color: "var(--color-accent)",
                        }}
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
                  <p className="text-white/80 leading-relaxed">
                    {movie.overview}
                  </p>
                </div>

                {/* Cast */}
                {cast.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Top Cast</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                      {cast.map((member) => (
                        <div key={member.id} className="flex-shrink-0 w-28 text-center">
                          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-2 bg-white/10">
                            {member.profile_path ? (
                              <img
                                src={getImageUrl(member.profile_path, "w200")}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-white text-sm font-medium line-clamp-2 leading-tight">{member.name}</p>
                          <p className="text-white/50 text-xs truncate mt-1">{member.character}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Streaming Providers */}
                {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
                  <div className="modern-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Where to Watch</h3>

                    {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                      <div className="mb-4">
                        <p className="text-white/50 text-sm mb-2">Stream</p>
                        <div className="flex flex-wrap gap-3">
                          {watchProviders.flatrate.map((provider) => (
                            <div
                              key={provider.provider_id}
                              className="w-12 h-12 rounded-lg overflow-hidden bg-white/10"
                              title={provider.provider_name}
                            >
                              <img
                                src={getImageUrl(provider.logo_path, "w200")}
                                alt={provider.provider_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {watchProviders.rent && watchProviders.rent.length > 0 && (
                      <div className="mb-4">
                        <p className="text-white/50 text-sm mb-2">Rent</p>
                        <div className="flex flex-wrap gap-3">
                          {watchProviders.rent.slice(0, 6).map((provider) => (
                            <div
                              key={provider.provider_id}
                              className="w-12 h-12 rounded-lg overflow-hidden bg-white/10"
                              title={provider.provider_name}
                            >
                              <img
                                src={getImageUrl(provider.logo_path, "w200")}
                                alt={provider.provider_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {watchProviders.buy && watchProviders.buy.length > 0 && (
                      <div>
                        <p className="text-white/50 text-sm mb-2">Buy</p>
                        <div className="flex flex-wrap gap-3">
                          {watchProviders.buy.slice(0, 6).map((provider) => (
                            <div
                              key={provider.provider_id}
                              className="w-12 h-12 rounded-lg overflow-hidden bg-white/10"
                              title={provider.provider_name}
                            >
                              <img
                                src={getImageUrl(provider.logo_path, "w200")}
                                alt={provider.provider_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* JustWatch Attribution */}
                    <p className="text-white/30 text-xs mt-4">
                      Streaming data provided by{" "}
                      <a
                        href={watchProviders.link || "https://www.justwatch.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-white/50"
                      >
                        JustWatch
                      </a>
                    </p>
                  </div>
                )}

                {/* Budget & Revenue */}
                {(movie.budget > 0 || movie.revenue > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {movie.budget > 0 && (
                      <div className="modern-card p-4">
                        <p className="text-white/50 text-sm">Budget</p>
                        <p className="text-white font-bold text-xl mt-1">
                          ${(movie.budget / 1000000).toFixed(0)}M
                        </p>
                      </div>
                    )}
                    {movie.revenue > 0 && (
                      <div className="modern-card p-4">
                        <p className="text-white/50 text-sm">Box Office</p>
                        <p className="text-white font-bold text-xl mt-1" style={{ color: "var(--color-accent)" }}>
                          ${(movie.revenue / 1000000).toFixed(0)}M
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Collection / Franchise Movies */}
                {collectionMovies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      More From {collectionName || "This Series"}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin">
                      {collectionMovies.map((collectionMovie) => (
                        <div
                          key={collectionMovie.id}
                          onClick={() => handleSimilarMovieClick(collectionMovie.id)}
                          className="flex-shrink-0 w-32 cursor-pointer group"
                        >
                          <div className="relative overflow-hidden rounded-xl mb-2">
                            <img
                              src={getImageUrl(collectionMovie.poster_path, "w300")}
                              alt={collectionMovie.title}
                              className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                              <svg
                                className="w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                fill="var(--color-accent)"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                              </svg>
                            </div>
                            {/* Rating Badge */}
                            {collectionMovie.vote_average > 0 && (
                              <div
                                className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold"
                                style={{
                                  background: "rgba(212, 175, 55, 0.9)",
                                  color: "#000",
                                }}
                              >
                                {collectionMovie.vote_average.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <p className="text-white text-sm font-medium truncate">
                            {collectionMovie.title}
                          </p>
                          <p className="text-white/50 text-xs">
                            {collectionMovie.release_date ? new Date(collectionMovie.release_date).getFullYear() : "TBA"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Similar Movies */}
                {similarMovies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">You May Also Like</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin">
                      {similarMovies.map((similarMovie) => (
                        <div
                          key={similarMovie.id}
                          onClick={() => handleSimilarMovieClick(similarMovie.id)}
                          className="flex-shrink-0 w-32 cursor-pointer group"
                        >
                          <div className="relative overflow-hidden rounded-xl mb-2">
                            <img
                              src={getImageUrl(similarMovie.poster_path, "w300")}
                              alt={similarMovie.title}
                              className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                              <svg
                                className="w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                fill="var(--color-accent)"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                              </svg>
                            </div>
                            {/* Rating Badge */}
                            <div
                              className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold"
                              style={{
                                background: "rgba(212, 175, 55, 0.9)",
                                color: "#000",
                              }}
                            >
                              {similarMovie.vote_average.toFixed(1)}
                            </div>
                          </div>
                          <p className="text-white text-sm font-medium truncate">
                            {similarMovie.title}
                          </p>
                          <p className="text-white/50 text-xs">
                            {similarMovie.release_date ? new Date(similarMovie.release_date).getFullYear() : "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Production Companies */}
                {movie.production_companies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Production</h3>
                    <div className="flex flex-wrap gap-4">
                      {movie.production_companies.slice(0, 4).map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg"
                          style={{ background: "rgba(255, 255, 255, 0.05)" }}
                        >
                          {company.logo_path && (
                            <img
                              src={getImageUrl(company.logo_path, "w200")}
                              alt={company.name}
                              className="h-6 object-contain brightness-0 invert opacity-70"
                            />
                          )}
                          <span className="text-white/70 text-sm">{company.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Padding */}
              <div className="h-8" />
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
