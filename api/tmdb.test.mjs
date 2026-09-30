import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { GET } from './tmdb.mjs';

const originalFetch = globalThis.fetch;
const originalToken = process.env.TMDB_READ_ACCESS_TOKEN;
const call = (query) => GET(new Request(`https://app.test/api/tmdb?${query}`));
const respond = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.TMDB_READ_ACCESS_TOKEN;
  else process.env.TMDB_READ_ACCESS_TOKEN = originalToken;
});

test('requests weekly trending with fixed language and server bearer token', async () => {
  process.env.TMDB_READ_ACCESS_TOKEN = 'test-token';
  let requestUrl;
  let requestOptions;
  globalThis.fetch = async (url, options) => {
    requestUrl = new URL(url);
    requestOptions = options;
    return respond({ results: [] });
  };

  const response = await call('path=%2Ftrending%2Fmovie%2Fweek&language=fr-FR');
  assert.equal(response.status, 200);
  assert.equal(requestUrl.origin, 'https://api.themoviedb.org');
  assert.equal(requestUrl.pathname, '/3/trending/movie/week');
  assert.equal(requestUrl.searchParams.get('language'), 'en-US');
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-token');
});

test('validates and forwards search pagination with adult results excluded', async () => {
  process.env.TMDB_READ_ACCESS_TOKEN = 'test-token';
  let requestUrl;
  globalThis.fetch = async (url) => {
    requestUrl = new URL(url);
    return respond({ page: 2 });
  };

  const response = await call('path=%2Fsearch%2Fmovie&query=alien&page=2');
  assert.equal(response.status, 200);
  assert.equal(requestUrl.pathname, '/3/search/movie');
  assert.equal(requestUrl.searchParams.get('query'), 'alien');
  assert.equal(requestUrl.searchParams.get('page'), '2');
  assert.equal(requestUrl.searchParams.get('include_adult'), 'false');

  assert.equal((await call('path=%2Fsearch%2Fmovie&query=alien&page=501')).status, 400);
  assert.equal((await call('path=%2Fsearch%2Fmovie&page=1')).status, 400);
});

test('requests movie credits and videos for a positive movie ID', async () => {
  process.env.TMDB_READ_ACCESS_TOKEN = 'test-token';
  let requestUrl;
  globalThis.fetch = async (url) => {
    requestUrl = new URL(url);
    return respond({ id: 42 });
  };

  const response = await call('path=%2Fmovie%2F42');
  assert.equal(response.status, 200);
  assert.equal(requestUrl.pathname, '/3/movie/42');
  assert.equal(requestUrl.searchParams.get('append_to_response'), 'credits,videos');
  assert.equal((await call('path=%2Fmovie%2F0')).status, 404);
});

test('reports missing configuration, unsupported paths, and upstream errors', async () => {
  delete process.env.TMDB_READ_ACCESS_TOKEN;
  assert.equal((await call('path=%2Ftrending%2Fmovie%2Fweek')).status, 500);

  process.env.TMDB_READ_ACCESS_TOKEN = 'test-token';
  assert.equal((await call('path=https%3A%2F%2Fevil.test')).status, 404);
  globalThis.fetch = async () => respond({ status_message: 'Invalid key' }, 401);
  const response = await call('path=%2Ftrending%2Fmovie%2Fweek');
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { status_message: 'Invalid key' });
});
