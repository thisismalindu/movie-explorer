import axios from 'axios';
import { axiosBaseQuery } from './movieApi';

jest.mock('axios', () => ({ get: jest.fn() }));

describe('TMDb request setup', () => {
  const originalToken = process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN;

  afterEach(() => {
    axios.get.mockReset();
    if (originalToken === undefined) {
      delete process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN;
    } else {
      process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN = originalToken;
    }
  });

  test('sends a bearer token and cancellation signal', async () => {
    process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN = 'test-token';
    const signal = new AbortController().signal;
    axios.get.mockResolvedValue({ data: { results: [] } });

    await expect(
      axiosBaseQuery({ url: '/trending/movie/week', params: { language: 'en-US' } }, { signal })
    ).resolves.toEqual({ data: { results: [] } });

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/trending/movie/week',
      expect.objectContaining({
        params: { language: 'en-US' },
        signal,
        headers: { Authorization: 'Bearer test-token' },
      })
    );
  });

  test('returns a serializable API error', async () => {
    process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN = 'test-token';
    axios.get.mockRejectedValue({ response: { status: 401, data: { status_message: 'Invalid token' } } });

    await expect(axiosBaseQuery({ url: '/trending/movie/week' }, {})).resolves.toEqual({
      error: { status: 401, data: { status_message: 'Invalid token' } },
    });
  });

  test('does not make an unauthenticated request when the token is missing', async () => {
    delete process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN;

    await expect(axiosBaseQuery({ url: '/trending/movie/week' }, {})).resolves.toEqual({
      error: { status: 'CUSTOM_ERROR', data: 'TMDb access token is not configured.' },
    });
    expect(axios.get).not.toHaveBeenCalled();
  });
});
