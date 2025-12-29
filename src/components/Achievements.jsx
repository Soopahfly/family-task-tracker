import { useState, useEffect } from 'react';
import { Trophy, Award, Star, Lock, Filter } from 'lucide-react';
import { achievementsAPI } from '../utils/api';

function Achievements({ familyMembers }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (familyMembers.length > 0 && !selectedMember) {
      setSelectedMember(familyMembers[0].id);
    }
  }, [familyMembers]);

  useEffect(() => {
    if (selectedMember) {
      loadAchievements();
    }
  }, [selectedMember]);

  const loadAchievements = async () => {
    if (!selectedMember) return;

    try {
      setLoading(true);
      const data = await achievementsAPI.getForMember(selectedMember);
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-gray-100 text-gray-700 border-gray-300',
      uncommon: 'bg-green-100 text-green-700 border-green-300',
      rare: 'bg-blue-100 text-blue-700 border-blue-300',
      epic: 'bg-purple-100 text-purple-700 border-purple-300',
      legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBadgeColor = (rarity) => {
    const colors = {
      common: 'bg-gray-500 text-white',
      uncommon: 'bg-green-500 text-white',
      rare: 'bg-blue-500 text-white',
      epic: 'bg-purple-500 text-white',
      legendary: 'bg-yellow-500 text-white'
    };
    return colors[rarity] || colors.common;
  };

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'streaks', label: 'Streaks' },
    { value: 'completion', label: 'Completion' },
    { value: 'time', label: 'Time-based' },
    { value: 'points', label: 'Points' }
  ];

  const filteredAchievements = achievements.filter(
    a => filterCategory === 'all' || a.category === filterCategory
  );

  const earnedAchievements = filteredAchievements.filter(a => a.earned);
  const inProgressAchievements = filteredAchievements.filter(a => !a.earned && a.progress > 0);
  const lockedAchievements = filteredAchievements.filter(a => !a.earned && a.progress === 0);

  if (familyMembers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Trophy size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No family members yet</h2>
        <p className="text-gray-500">Add family members to track achievements!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Achievements
        </h2>
      </div>

      {/* Member selector */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Family Member</label>
          <select
            value={selectedMember || ''}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Filter size={14} className="inline mr-1" />
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Loading achievements...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Earned Achievements */}
          {earnedAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Star className="text-yellow-500" />
                Earned ({earnedAchievements.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedAchievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Achievements */}
          {inProgressAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Award className="text-blue-500" />
                In Progress ({inProgressAchievements.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressAchievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Lock className="text-gray-400" />
                Locked ({lockedAchievements.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedAchievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Trophy size={64} className="mx-auto mb-4 opacity-50" />
              <p>No achievements in this category yet!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement }) {
  const isEarned = achievement.earned;
  const isLocked = achievement.progress === 0 && !isEarned;

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-gray-100 text-gray-700 border-gray-300',
      uncommon: 'bg-green-100 text-green-700 border-green-300',
      rare: 'bg-blue-100 text-blue-700 border-blue-300',
      epic: 'bg-purple-100 text-purple-700 border-purple-300',
      legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBadgeColor = (rarity) => {
    const colors = {
      common: 'bg-gray-500 text-white',
      uncommon: 'bg-green-500 text-white',
      rare: 'bg-blue-500 text-white',
      epic: 'bg-purple-500 text-white',
      legendary: 'bg-yellow-500 text-white'
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div
      className={`border-2 rounded-xl p-4 transition-all ${
        isLocked ? 'opacity-50 grayscale' : ''
      } ${
        isEarned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' : getRarityColor(achievement.rarity)
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-4xl">{achievement.icon}</div>
        {isLocked && <Lock size={20} className="text-gray-400" />}
        {isEarned && <Star size={20} className="text-yellow-500 fill-yellow-500" />}
      </div>

      <h4 className="font-bold text-lg mb-1">{achievement.name}</h4>
      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>

      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRarityBadgeColor(achievement.rarity)}`}>
          {achievement.rarity.toUpperCase()}
        </span>
        {achievement.points_reward > 0 && (
          <span className="text-purple-600 font-semibold text-sm">
            +{achievement.points_reward} pts
          </span>
        )}
      </div>

      {!isEarned && achievement.progress > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{achievement.progress} / {achievement.requirement_value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${achievement.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {isEarned && achievement.earned_at && (
        <p className="text-xs text-gray-500 mt-2">
          Earned {new Date(achievement.earned_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default Achievements;
