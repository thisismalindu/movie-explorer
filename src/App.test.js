import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Movie Explorer heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Movie Explorer' })).toBeInTheDocument();
});
