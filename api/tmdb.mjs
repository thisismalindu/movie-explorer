const TMDB_API = 'https://api.themoviedb.org/3';

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function GET(request) {
  if (request.method !== 'GET') return json({ error: 'Only GET requests are supported.' }, 405);

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const params = new URLSearchParams();
  let endpoint;

  if (path === '/trending/movie/week') {
    endpoint = path;
    params.set('language', 'en-US');
  } else if (path === '/search/movie') {
    const query = searchParams.get('query')?.trim();
    const page = Number(searchParams.get('page') || 1);
    if (!query || !Number.isInteger(page) || page < 1 || page > 500) {
      return json({ error: 'A search query and page from 1 to 500 are required.' }, 400);
    }
    endpoint = path;
    params.set('query', query);
    params.set('page', String(page));
    params.set('include_adult', 'false');
    params.set('language', 'en-US');
  } else {
    const movie = path?.match(/^\/movie\/([1-9]\d*)$/);
    if (!movie || !Number.isSafeInteger(Number(movie[1]))) {
      return json({ error: 'Unsupported TMDb operation.' }, 404);
    }
    endpoint = path;
    params.set('append_to_response', 'credits,videos');
    params.set('language', 'en-US');
  }

  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) return json({ error: 'TMDB_READ_ACCESS_TOKEN is not configured.' }, 500);

  try {
    const response = await fetch(`${TMDB_API}${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return json(data, response.status);
  } catch {
    return json({ error: 'TMDb could not be reached.' }, 502);
  }
}
