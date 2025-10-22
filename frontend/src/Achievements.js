import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './components/PageLayout';

const BACKEND_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function safeParseUser() {
  try {
    const raw = localStorage.getItem('userData');
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

// Define all available achievements
const ACHIEVEMENT_DEFINITIONS = {
  FIRST_FAVOURITE: {
    name: 'First Favourite',
    description: 'Add your first card to favourites',
    icon: '⭐',
  },
  FIRST_BINDER: {
    name: 'Binder Creator',
    description: 'Create your first binder',
    icon: '📚',
  },
  COLLECTOR: {
    name: 'Collector',
    description: 'Add 10 cards to favourites',
    icon: '🎯',
  },
  MASTER_COLLECTOR: {
    name: 'Master Collector',
    description: 'Add 50 cards to favourites',
    icon: '🏆',
  },
};

function Achievements() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = safeParseUser();
  const userId = user?.id;

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_BASE}/api/achievements?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      const data = await response.json();
      setAchievements(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    fetchAchievements();
  }, [userId, navigate, fetchAchievements]);

  const unlockedTypes = new Set(achievements.map(a => a.achievement_type));
  const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => ({
    type,
    ...def,
    unlocked: unlockedTypes.has(type),
    unlockedAt: achievements.find(a => a.achievement_type === type)?.unlocked_at,
  }));

  const totalAchievements = Object.keys(ACHIEVEMENT_DEFINITIONS).length;

  return (
    <PageLayout
      activePage="achievements"
      title="Achievements"
      description="Celebrate the milestones you unlock while growing your PokéBinder collection."
    >
      <section className="page-surface page-stack">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading achievements…</span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="soft-panel page-stack page-stack--sm">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <h2 className="h6 text-uppercase text-secondary mb-1">Your progress</h2>
                  <p className="text-muted mb-0">
                    Unlock achievements by collecting cards, creating binders and exploring the app.
                  </p>
                </div>
                <span className="badge bg-success">
                  {achievements.length} / {totalAchievements} unlocked
                </span>
              </div>
              <div className="progress" style={{ height: '16px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${(achievements.length / totalAchievements) * 100}%` }}
                  aria-valuenow={achievements.length}
                  aria-valuemin="0"
                  aria-valuemax={totalAchievements}
                />
              </div>
            </div>

            <div className="page-stack">
              {allAchievements.map((achievement) => (
                <div
                  key={achievement.type}
                  className={`soft-panel page-stack page-stack--sm${
                    achievement.unlocked ? ' soft-panel--positive' : ''
                  }`}
                >
                  <div className="d-flex flex-wrap align-items-start gap-3">
                    <div className="display-4 mb-0">{achievement.icon}</div>
                    <div className="flex-grow-1">
                      <h3 className="h5 mb-1">{achievement.name}</h3>
                      <p className="text-muted mb-2">{achievement.description}</p>
                      {achievement.unlocked && achievement.unlockedAt ? (
                        <small className="text-success">
                          Unlocked{' '}
                          {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </small>
                      ) : (
                        <small className="text-muted">
                          Locked · Complete the related action to earn this badge.
                        </small>
                      )}
                    </div>
                    <span className={`badge ${achievement.unlocked ? 'bg-success' : 'bg-secondary'}`}>
                      {achievement.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </PageLayout>
  );
}

export default Achievements;
