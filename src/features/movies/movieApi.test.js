import axios from 'axios';
import { axiosBaseQuery } from './movieApi';

jest.mock('axios', () => ({ get: jest.fn() }));

describe('TMDb request setup', () => {
  afterEach(() => {
    axios.get.mockReset();
  });

  test('calls the same-origin proxy and forwards cancellation', async () => {
    const signal = new AbortController().signal;
    axios.get.mockResolvedValue({ data: { results: [] } });

    await expect(
      axiosBaseQuery({ url: '/trending/movie/week', params: { language: 'en-US' } }, { signal })
    ).resolves.toEqual({ data: { results: [] } });

    expect(axios.get).toHaveBeenCalledWith(
      '/api/tmdb',
      expect.objectContaining({
        params: { path: '/trending/movie/week', language: 'en-US' },
        signal,
      })
    );
  });

  test('returns a serializable API error', async () => {
    axios.get.mockRejectedValue({ response: { status: 401, data: { status_message: 'Invalid token' } } });

    await expect(axiosBaseQuery({ url: '/trending/movie/week' }, {})).resolves.toEqual({
      error: { status: 401, data: { status_message: 'Invalid token' } },
    });
  });

  test('does not send credentials from the browser', async () => {
    axios.get.mockResolvedValue({ data: {} });
    await axiosBaseQuery({ url: '/trending/movie/week' }, {});
    expect(axios.get.mock.calls[0][1].headers).toBeUndefined();
  });
});
