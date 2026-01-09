import type { VercelRequest, VercelResponse } from "@vercel/node";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { path, ...queryParams } = req.query;

  // Validate path parameter
  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  // Build the TMDB URL with the API key from environment
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // Build query string from remaining parameters
  const params = new URLSearchParams();
  params.set("api_key", apiKey);

  for (const [key, value] of Object.entries(queryParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  const tmdbUrl = `${TMDB_BASE_URL}/${path}?${params.toString()}`;

  try {
    const response = await fetch(tmdbUrl);
    const data = await response.json();

    // Set cache headers (cache for 5 minutes)
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("TMDB API error:", error);
    return res.status(500).json({ error: "Failed to fetch from TMDB" });
  }
}
