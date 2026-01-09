import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, useInView } from "motion/react";
import { SearchBar } from "@/components/SearchBar";
import { MovieCard } from "@/components/MovieCard";
import { MovieDetail } from "@/components/MovieDetail";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TrailerModal } from "@/components/TrailerModal";
import { useDebounce } from "@/hooks/useDebounce";
import {
  searchMovies,
  getPopularMovies,
  getLatestMovies,
  getTrendingMovies,
  getGenres,
  discoverMoviesByGenre,
  discoverAnime,
  discoverKDrama,
} from "@/services/tmdbApi";
import type { Movie, SortOption, Genre } from "@/types/movie";

// Special genre IDs for custom categories
const SPECIAL_GENRES = {
  ANIME: -1,
  KDRAMA: -2,
};

// Filter out movies that are planned/rumored or missing essential data
function filterReleasedMovies(movies: Movie[]): Movie[] {
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return movies.filter((movie) => {
    // Must have a poster image
    if (!movie.poster_path) return false;

    // Must have a release date
    if (!movie.release_date) return false;

    // Release date must not be more than 1 year in the future
    const releaseDate = new Date(movie.release_date);
    return releaseDate <= oneYearFromNow;
  });
}

// Separate component to avoid breaking Rules of Hooks
function MovieCardWithAnimation({
  movie,
  onClick,
}: {
  movie: Movie;
  onClick: (id: number) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });

  return (
    <div ref={ref} className='col-span-1'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3 }}>
        <MovieCard movie={movie} onClick={onClick} />
      </motion.div>
    </div>
  );
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [trailerMovieId, setTrailerMovieId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Track scroll position for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close genre dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(e.target as Node)
      ) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for similar movie clicks from MovieDetail
  useEffect(() => {
    const handleOpenMovieDetail = (e: CustomEvent<number>) => {
      setSelectedMovieId(e.detail);
    };
    window.addEventListener(
      "openMovieDetail",
      handleOpenMovieDetail as EventListener
    );
    return () =>
      window.removeEventListener(
        "openMovieDetail",
        handleOpenMovieDetail as EventListener
      );
  }, []);

  // Fetch trending movies for hero carousel (only recent releases)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const results = await getTrendingMovies("week");
        // Filter to only show movies from the last 2 years for the hero
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const recentTrending = filterReleasedMovies(results).filter((movie) => {
          if (!movie.release_date) return false;
          return new Date(movie.release_date) >= twoYearsAgo;
        });
        setTrendingMovies(recentTrending);
      } catch (err) {
        console.error("Failed to fetch trending movies:", err);
      }
    };
    fetchTrending();
  }, []);

  // Fetch genres on mount and add special categories
  useEffect(() => {
    const fetchGenres = async () => {
      const genreList = await getGenres();
      // Add special categories at the beginning
      const specialGenres: Genre[] = [
        { id: SPECIAL_GENRES.ANIME, name: "Anime" },
        { id: SPECIAL_GENRES.KDRAMA, name: "K-Drama" },
      ];
      setGenres([...specialGenres, ...genreList]);
    };
    fetchGenres();
  }, []);

  // Fetch movies based on search query or genre (resets on new search/genre)
  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      setPage(1);
      setHasMore(true);

      try {
        let results: Movie[];
        if (debouncedSearch.trim()) {
          results = await searchMovies(debouncedSearch, 1);
          // Filter by genre if one is selected
          if (selectedGenre === SPECIAL_GENRES.ANIME) {
            // Anime: Animation genre (16) + Japanese language
            results = results.filter(
              (m) => m.genre_ids.includes(16) && m.original_language === "ja"
            );
          } else if (selectedGenre === SPECIAL_GENRES.KDRAMA) {
            // K-Drama: Drama genre (18) + Korean language
            results = results.filter(
              (m) => m.genre_ids.includes(18) && m.original_language === "ko"
            );
          } else if (selectedGenre) {
            results = results.filter((m) =>
              m.genre_ids.includes(selectedGenre)
            );
          }
        } else if (selectedGenre === SPECIAL_GENRES.ANIME) {
          results = await discoverAnime(1);
        } else if (selectedGenre === SPECIAL_GENRES.KDRAMA) {
          results = await discoverKDrama(1);
        } else if (selectedGenre) {
          results = await discoverMoviesByGenre(selectedGenre, 1);
        } else if (sortBy === "release_date") {
          results = await getLatestMovies(1);
        } else {
          results = await getPopularMovies(1);
        }
        if (isMounted) {
          const filtered = filterReleasedMovies(results);
          setMovies(filtered);
          setHasMore(results.length >= 20);
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
  }, [debouncedSearch, selectedGenre, sortBy]);

  // Load more movies function
  const loadMoreMovies = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      let results: Movie[];
      if (debouncedSearch.trim()) {
        results = await searchMovies(debouncedSearch, nextPage);
        // Filter by genre if one is selected
        if (selectedGenre === SPECIAL_GENRES.ANIME) {
          results = results.filter(
            (m) => m.genre_ids.includes(16) && m.original_language === "ja"
          );
        } else if (selectedGenre === SPECIAL_GENRES.KDRAMA) {
          results = results.filter(
            (m) => m.genre_ids.includes(18) && m.original_language === "ko"
          );
        } else if (selectedGenre) {
          results = results.filter((m) => m.genre_ids.includes(selectedGenre));
        }
      } else if (selectedGenre === SPECIAL_GENRES.ANIME) {
        results = await discoverAnime(nextPage);
      } else if (selectedGenre === SPECIAL_GENRES.KDRAMA) {
        results = await discoverKDrama(nextPage);
      } else if (selectedGenre) {
        results = await discoverMoviesByGenre(selectedGenre, nextPage);
      } else if (sortBy === "release_date") {
        results = await getLatestMovies(nextPage);
      } else {
        results = await getPopularMovies(nextPage);
      }

      const filtered = filterReleasedMovies(results);
      if (filtered.length > 0) {
        setMovies((prev) => {
          // Filter out duplicates
          const existingIds = new Set(prev.map((m) => m.id));
          const newMovies = filtered.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMovies];
        });
        setPage(nextPage);
        setHasMore(results.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more movies:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, debouncedSearch, selectedGenre, sortBy]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreMovies();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadingMore, loadMoreMovies]);

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
    <div className='min-h-screen'>
      {/* Top Navigation Bar */}
      <nav
        className='fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 transition-all duration-500 ease-out'
        style={{
          background: isScrolled ? "rgba(10, 10, 10, 0.95)" : "transparent",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(20px)" : "none",
          borderBottom: isScrolled
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid transparent",
        }}>
        <div className='max-w-[1800px] mx-auto flex items-center justify-between gap-4'>
          {/* Logo */}
          <div className='flex items-center gap-8'>
            <button
              onClick={() => {
                setSearchQuery("");
                setSortBy("popularity");
                setSelectedGenre(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className='text-xl md:text-2xl font-bold gradient-text whitespace-nowrap hover:opacity-80 transition-opacity'>
              MovieFinder
            </button>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center gap-1'>
              {[
                { value: "popularity" as SortOption, label: "Popular" },
                { value: "release_date" as SortOption, label: "Latest" },
              ].map((option) => {
                const isActive = sortBy === option.value && !selectedGenre;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setSelectedGenre(null);
                    }}
                    className='px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300'
                    style={{
                      background: isActive
                        ? "var(--color-accent)"
                        : "transparent",
                      color: isActive ? "#000" : "var(--color-text-muted)",
                    }}>
                    {option.label}
                  </button>
                );
              })}

              {/* Genre Dropdown */}
              <div className='relative' ref={genreDropdownRef}>
                <button
                  onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                  className='px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2'
                  style={{
                    background: selectedGenre
                      ? "var(--color-accent)"
                      : "transparent",
                    color: selectedGenre ? "#000" : "var(--color-text-muted)",
                  }}>
                  {selectedGenre
                    ? genres.find((g) => g.id === selectedGenre)?.name
                    : "Genre"}
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      genreDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>
                {genreDropdownOpen && (
                  <div
                    className='absolute top-full left-0 mt-2 py-2 rounded-lg min-w-[160px] max-h-[300px] overflow-y-auto z-50 scrollbar-thin'
                    style={{
                      background: "rgba(20, 20, 20, 0.95)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    }}>
                    <button
                      onClick={() => {
                        setSelectedGenre(null);
                        setGenreDropdownOpen(false);
                      }}
                      className='w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10'
                      style={{
                        color: !selectedGenre
                          ? "var(--color-accent)"
                          : "var(--color-text)",
                      }}>
                      All Genres
                    </button>
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => {
                          setSelectedGenre(genre.id);
                          setGenreDropdownOpen(false);
                        }}
                        className='w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10'
                        style={{
                          color:
                            selectedGenre === genre.id
                              ? "var(--color-accent)"
                              : "var(--color-text)",
                        }}>
                        {genre.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className='flex-1 max-w-xl hidden md:block'>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder='Search for movies...'
            />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='md:hidden w-10 h-10 flex items-center justify-center rounded-lg'
            style={{
              background: "rgba(255, 255, 255, 0.1)",
            }}
            aria-label='Toggle menu'>
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='white'
              viewBox='0 0 24 24'>
              {mobileMenuOpen ? (
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              ) : (
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className='md:hidden mt-4 pb-4 border-t border-white/10 pt-4'>
            {/* Mobile Search */}
            <div className='mb-4'>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder='Search for movies...'
              />
            </div>

            {/* Mobile Sort Options */}
            <div className='flex gap-2 mb-3'>
              {[
                { value: "popularity" as SortOption, label: "Popular" },
                { value: "release_date" as SortOption, label: "Latest" },
              ].map((option) => {
                const isActive = sortBy === option.value && !selectedGenre;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setSelectedGenre(null);
                      setMobileMenuOpen(false);
                    }}
                    className='flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all'
                    style={{
                      background: isActive
                        ? "var(--color-accent)"
                        : "rgba(255, 255, 255, 0.1)",
                      color: isActive ? "#000" : "var(--color-text-muted)",
                    }}>
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Genre Dropdown */}
            <div className='relative'>
              <button
                onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                className='w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between'
                style={{
                  background: selectedGenre
                    ? "var(--color-accent)"
                    : "rgba(255, 255, 255, 0.1)",
                  color: selectedGenre ? "#000" : "var(--color-text-muted)",
                }}>
                {selectedGenre
                  ? genres.find((g) => g.id === selectedGenre)?.name
                  : "All Genres"}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    genreDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>
              {genreDropdownOpen && (
                <div
                  className='absolute top-full left-0 right-0 mt-2 py-2 rounded-lg max-h-[250px] overflow-y-auto z-50 scrollbar-thin'
                  style={{
                    background: "rgba(20, 20, 20, 0.95)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  }}>
                  <button
                    onClick={() => {
                      setSelectedGenre(null);
                      setGenreDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className='w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10'
                    style={{
                      color: !selectedGenre
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                    }}>
                    All Genres
                  </button>
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => {
                        setSelectedGenre(genre.id);
                        setGenreDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className='w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10'
                      style={{
                        color:
                          selectedGenre === genre.id
                            ? "var(--color-accent)"
                            : "var(--color-text)",
                      }}>
                      {genre.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content Area */}
      <main>
        {/* Hero Carousel - Only show when not searching */}
        {!searchQuery && trendingMovies.length > 0 && (
          <div className='relative'>
            {/* Subtle gradient at top for contrast behind nav */}
            <div
              className='absolute inset-0 z-10 pointer-events-none'
              style={{
                background:
                  "linear-gradient(to bottom, rgba(10, 10, 10, 0.5) 0%, transparent 40%)",
              }}
            />
            <HeroCarousel
              movies={trendingMovies}
              onMovieClick={setSelectedMovieId}
              onTrailerClick={setTrailerMovieId}
            />
          </div>
        )}

        {/* Movies Section */}
        <div
          className={`px-4 md:px-8 lg:px-16 ${
            searchQuery ? "pt-28 pb-12" : "pb-12"
          }`}>
          <div className='max-w-[1800px] mx-auto'>
            {/* Section Header */}
            {!loading && !error && sortedMovies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-8'>
                <h2
                  className='text-2xl md:text-3xl font-bold'
                  style={{ color: "var(--color-text)" }}>
                  {searchQuery
                    ? selectedGenre
                      ? `"${searchQuery}" in ${
                          genres.find((g) => g.id === selectedGenre)?.name
                        }`
                      : `Search Results for "${searchQuery}"`
                    : selectedGenre
                    ? `${
                        genres.find((g) => g.id === selectedGenre)?.name
                      } Movies`
                    : sortBy === "release_date"
                    ? "Recent Releases"
                    : "Popular Movies"}
                </h2>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className='modern-card overflow-hidden animate-pulse'>
                    <div
                      className='aspect-[2/3]'
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    />
                    <div className='p-4 space-y-3'>
                      <div
                        className='h-4 rounded w-3/4'
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                      />
                      <div
                        className='h-3 rounded w-1/2'
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className='text-center py-20'>
                <div className='modern-card p-12 inline-block max-w-xl'>
                  <div
                    className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
                    style={{ backgroundColor: "rgba(220, 38, 38, 0.1)" }}>
                    <svg
                      className='w-8 h-8'
                      fill='none'
                      stroke='var(--color-red)'
                      viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <h3
                    className='text-2xl font-bold mb-2'
                    style={{ color: "var(--color-text)" }}>
                    Error
                  </h3>
                  <p
                    className='text-lg mb-4'
                    style={{ color: "var(--color-red)" }}>
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
                  <div className='text-center py-20'>
                    <div className='modern-card p-12 inline-block max-w-xl'>
                      <div
                        className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
                        style={{ backgroundColor: "rgba(212, 175, 55, 0.1)" }}>
                        <svg
                          className='w-8 h-8'
                          fill='none'
                          stroke='var(--color-accent)'
                          viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z'
                          />
                        </svg>
                      </div>
                      <h3
                        className='text-2xl font-bold mb-2'
                        style={{ color: "var(--color-text)" }}>
                        No movies found
                      </h3>
                      <p style={{ color: "var(--color-text-muted)" }}>
                        Try a different search term
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'>
                      {sortedMovies.map((movie) => (
                        <MovieCardWithAnimation
                          key={movie.id}
                          movie={movie}
                          onClick={setSelectedMovieId}
                        />
                      ))}
                    </div>

                    {/* Infinite scroll trigger */}
                    <div ref={loadMoreRef} className='w-full py-8'>
                      {loadingMore && (
                        <div className='flex justify-center'>
                          <div className='flex items-center gap-3'>
                            <div
                              className='w-6 h-6 border-2 border-t-transparent rounded-full animate-spin'
                              style={{
                                borderColor: "var(--color-accent)",
                                borderTopColor: "transparent",
                              }}
                            />
                            <span style={{ color: "var(--color-text-muted)" }}>
                              Loading more movies...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Movie Detail Modal */}
      <MovieDetail
        movieId={selectedMovieId}
        isOpen={selectedMovieId !== null}
        onClose={() => setSelectedMovieId(null)}
      />

      {/* Trailer Modal */}
      <TrailerModal
        movieId={trailerMovieId}
        isOpen={trailerMovieId !== null}
        onClose={() => setTrailerMovieId(null)}
      />
    </div>
  );
}

export default App;
