import type {
  Movie,
  MovieDetails,
  MovieSearchResponse,
  WatchProviders,
  MovieVideos,
  MovieCredits,
  Genre,
} from "@/types/movie";

// TMDB API Configuration
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

/**
 * Get the full URL for a movie poster or backdrop image
 * @param path - The image path from TMDB API
 * @param size - Image size (w200, w300, w500, original, etc.)
 * @returns Full image URL or fallback placeholder
 */
export function getImageUrl(
  path: string | null,
  size: string = "w500"
): string {
  if (!path) {
    return `https://via.placeholder.com/500x750/1a1a2e/eee?text=No+Image`;
  }
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Search for movies by title
 * @param query - Search query string
 * @param page - Page number for pagination
 * @returns Array of movies matching the search
 */
export async function searchMovies(
  query: string,
  page: number = 1
): Promise<Movie[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&page=${page}&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error searching movies:", error);
    throw new Error(
      "Failed to search movies. Please check your API key and try again."
    );
  }
}

/**
 * Get popular movies
 * @param page - Page number for pagination
 * @returns Array of popular movies
 */
export async function getPopularMovies(page: number = 1): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    throw new Error(
      "Failed to fetch popular movies. Please check your API key and try again."
    );
  }
}

/**
 * Get detailed information about a specific movie
 * @param id - Movie ID
 * @returns Detailed movie information
 */
export async function getMovieDetails(id: number): Promise<MovieDetails> {
  try {
    const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieDetails = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw new Error("Failed to fetch movie details. Please try again.");
  }
}

/**
 * Get similar movies for a specific movie
 * @param id - Movie ID
 * @param page - Page number for pagination
 * @returns Array of similar movies
 */
export async function getSimilarMovies(
  id: number,
  page: number = 1
): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}&page=${page}&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    return [];
  }
}

/**
 * Get watch providers (streaming, rent, buy) for a movie
 * @param id - Movie ID
 * @returns Watch provider information by region
 */
export async function getWatchProviders(
  id: number
): Promise<WatchProviders | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/watch/providers?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: WatchProviders = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching watch providers:", error);
    return null;
  }
}

/**
 * Get videos (trailers, teasers, etc.) for a movie
 * @param id - Movie ID
 * @returns Video information including YouTube keys
 */
export async function getMovieVideos(id: number): Promise<MovieVideos | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieVideos = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching movie videos:", error);
    return null;
  }
}

/**
 * Get credits (cast and crew) for a movie
 * @param id - Movie ID
 * @returns Cast and crew information
 */
export async function getMovieCredits(
  id: number
): Promise<MovieCredits | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieCredits = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching movie credits:", error);
    return null;
  }
}

/**
 * Get trending movies
 * @param timeWindow - 'day' or 'week'
 * @returns Array of trending movies
 */
export async function getTrendingMovies(
  timeWindow: "day" | "week" = "week"
): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    throw new Error("Failed to fetch trending movies. Please try again.");
  }
}

/**
 * Get list of movie genres
 * @returns Array of genres with id and name
 */
export async function getGenres(): Promise<Genre[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: { genres: Genre[] } = await response.json();
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

/**
 * Discover movies by genre
 * @param genreId - Genre ID to filter by
 * @param page - Page number for pagination
 * @returns Array of movies in the specified genre
 */
export async function discoverMoviesByGenre(
  genreId: number,
  page: number = 1
): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error discovering movies by genre:", error);
    throw new Error("Failed to discover movies. Please try again.");
  }
}

/**
 * Discover Anime movies (Animation genre + Japanese origin)
 * @param page - Page number for pagination
 * @returns Array of anime movies
 */
export async function discoverAnime(page: number = 1): Promise<Movie[]> {
  try {
    // Genre 16 = Animation, with_origin_country = JP (Japan)
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&with_origin_country=JP&page=${page}&sort_by=popularity.desc&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error discovering anime:", error);
    throw new Error("Failed to discover anime. Please try again.");
  }
}

/**
 * Discover K-Drama movies (Drama genre + Korean origin)
 * @param page - Page number for pagination
 * @returns Array of Korean drama movies
 */
export async function discoverKDrama(page: number = 1): Promise<Movie[]> {
  try {
    // Genre 18 = Drama, with_origin_country = KR (South Korea)
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=18&with_origin_country=KR&page=${page}&sort_by=popularity.desc&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error discovering K-Drama:", error);
    throw new Error("Failed to discover K-Drama. Please try again.");
  }
}
