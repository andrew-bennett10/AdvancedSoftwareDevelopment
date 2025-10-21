import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FavouriteButton from './FavouriteButton';

describe('FavouriteButton', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('asks user to sign in when not authenticated', () => {
    render(<FavouriteButton card={{ title: 'Pikachu' }} />);

    fireEvent.click(screen.getByRole('button', { name: /add to favourites/i }));

    expect(screen.getByText(/please sign in to save favourites/i)).toBeInTheDocument();
  });

  test('posts favourite and dispatches event when user is present', async () => {
    const mockFavourite = {
      id: 99,
      card_title: 'Charizard',
      card_description: 'Base set classic',
      card_image_url: 'https://example.com/charizard.png',
      created_at: '2025-10-01T10:00:00.000Z',
    };

    localStorage.setItem('userData', JSON.stringify({ id: 42 }));

    const onAdded = jest.fn();
    const eventSpy = jest.fn();
    window.addEventListener('favourite:created', eventSpy);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ favourite: mockFavourite }),
    });

    render(
      <FavouriteButton
        card={{
          title: 'Charizard',
          description: 'Base set classic',
          imageUrl: 'https://example.com/charizard.png',
        }}
        onAdded={onAdded}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add to favourites/i }));

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledWith(mockFavourite);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/favourites'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          userId: 42,
          cardTitle: 'Charizard',
          cardDescription: 'Base set classic',
          cardImageUrl: 'https://example.com/charizard.png',
        }),
      })
    );

    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener('favourite:created', eventSpy);
  });
});
