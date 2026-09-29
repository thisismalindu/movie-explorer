import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test.each([
  ['/', 'Movie Explorer'],
  ['/movies/42', 'Movie Details'],
  ['/favorites', 'Favorites'],
  ['/login', 'Login'],
])('shows %s page', (path, heading) => {
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
});

test('navigates to favorites and marks the active link', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('link', { name: 'Favorites' }));

  expect(screen.getByRole('heading', { level: 1, name: 'Favorites' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Favorites' })).toHaveAttribute('aria-current', 'page');
});

test('shows a home link for unknown routes', () => {
  render(
    <MemoryRouter initialEntries={['/unknown']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Go to Home' })).toBeInTheDocument();
});
