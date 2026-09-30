import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createAppStore } from '../../app/store';
import MovieDetailsPage from './MovieDetailsPage';

jest.mock('axios', () => ({ get: jest.fn() }));

function renderDetails(path = '/movies/42') {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes><Route path="/movies/:movieId" element={<MovieDetailsPage />} /></Routes>
      </MemoryRouter>
    </Provider>
  );
}

const movie = {
  id: 42,
  title: 'Arrival',
  release_date: '2016-11-10',
  vote_average: 7.6,
  poster_path: '/arrival.jpg',
  overview: 'A linguist studies an alien language.',
  genres: [{ id: 1, name: 'Drama' }],
  credits: {
    cast: Array.from({ length: 12 }, (_, id) => ({
      id,
      name: `Actor ${id}`,
      character: `Role ${id}`,
    })),
  },
  videos: {
    results: [
      { site: 'YouTube', type: 'Trailer', official: false, key: 'fallback' },
      { site: 'YouTube', type: 'Trailer', official: true, key: 'official' },
      { site: 'Vimeo', type: 'Trailer', official: true, key: 'ignored' },
    ],
  },
};

beforeEach(() => {
  process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN = 'test-token';
  axios.get.mockReset();
});

test('shows movie details, the first ten cast members, and the official YouTube trailer', async () => {
  axios.get.mockResolvedValue({ data: movie });
  renderDetails();

  expect(await screen.findByRole('heading', { level: 1, name: 'Arrival' })).toBeInTheDocument();
  expect(screen.getByText('2016 · Rating: 7.6 / 10')).toBeInTheDocument();
  expect(screen.getByText('A linguist studies an alien language.')).toBeInTheDocument();
  expect(screen.getByText('Drama')).toBeInTheDocument();
  expect(screen.getByText(/Actor 0 as Role 0/)).toBeInTheDocument();
  expect(screen.queryByText(/Actor 10 as Role 10/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Watch trailer on YouTube' })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=official'
  );
  expect(screen.getByRole('link', { name: 'Watch trailer on YouTube' })).toHaveAttribute('target', '_blank');
  expect(screen.getByRole('link', { name: 'Watch trailer on YouTube' })).toHaveAttribute(
    'rel',
    'noopener noreferrer'
  );
  expect(axios.get).toHaveBeenCalledWith(
    'https://api.themoviedb.org/3/movie/42',
    expect.objectContaining({ params: { append_to_response: 'credits,videos', language: 'en-US' } })
  );
});

test('shows fallback content when movie information and trailer are missing', async () => {
  axios.get.mockResolvedValue({ data: { id: 42, title: 'Unknown', videos: { results: [] } } });
  renderDetails();

  expect(await screen.findByText('No overview available.')).toBeInTheDocument();
  expect(screen.getByText('No genres available.')).toBeInTheDocument();
  expect(screen.getByText('Cast information unavailable.')).toBeInTheDocument();
  expect(screen.getByText('No trailer available.')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Unknown poster unavailable' })).toBeInTheDocument();
});

test('uses the first YouTube trailer when none is official', async () => {
  axios.get.mockResolvedValue({
    data: {
      id: 42,
      title: 'Arrival',
      videos: { results: [{ site: 'YouTube', type: 'Trailer', key: 'first-trailer' }] },
    },
  });
  renderDetails();

  expect(await screen.findByRole('link', { name: 'Watch trailer on YouTube' })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=first-trailer'
  );
});

test('rejects invalid movie IDs without requesting details', () => {
  renderDetails('/movies/0');

  expect(screen.getByText('This movie URL is invalid.')).toBeInTheDocument();
  expect(axios.get).not.toHaveBeenCalled();
});

test('shows a retry state when TMDb cannot find the movie', async () => {
  axios.get.mockRejectedValue({ response: { status: 404, data: {} } });
  renderDetails('/movies/404');

  expect(await screen.findByText('Could not load this movie. It may not be available.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
