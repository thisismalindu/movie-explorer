import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../app/store';
import HomePage from './HomePage';

jest.mock('axios', () => ({ get: jest.fn() }));

function renderHome() {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
