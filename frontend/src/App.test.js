import { render, screen } from '@testing-library/react';
import App from './App';

describe('App routing shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('renders login view by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don’t have an account/i)).toBeInTheDocument();
  });
});
