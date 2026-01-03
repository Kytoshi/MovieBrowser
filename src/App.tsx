import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useInView } from "motion/react";
import { SearchBar } from "@/components/SearchBar";
import { MovieCard } from "@/components/MovieCard";
import { MovieDetail } from "@/components/MovieDetail";
import { useDebounce } from "@/hooks/useDebounce";
import {
  searchMovies,
  getPopularMovies,
  getImageUrl,
} from "@/services/tmdbApi";
import type { Movie, SortOption } from "@/types/movie";

// Separate component to avoid breaking Rules of Hooks
function MovieCardWithAnimation({
  movie,
  index,
  onClick,
}: {
  movie: Movie;
  index: number;
  onClick: (id: number) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ delay: (index % 6) * 0.1, duration: 0.5 }}
      className="col-span-1"
    >
      <MovieCard movie={movie} onClick={onClick} />
    </motion.div>
  );
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popularity");

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch movies based on search query
  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);

      try {
        let results: Movie[];
        if (debouncedSearch.trim()) {
          results = await searchMovies(debouncedSearch);
        } else {
          results = await getPopularMovies();
        }
        if (isMounted) {
          setMovies(results);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch movies"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovies();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // Sort movies with memoization
  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.vote_average - a.vote_average;
        case "release_date": {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        }
        case "popularity":
        default:
          return b.popularity - a.popularity;
      }
    });
  }, [movies, sortBy]);

  return (
    <div className="min-h-screen">
      {/* Sidebar Navigation */}
      <div
        className="fixed left-0 top-0 bottom-0 w-20 md:w-64 modern-card sidebar-card m-4 p-4 md:p-6 flex flex-col gap-6 z-20"
        style={{ borderRadius: "2rem" }}
      >
        {/* Logo/Title */}
        <div>
          <h1 className="hidden md:block text-2xl font-bold gradient-text mb-1">
            MovieFinder
          </h1>
          <h1 className="md:hidden text-2xl font-bold gradient-text text-center">
            MF
          </h1>
          <p
            className="hidden md:block text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Discover films
          </p>
        </div>

        {/* Search Results Count - Only show when searching */}
        {searchQuery && (
          <div className="modern-card sidebar-card p-3 md:p-4">
            <p
              className="hidden md:block text-xs font-semibold mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              RESULTS
            </p>
            <p
              className="text-xl md:text-2xl font-bold text-center md:text-left"
              style={{ color: "var(--color-accent)" }}
            >
              {movies.length}
            </p>
          </div>
        )}

        {/* Filter/Sort - Vertical */}
        <div className="flex-1 flex flex-col gap-2">
          <p
            className="hidden md:block text-xs font-bold mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            SORT BY
          </p>
          {[
            {
              value: "popularity" as SortOption,
              label: "Pop",
              fullLabel: "Popular",
            },
            {
              value: "rating" as SortOption,
              label: "Top",
              fullLabel: "Top Rated",
            },
            {
              value: "release_date" as SortOption,
              label: "New",
              fullLabel: "Latest",
            },
          ].map((option) => {
            const isActive = sortBy === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className="modern-button py-3 text-sm font-semibold transition-all"
                style={{
                  background: isActive ? "var(--color-accent)" : "transparent",
                  color: isActive ? "#000" : "var(--color-text)",
                  boxShadow: isActive
                    ? "0 4px 6px -1px rgba(212, 175, 55, 0.4)"
                    : "none",
                }}
              >
                <span className="md:hidden">{option.label}</span>
                <span className="hidden md:inline">{option.fullLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ml-24 md:ml-72 px-4 md:px-8 py-8">
        {/* Search Bar - Top Right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search for movies..."
          />
        </motion.div>

        {/* Hero Featured Movie */}
        {!loading && !error && sortedMovies.length > 0 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-16"
          >
            <div
              className="modern-card overflow-hidden cursor-pointer group relative"
              onClick={() => setSelectedMovieId(sortedMovies[0].id)}
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Side */}
                <div className="relative h-[400px] md:h-[500px] overflow-hidden">
                  <img
                    src={getImageUrl(
                      sortedMovies[0].backdrop_path ||
                        sortedMovies[0].poster_path,
                      "original"
                    )}
                    alt={sortedMovies[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#141414]/30 to-[#141414]/95" />
                </div>

                {/* Content Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div
                    className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 self-start"
                    style={{
                      background: "rgba(212, 175, 55, 0.9)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 4px 16px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                      color: "#000",
                    }}
                  >
                    Featured Movie
                  </div>
                  <h2
                    className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                    style={{ color: "var(--color-text)" }}
                  >
                    {sortedMovies[0].title}
                  </h2>
                  <p
                    className="text-lg mb-6 line-clamp-4"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {sortedMovies[0].overview}
                  </p>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="var(--color-accent)"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span
                        className="text-xl font-bold"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {sortedMovies[0].vote_average?.toFixed(1)}
                      </span>
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {sortedMovies[0].release_date
                        ? new Date(sortedMovies[0].release_date).getFullYear()
                        : "N/A"}
                    </div>
                  </div>
                  <button className="modern-button px-8 py-4 inline-flex items-center gap-2 self-start">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="modern-card overflow-hidden animate-pulse"
              >
                <div
                  className="aspect-[2/3]"
                  style={{ backgroundColor: "#0A0A0A" }}
                />
                <div className="p-5 space-y-3">
                  <div
                    className="h-4 rounded w-3/4"
                    style={{ backgroundColor: "#0A0A0A" }}
                  />
                  <div
                    className="h-3 rounded w-1/2"
                    style={{ backgroundColor: "#0A0A0A" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="modern-card p-12 inline-block max-w-xl">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "rgba(229, 115, 115, 0.1)" }}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="var(--color-red)"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Error
              </h3>
              <p className="text-lg mb-4" style={{ color: "var(--color-red)" }}>
                {error}
              </p>
              <p style={{ color: "var(--color-text-muted)" }}>
                Please check your configuration
              </p>
            </div>
          </div>
        )}

        {/* Movies Grid */}
        {!loading && !error && (
          <>
            {sortedMovies.length === 0 ? (
              <div className="text-center py-20">
                <div className="modern-card p-12 inline-block max-w-xl">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "rgba(212, 175, 55, 0.1)" }}
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="var(--color-accent)"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <h3
                    className="text-2xl font-bold mb-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    No movies found
                  </h3>
                  <p style={{ color: "var(--color-text-muted)" }}>
                    Try a different search term
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedMovies.slice(searchQuery ? 0 : 1).map((movie, index) => (
                  <MovieCardWithAnimation
                    key={movie.id}
                    movie={movie}
                    index={index}
                    onClick={setSelectedMovieId}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Movie Detail Modal */}
        <MovieDetail
          movieId={selectedMovieId}
          isOpen={selectedMovieId !== null}
          onClose={() => setSelectedMovieId(null)}
        />
      </div>
    </div>
  );
}

export default App;
