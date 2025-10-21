import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import 'bootstrap/dist/css/bootstrap.min.css';

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

  return (
    <div>
      <NavigationBar activePage="achievements" />
      
      {/* Achievements Content */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h2 className="mb-4">Achievements</h2>
            
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Progress Section */}
                <div className="card mb-4 shadow">
                  <div className="card-body">
                    <h4 className="card-title mb-3">Your Progress</h4>
                    <div className="progress" style={{ height: '30px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${(achievements.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100}%` }}
                        aria-valuenow={achievements.length}
                        aria-valuemin="0"
                        aria-valuemax={Object.keys(ACHIEVEMENT_DEFINITIONS).length}
                      >
                        <strong>{achievements.length} / {Object.keys(ACHIEVEMENT_DEFINITIONS).length}</strong>
                      </div>
                    </div>
                    <p className="text-muted mt-2 mb-0">
                      {achievements.length === 0 && "Start your journey by collecting cards!"}
                      {achievements.length > 0 && achievements.length < Object.keys(ACHIEVEMENT_DEFINITIONS).length && 
                        `Keep going! ${Object.keys(ACHIEVEMENT_DEFINITIONS).length - achievements.length} more to unlock.`}
                      {achievements.length === Object.keys(ACHIEVEMENT_DEFINITIONS).length && 
                        "🎉 Congratulations! You've unlocked all achievements!"}
                    </p>
                  </div>
                </div>

                {/* Achievements List */}
                {allAchievements.map((achievement) => (
                  <div key={achievement.type} className={`card mb-3 shadow ${achievement.unlocked ? 'border-success' : ''}`}>
                    <div className="card-body">
                      <div className="d-flex align-items-start">
                        <div className="me-3" style={{ fontSize: '48px', lineHeight: '1' }}>
                          {achievement.icon}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h5 className="card-title mb-1">{achievement.name}</h5>
                              <p className="card-text text-muted mb-2">{achievement.description}</p>
                              {achievement.unlocked && achievement.unlockedAt && (
                                <small className="text-success">
                                  <strong>Unlocked:</strong> {new Date(achievement.unlockedAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </small>
                              )}
                            </div>
                            <div>
                              {achievement.unlocked && (
                                <span className="badge bg-success">Unlocked</span>
                              )}
                              {!achievement.unlocked && (
                                <span className="badge bg-secondary">Locked</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Achievements;
