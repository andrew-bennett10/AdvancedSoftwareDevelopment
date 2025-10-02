import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function parseCurrentUser() {
  try {
    const raw = localStorage.getItem('userData');
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function normaliseCardPayload(card = {}) {
  const title = card.title || card.name || card.card_title;
  return {
    title,
    description:
      card.description || card.card_description || card.text || card.flavorText || '',
    imageUrl: card.imageUrl || card.image || card.card_image_url || '',
  };
}

const statusLabel = {
  idle: 'Add to favourites',
  loading: 'Saving…',
  success: 'Saved!',
  error: 'Try again',
};

function FavouriteButton({
  card,
  userId: userIdProp,
  onAdded,
  onError,
  className = '',
  children,
  disableWhenLoggedOut = true,
  ...buttonProps
}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const user = parseCurrentUser();
  const userId = userIdProp ?? user?.id;
  const disabled =
    buttonProps.disabled || status === 'loading' || (disableWhenLoggedOut && !userId);

  const handleClick = async (event) => {
    event?.preventDefault?.();
    if (!userId) {
      setError('Please sign in to save favourites.');
      setStatus('error');
      onError?.(new Error('AUTH_REQUIRED'));
      return;
    }
    const payload = normaliseCardPayload(card);
    if (!payload.title) {
      setError('Missing card title.');
      setStatus('error');
      onError?.(new Error('INVALID_CARD'));
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/favourites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cardTitle: payload.title,
          cardDescription: payload.description,
          cardImageUrl: payload.imageUrl,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      const favourite = data?.favourite;
      if (favourite) {
        window.dispatchEvent(
          new CustomEvent('favourite:created', {
            detail: { favourite },
          })
        );
        onAdded?.(favourite);
      }
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (err) {
      console.error('Failed to save favourite', err);
      setError('Could not save favourite.');
      setStatus('error');
      onError?.(err);
    }
  };

  const label = children ?? statusLabel[status] ?? statusLabel.idle;

  return (
    <div className={`favourite-button-wrapper ${className}`.trim()}>
      <button
        type="button"
        className={`btn btn-outline-warning favourite-button favourite-button-${status}`}
        onClick={handleClick}
        disabled={disabled}
        {...buttonProps}
      >
        {label}
      </button>
      {status === 'error' && error ? (
        <div className="favourite-button-error">{error}</div>
      ) : null}
    </div>
  );
}

export default FavouriteButton;
