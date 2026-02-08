import type {
  Movie,
  MovieDetails,
  MovieSearchResponse,
  WatchProviders,
  MovieVideos,
  MovieCredits,
  Genre,
  CollectionDetails,
  DiscoverSortOption,
  InternationalRegion,
} from "@/types/movie";

// TMDB API Configuration
// In production, use the proxy to hide the API key
// In development, can use direct TMDB calls with VITE_TMDB_API_KEY
const USE_PROXY = import.meta.env.PROD || !import.meta.env.VITE_TMDB_API_KEY;
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const DIRECT_BASE_URL = "https://api.themoviedb.org/3";
const PROXY_BASE_URL = "/api/tmdb";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// TMDB keyword IDs for adult/erotic content to exclude
// 155477: erotic movie, 6054: erotic, 230183: softcore, 191736: sexploitation
// 280411: erotic thriller, 10647: sex, 418209: softcore erotica
// 245227: pinku eiga (Japanese erotic cinema), 156174: sexual content
const EXCLUDED_KEYWORDS = "155477|6054|230183|191736|280411|10647|418209|245227|156174";

// Helper to build API URLs
function buildApiUrl(
  path: string,
  params: Record<string, string | number> = {}
): string {
  if (USE_PROXY) {
    const searchParams = new URLSearchParams({
      path,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });
    return `${PROXY_BASE_URL}?${searchParams.toString()}`;
  } else {
    const searchParams = new URLSearchParams({
      api_key: API_KEY,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });
    return `${DIRECT_BASE_URL}/${path}?${searchParams.toString()}`;
  }
}

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
 * @returns Array of movies matching the search (filtered for adult content)
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
      buildApiUrl("search/movie", {
        query: encodeURIComponent(query),
        page,
        include_adult: "false",
      })
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    // Filter out adult content and low vote count movies
    return data.results.filter(
      (movie) => !movie.adult && movie.vote_count >= 50
    );
  } catch (error) {
    console.error("Error searching movies:", error);
    throw new Error(
      "Failed to search movies. Please check your API key and try again."
    );
  }
}

/**
 * Get popular movies (uses discover endpoint for better filtering)
 * @param page - Page number for pagination
 * @returns Array of popular movies
 */
