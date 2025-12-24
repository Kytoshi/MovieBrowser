import type { Movie, MovieDetails, MovieSearchResponse } from '@/types/movie';

// TMDB API Configuration
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Get the full URL for a movie poster or backdrop image
 * @param path - The image path from TMDB API
 * @param size - Image size (w200, w300, w500, original, etc.)
 * @returns Full image URL or fallback placeholder
 */
export function getImageUrl(path: string | null, size: string = 'w500'): string {
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
export async function searchMovies(query: string, page: number = 1): Promise<Movie[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw new Error('Failed to search movies. Please check your API key and try again.');
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
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw new Error('Failed to fetch popular movies. Please check your API key and try again.');
  }
}

/**
 * Get detailed information about a specific movie
 * @param id - Movie ID
 * @returns Detailed movie information
 */
export async function getMovieDetails(id: number): Promise<MovieDetails> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieDetails = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw new Error('Failed to fetch movie details. Please try again.');
  }
}
