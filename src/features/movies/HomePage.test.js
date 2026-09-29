import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { mockAllIsIntersecting } from 'react-intersection-observer/test-utils';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createAppStore } from '../../app/store';
import HomePage from './HomePage';

jest.mock('axios', () => ({ get: jest.fn() }));

function LocationSearch() {
  return <output data-testid="location-search">{useLocation().search}</output>;
}

function renderHome(path = '/') {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LocationSearch />
        <HomePage />
      </MemoryRouter>
    </Provider>
  );
}

const arrival = {
  id: 329865,
  title: 'Arrival',
  release_date: '2016-11-10',
  vote_average: 7.6,
  poster_path: '/arrival.jpg',
};

beforeEach(() => {
  process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN = 'test-token';
  axios.get.mockReset();
  mockAllIsIntersecting(false);
});

test('renders movie information and links the card to its detail route', async () => {
  axios.get.mockResolvedValue({ data: { results: [arrival] } });
  renderHome();

  const card = await screen.findByRole('link', { name: /Arrival/ });
  expect(card).toHaveAttribute('href', '/movies/329865');
  expect(screen.getByText('2016')).toBeInTheDocument();
  expect(screen.getByText('Rating: 7.6 / 10')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Arrival poster' })).toHaveAttribute(
    'src',
    'https://image.tmdb.org/t/p/w342/arrival.jpg'
  );
});

test('shows an empty state when there are no trending movies', async () => {
  axios.get.mockResolvedValue({ data: { results: [] } });
  renderHome();

  expect(await screen.findByText('No trending movies are available right now.')).toBeInTheDocument();
});

test('shows an error and retries the trending request', async () => {
  axios.get
    .mockRejectedValueOnce({ response: { status: 503, data: {} } })
    .mockResolvedValueOnce({ data: { results: [arrival] } });
  renderHome();

  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));

  expect(await screen.findByRole('link', { name: /Arrival/ })).toBeInTheDocument();
});

test('submits a trimmed query to the URL and requests the first results page', async () => {
  axios.get.mockResolvedValue({ data: { results: [] } });
  renderHome();

  fireEvent.change(screen.getByRole('textbox', { name: 'Search movies' }), {
    target: { value: '  alien  ' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alien'));
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith(
    'https://api.themoviedb.org/3/search/movie',
    expect.objectContaining({
      params: { query: 'alien', page: 1, include_adult: false, language: 'en-US' },
    })
  ));
});

test('uses a search query from the URL and clears it back to trending', async () => {
  axios.get.mockResolvedValue({ data: { results: [] } });
  renderHome('/?q=alien');

  expect(await screen.findByDisplayValue('alien')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Search results' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

  await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent(''));
  expect(await screen.findByRole('heading', { level: 2, name: 'Trending this week' })).toBeInTheDocument();
});

test('loads another page when the results sentinel enters view', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { page: 1, total_pages: 2, results: [arrival] } })
    .mockResolvedValueOnce({
      data: {
        page: 2,
        total_pages: 2,
        results: [{ ...arrival, id: 2, title: 'Arrival sequel' }],
      },
    });
  renderHome('/?q=alien');
  expect(await screen.findByRole('link', { name: /Arrival/ })).toBeInTheDocument();

  mockAllIsIntersecting(true);

  expect(await screen.findByRole('link', { name: /Arrival sequel/ })).toBeInTheDocument();
  expect(axios.get).toHaveBeenLastCalledWith(
    'https://api.themoviedb.org/3/search/movie',
    expect.objectContaining({ params: expect.objectContaining({ query: 'alien', page: 2 }) })
  );
});

test('does not request another page after the last result page', async () => {
  axios.get.mockResolvedValue({ data: { page: 1, total_pages: 1, results: [arrival] } });
  renderHome('/?q=alien');
  expect(await screen.findByRole('link', { name: /Arrival/ })).toBeInTheDocument();

  mockAllIsIntersecting(true);

  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('does not request duplicate pages for repeated observer notifications', async () => {
  let resolveNextPage;
  const pendingPage = new Promise((resolve) => { resolveNextPage = resolve; });
  axios.get
    .mockResolvedValueOnce({ data: { page: 1, total_pages: 2, results: [arrival] } })
    .mockReturnValueOnce(pendingPage);
  renderHome('/?q=alien');
  expect(await screen.findByRole('link', { name: /Arrival poster/ })).toBeInTheDocument();

  mockAllIsIntersecting(true);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  mockAllIsIntersecting(true);
  expect(axios.get).toHaveBeenCalledTimes(2);

  resolveNextPage({ data: { page: 2, total_pages: 2, results: [] } });
  await waitFor(() => expect(screen.queryByLabelText('Loading more movies')).not.toBeInTheDocument());
});

test('keeps first-page results and retries a failed next page', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { page: 1, total_pages: 2, results: [arrival] } })
    .mockRejectedValueOnce({ response: { status: 503, data: {} } })
    .mockResolvedValueOnce({
      data: { page: 2, total_pages: 2, results: [{ ...arrival, id: 2, title: 'Arrival sequel' }] },
    });
  renderHome('/?q=alien');
  expect(await screen.findByRole('link', { name: /Arrival/ })).toBeInTheDocument();
  mockAllIsIntersecting(true);

  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));

  expect(screen.getByRole('link', { name: /Arrival poster/ })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: /Arrival sequel/ })).toBeInTheDocument();
});
