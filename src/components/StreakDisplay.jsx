import { useState, useEffect } from 'react';
import { Flame, Zap, Trophy } from 'lucide-react';
import { streaksAPI } from '../utils/api';

function StreakDisplay({ memberId, compact = false }) {
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState(false);

  useEffect(() => {
    if (memberId) {
      loadStreaks();
    }
  }, [memberId]);

  const loadStreaks = async () => {
    if (!memberId) return;

    try {
      setLoading(true);
      const data = await streaksAPI.get(memberId);
      setStreaks(data);
    } catch (error) {
      console.error('Failed to load streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const dailyStreak = streaks.find(s => s.streak_type === 'daily') || {
    current_streak: 0,
    longest_streak: 0
  };

  const triggerCelebration = () => {
    setCelebration(true);
    setTimeout(() => setCelebration(false), 2000);
  };

  // Trigger celebration when streak increases
  useEffect(() => {
    const prevStreak = parseInt(sessionStorage.getItem(`streak_${memberId}`) || '0');
    if (dailyStreak.current_streak > prevStreak && dailyStreak.current_streak > 0) {
      triggerCelebration();
    }
    sessionStorage.setItem(`streak_${memberId}`, dailyStreak.current_streak.toString());
  }, [dailyStreak.current_streak, memberId]);

  if (loading) {
    return compact ? (
      <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full animate-pulse">
        <Flame className="text-orange-500" size={16} />
        <span className="text-orange-700 font-bold text-sm">...</span>
      </div>
    ) : (
      <div className="bg-white rounded-xl p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (compact) {
    if (dailyStreak.current_streak === 0) return null;

    return (
      <div className={`flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full transition-all ${
        celebration ? 'scale-125 animate-bounce' : ''
      }`}>
        <Flame className="text-orange-500" size={16} />
        <span className="text-orange-700 font-bold text-sm">{dailyStreak.current_streak}</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Flame className="text-orange-500" />
          Daily Streak
        </h3>
        {celebration && (
          <div className="text-2xl animate-bounce">🎉</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Current Streak */}
        <div className={`bg-white rounded-lg p-4 text-center transition-all ${
          celebration ? 'scale-110 shadow-xl' : ''
        }`}>
          <div className="flex items-center justify-center mb-2">
            <Flame className="text-orange-500" size={32} />
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {dailyStreak.current_streak}
          </div>
          <div className="text-sm text-gray-600">Current Streak</div>
          {dailyStreak.current_streak > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {dailyStreak.current_streak === 1 ? 'day' : 'days'} in a row
            </div>
          )}
        </div>

        {/* Longest Streak */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="text-yellow-500" size={32} />
          </div>
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {dailyStreak.longest_streak}
          </div>
          <div className="text-sm text-gray-600">Best Streak</div>
          {dailyStreak.longest_streak > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Personal record
            </div>
          )}
        </div>
      </div>

      {/* Streak messages */}
      <div className="mt-4 text-center">
        {dailyStreak.current_streak === 0 && (
          <p className="text-sm text-gray-600">
            Complete a task today to start your streak!
          </p>
        )}
        {dailyStreak.current_streak >= 3 && dailyStreak.current_streak < 7 && (
          <p className="text-sm text-orange-600 font-semibold">
            You're on fire! Keep it up!
          </p>
        )}
        {dailyStreak.current_streak >= 7 && dailyStreak.current_streak < 14 && (
          <p className="text-sm text-orange-700 font-semibold">
            Amazing! One full week!
          </p>
        )}
        {dailyStreak.current_streak >= 14 && dailyStreak.current_streak < 30 && (
          <p className="text-sm text-red-600 font-semibold">
            Incredible! Two weeks strong!
          </p>
        )}
        {dailyStreak.current_streak >= 30 && (
          <p className="text-sm text-purple-600 font-semibold">
            LEGENDARY! You're unstoppable!
          </p>
        )}
      </div>

      {/* Milestone progress */}
      {dailyStreak.current_streak > 0 && dailyStreak.current_streak < 30 && (
        <div className="mt-4">
          <div className="text-xs text-gray-600 mb-1">
            Next milestone: {
              dailyStreak.current_streak < 3 ? '3 days' :
              dailyStreak.current_streak < 7 ? '7 days' :
              dailyStreak.current_streak < 14 ? '14 days' :
              '30 days'
            }
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{
                width: `${
                  dailyStreak.current_streak < 3
                    ? (dailyStreak.current_streak / 3) * 100
                    : dailyStreak.current_streak < 7
                    ? ((dailyStreak.current_streak - 3) / 4) * 100
                    : dailyStreak.current_streak < 14
                    ? ((dailyStreak.current_streak - 7) / 7) * 100
                    : ((dailyStreak.current_streak - 14) / 16) * 100
                }%`
              }}
            />
          </div>
        </div>
      )}

      {dailyStreak.last_completion_date && (
        <div className="text-xs text-gray-500 mt-4 text-center">
          Last active: {new Date(dailyStreak.last_completion_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default StreakDisplay;
