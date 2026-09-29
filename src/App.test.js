import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { createAppStore } from './app/store';

jest.mock('axios', () => ({ get: jest.fn() }));

function renderApp(path = '/') {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    </Provider>
  );
}

beforeEach(() => {
  process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN = 'test-token';
  axios.get.mockResolvedValue({ data: { results: [] } });
});

test.each([
  ['/', 'Movie Explorer'],
  ['/movies/42', 'Movie Details'],
  ['/favorites', 'Favorites'],
  ['/login', 'Login'],
])('shows %s page', (path, heading) => {
  renderApp(path);
  expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
});

test('navigates to favorites and marks the active link', () => {
  renderApp();
  fireEvent.click(screen.getByRole('link', { name: 'Favorites' }));

  expect(screen.getByRole('heading', { level: 1, name: 'Favorites' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Favorites' })).toHaveAttribute('aria-current', 'page');
});

test('shows a home link for unknown routes', () => {
  renderApp('/unknown');

  expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Go to Home' })).toBeInTheDocument();
});
