import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { MovieCard } from '@/components/MovieCard';
import { FilterSort } from '@/components/FilterSort';
import { MovieDetail } from '@/components/MovieDetail';
import { useDebounce } from '@/hooks/useDebounce';
import { searchMovies, getPopularMovies } from '@/services/tmdbApi';
import type { Movie, SortOption } from '@/types/movie';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch movies based on search query
  useEffect(() => {
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
        setMovies(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch movies');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [debouncedSearch]);

  // Sort movies
  const sortedMovies = [...movies].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.vote_average - a.vote_average;
      case 'release_date':
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      case 'popularity':
      default:
        return b.popularity - a.popularity;
    }
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            🎬 Movie Browser
          </h1>
          <p className="text-gray-300 text-lg">
            Discover your next favorite movie
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search for movies..."
          />
        </div>

        {/* Filter/Sort */}
        <div className="mb-8">
          <FilterSort sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 text-lg">{error}</p>
            <p className="text-gray-400 mt-2">Please check your API key in .env.local</p>
          </div>
        )}

        {/* Movies Grid */}
        {!loading && !error && (
          <>
            {sortedMovies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-300 text-lg">No movies found</p>
                <p className="text-gray-400 mt-2">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
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