export async function getPopularMovies(page: number = 1): Promise<Movie[]> {
  try {
    const response = await fetch(
      buildApiUrl("discover/movie", {
        page,
        sort_by: "popularity.desc",
        include_adult: "false",
        "vote_count.gte": 100,
        watch_region: "US",
        with_watch_monetization_types: "flatrate|rent|buy",
        without_keywords: EXCLUDED_KEYWORDS,
      })
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
    const response = await fetch(buildApiUrl(`movie/${id}`));

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
 * @returns Array of similar movies (filtered for adult content)
 */
export async function getSimilarMovies(
  id: number,
  page: number = 1
): Promise<Movie[]> {
  try {
    const response = await fetch(
      buildApiUrl(`movie/${id}/similar`, { page, include_adult: "false" })
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    // Filter out adult content and movies with very low vote counts (often obscure adult films)
    return data.results.filter(
      (movie) => !movie.adult && movie.vote_count >= 50
    );
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
    const response = await fetch(buildApiUrl(`movie/${id}/watch/providers`));

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
    const response = await fetch(buildApiUrl(`movie/${id}/videos`));

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
    const response = await fetch(buildApiUrl(`movie/${id}/credits`));

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
 * @returns Array of trending movies (filtered for adult content)
 */
export async function getTrendingMovies(
  timeWindow: "day" | "week" = "week"
): Promise<Movie[]> {
  try {
    const response = await fetch(
      buildApiUrl(`trending/movie/${timeWindow}`, { include_adult: "false" })
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    // Filter out adult content and low-vote movies
    return data.results.filter(
      (movie) => !movie.adult && movie.vote_count >= 100
    );
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
    const response = await fetch(buildApiUrl("genre/movie/list"));

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
 * @param sortBy - Sort option: 'popularity' or 'release_date'
 * @returns Array of movies in the specified genre
 */
export async function discoverMoviesByGenre(
  genreId: number,
  page: number = 1,
  sortBy: DiscoverSortOption = "popularity"
): Promise<Movie[]> {
  try {
    // For trending: sort by popularity but limit to recent releases (2 years)
    const tmdbSortBy =
      sortBy === "release_date"
        ? "primary_release_date.desc"
        : "popularity.desc";

    const params: Record<string, string | number> = {
      with_genres: genreId,
      page,
      sort_by: tmdbSortBy,
      include_adult: "false",
      "vote_count.gte": 50,
      watch_region: "US",
      with_watch_monetization_types: "flatrate|rent|buy",
      without_keywords: EXCLUDED_KEYWORDS,
    };

    // For trending, add date filter to get popular movies from last 2 years
    if (sortBy === "trending") {
      const today = new Date();
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      params["primary_release_date.gte"] = twoYearsAgo.toISOString().split("T")[0];
      params["primary_release_date.lte"] = today.toISOString().split("T")[0];
    }

    const response = await fetch(buildApiUrl("discover/movie", params));

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
 * @param sortBy - Sort option: 'popularity' or 'release_date'
 * @returns Array of anime movies
 */
export async function discoverAnime(
  page: number = 1,
  sortBy: DiscoverSortOption = "popularity"
): Promise<Movie[]> {
  try {
    // For trending: sort by popularity but limit to recent releases (2 years)
    const tmdbSortBy =
      sortBy === "release_date"
        ? "primary_release_date.desc"
        : "popularity.desc";

    const params: Record<string, string | number> = {
      with_genres: 16,
      with_origin_country: "JP",
      page,
      sort_by: tmdbSortBy,
      include_adult: "false",
      "vote_count.gte": 50,
      watch_region: "US",
      with_watch_monetization_types: "flatrate|rent|buy",
      without_keywords: EXCLUDED_KEYWORDS,
    };

    // For trending, add date filter to get popular movies from last 2 years
    if (sortBy === "trending") {
      const today = new Date();
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      params["primary_release_date.gte"] = twoYearsAgo.toISOString().split("T")[0];
      params["primary_release_date.lte"] = today.toISOString().split("T")[0];
    }

    const response = await fetch(buildApiUrl("discover/movie", params));

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

// Region configuration for international drama
// Note: We primarily use origin country for filtering as language codes can be inconsistent
const INTERNATIONAL_REGIONS: Record<InternationalRegion, { languages?: string[]; country?: string; excludeGenres?: number[] }> = {
  all: {}, // All non-US drama
  korean: { languages: ["ko"], country: "KR" },
  japanese: { languages: ["ja"], country: "JP", excludeGenres: [16] }, // Exclude animation
  filipino: { languages: ["tl", "fil"], country: "PH" }, // Both Tagalog codes used
  thai: { languages: ["th"], country: "TH" },
  chinese: { languages: ["zh", "cn"], country: "CN" }, // Both Chinese codes
  french: { languages: ["fr"], country: "FR" },
  spanish: { languages: ["es"], country: "ES" }, // Spain (primary Spanish cinema)
  british: { languages: ["en"], country: "GB" },
};

/**
 * Discover International Drama movies by region
 * @param page - Page number for pagination
 * @param sortBy - Sort option: 'popularity', 'release_date', or 'trending'
 * @param region - International region to filter by
 * @returns Array of international drama movies
 */
export async function discoverInternationalDrama(
  page: number = 1,
  sortBy: DiscoverSortOption = "popularity",
  region: InternationalRegion = "all"
): Promise<Movie[]> {
  try {
    const tmdbSortBy =
      sortBy === "release_date"
        ? "primary_release_date.desc"
        : "popularity.desc";

    const regionConfig = INTERNATIONAL_REGIONS[region];

    const buildParams = (pageNum: number): Record<string, string | number> => {
      // Use lower vote threshold for specific regions since they have smaller audiences
      const voteThreshold = region === "all" ? 50 : 10;

      const params: Record<string, string | number> = {
        with_genres: 18, // Drama genre
        without_genres: "16", // Exclude Animation (anime) - we have a separate Anime category
        page: pageNum,
        sort_by: tmdbSortBy,
        include_adult: "false",
        "vote_count.gte": voteThreshold,
        without_keywords: EXCLUDED_KEYWORDS,
      };

      // Apply region-specific filters
      if (region === "all") {
        // All international: exclude US origin, require US streaming availability
        params.without_origin_country = "US";
        params.watch_region = "US";
        params.with_watch_monetization_types = "flatrate|rent|buy";
      } else {
        // For specific regions, use origin country as the primary filter
        // Don't require US streaming availability for regional content (too restrictive)
        if (regionConfig.country) {
          params.with_origin_country = regionConfig.country;
        }
        // Add any additional excluded genres for specific regions
        if (regionConfig.excludeGenres) {
          params.without_genres = ["16", ...regionConfig.excludeGenres].join(",");
        }
      }

      // For trending, add date filter to get popular recent movies
      // For specific regions, skip the date filter since the country filter already limits the pool
      if (sortBy === "trending" && region === "all") {
        const today = new Date();
        const twoYearsAgo = new Date(today);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        params["primary_release_date.gte"] = twoYearsAgo.toISOString().split("T")[0];
        params["primary_release_date.lte"] = today.toISOString().split("T")[0];
      }

      return params;
    };

    // For "all" region, we need to fetch extra pages since we filter out English films client-side
    // Each logical page maps to ~3 API pages (since ~1/3 of results are non-English)
    if (region === "all") {
      const pagesPerLogicalPage = 3;
      const apiStartPage = (page - 1) * pagesPerLogicalPage + 1;
      const allResults: Movie[] = [];

      // Fetch multiple API pages to get enough non-English results
      for (let i = 0; i < pagesPerLogicalPage + 2 && allResults.length < 20; i++) {
        const response = await fetch(buildApiUrl("discover/movie", buildParams(apiStartPage + i)));
        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`);
        }
        const data: MovieSearchResponse = await response.json();

        // If no more results from API, stop
        if (data.results.length === 0) break;

        // Filter out English-language films
        const filtered = data.results.filter((movie) => movie.original_language !== "en");
        allResults.push(...filtered);
      }

      return allResults.slice(0, 20);
    }

    // For specific regions, the API handles filtering via with_origin_country
    // No additional client-side filtering needed
    const response = await fetch(buildApiUrl("discover/movie", buildParams(page)));

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error discovering international drama:", error);
    throw new Error("Failed to discover international drama. Please try again.");
  }
}

/**
 * Get collection details (franchise movies)
 * @param collectionId - Collection ID
 * @returns Collection details including all movies in the franchise
 */
export async function getCollectionDetails(
  collectionId: number
): Promise<CollectionDetails | null> {
  try {
    const response = await fetch(buildApiUrl(`collection/${collectionId}`));

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: CollectionDetails = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching collection details:", error);
    return null;
  }
}

/**
 * Get latest released movies sorted by release date
 * @param page - Page number for pagination
 * @returns Array of recently released movies
 */
export async function getLatestMovies(page: number = 1): Promise<Movie[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(
      buildApiUrl("discover/movie", {
        page,
        sort_by: "primary_release_date.desc",
        "primary_release_date.lte": today,
        "vote_count.gte": 50,
        include_adult: "false",
        watch_region: "US",
        with_watch_monetization_types: "flatrate|rent|buy",
        without_keywords: EXCLUDED_KEYWORDS,
      })
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: MovieSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching latest movies:", error);
    throw new Error("Failed to fetch latest movies. Please try again.");
  }
}
