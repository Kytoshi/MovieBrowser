// Base Movie interface matching TMDB API search/popular endpoints
export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  adult: boolean;
  video: boolean;
}

// Extended MovieDetails interface for the details endpoint
export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number | null;
  status: string;
  tagline: string | null;
  budget: number;
  revenue: number;
  homepage: string | null;
  imdb_id: string | null;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  belongs_to_collection: MovieCollection | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

// API Response types
export interface MovieSearchResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

// Sort options for client-side filtering
export type SortOption = 'popularity' | 'rating' | 'release_date';

// TMDB API sort options for discover endpoint
export type DiscoverSortOption = 'popularity' | 'release_date' | 'trending';

// International drama region options
export type InternationalRegion = 'all' | 'korean' | 'japanese' | 'filipino' | 'thai' | 'chinese' | 'french' | 'spanish' | 'british';

// Watch Providers (Streaming availability)
export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface WatchProviderRegion {
  link?: string;
  flatrate?: WatchProvider[];  // Streaming (Netflix, etc.)
  rent?: WatchProvider[];      // Rent (Apple TV, etc.)
  buy?: WatchProvider[];       // Buy (Amazon, etc.)
}

export interface WatchProviders {
  id: number;
  results: {
    [countryCode: string]: WatchProviderRegion;
  };
}

// Movie Videos (Trailers, etc.)
export interface MovieVideo {
  id: string;
  key: string;           // YouTube video ID
  site: string;          // "YouTube"
  type: string;          // "Trailer", "Teaser", "Featurette", etc.
  official: boolean;
  name: string;
  size: number;          // 360, 480, 720, 1080
  published_at: string;
}

export interface MovieVideos {
  id: number;
  results: MovieVideo[];
}

// Movie Credits (Cast & Crew)
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface MovieCredits {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

// Movie Collection (Franchise)
export interface MovieCollection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}
