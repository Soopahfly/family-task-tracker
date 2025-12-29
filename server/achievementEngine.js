import db from './db.js';
import crypto from 'crypto';

/**
 * Achievement Engine - Checks and awards achievements based on user activity
 */

/**
 * Check all achievements for a family member and award any newly earned ones
 * @param {string} familyMemberId - The ID of the family member
 * @returns {object} - { newAchievements: [], updatedProgress: [] }
 */
export function checkAchievements(familyMemberId) {
  const newAchievements = [];
  const updatedProgress = [];

  // Get all achievements
  const allAchievements = db.prepare('SELECT * FROM achievements').all();

  // Get user's current achievements
  const userAchievements = db.prepare(
    'SELECT achievement_id FROM user_achievements WHERE family_member_id = ? AND earned_at IS NOT NULL'
  ).all(familyMemberId);

  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));

  // Check each achievement
  for (const achievement of allAchievements) {
    // Skip if already earned
    if (earnedAchievementIds.has(achievement.id)) {
      continue;
    }

    const progress = calculateProgress(familyMemberId, achievement);

    if (progress >= achievement.requirement_value) {
      // Award achievement
      const userAchievementId = crypto.randomBytes(16).toString('hex');
      db.prepare(`
        INSERT OR REPLACE INTO user_achievements (id, family_member_id, achievement_id, progress, earned_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(userAchievementId, familyMemberId, achievement.id, achievement.requirement_value);

      // Award bonus points
      if (achievement.points_reward > 0) {
        db.prepare('UPDATE family_members SET points = points + ? WHERE id = ?')
          .run(achievement.points_reward, familyMemberId);
      }

      newAchievements.push({
        ...achievement,
        progress: achievement.requirement_value
      });
    } else {
      // Update progress for partial achievements
      const existingProgress = db.prepare(
        'SELECT * FROM user_achievements WHERE family_member_id = ? AND achievement_id = ?'
      ).get(familyMemberId, achievement.id);

      if (!existingProgress) {
        // Create progress entry
        const userAchievementId = crypto.randomBytes(16).toString('hex');
        db.prepare(`
          INSERT INTO user_achievements (id, family_member_id, achievement_id, progress)
          VALUES (?, ?, ?, ?)
        `).run(userAchievementId, familyMemberId, achievement.id, progress);
      } else if (existingProgress.progress !== progress) {
        // Update existing progress
        db.prepare(`
          UPDATE user_achievements SET progress = ? WHERE family_member_id = ? AND achievement_id = ?
        `).run(progress, familyMemberId, achievement.id);
      }

      updatedProgress.push({
        ...achievement,
        progress
      });
    }
  }

  return { newAchievements, updatedProgress };
}

/**
 * Calculate current progress for an achievement
 * @param {string} familyMemberId - The ID of the family member
 * @param {object} achievement - The achievement object
 * @returns {number} - Current progress value
 */
function calculateProgress(familyMemberId, achievement) {
  const { requirement_type } = achievement;

  switch (requirement_type) {
    case 'tasks_completed': {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM task_history WHERE family_member_id = ?
      `).get(familyMemberId);
      return result.count;
    }

    case 'streak_days': {
      const streak = db.prepare(`
        SELECT current_streak FROM streaks WHERE family_member_id = ? AND streak_type = 'daily'
      `).get(familyMemberId);
      return streak ? streak.current_streak : 0;
    }

    case 'total_points': {
      const member = db.prepare('SELECT points FROM family_members WHERE id = ?').get(familyMemberId);
      return member ? member.points : 0;
    }

    case 'early_tasks': {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM task_history
        WHERE family_member_id = ?
        AND CAST(strftime('%H', completed_at) AS INTEGER) < 9
      `).get(familyMemberId);
      return result.count;
    }

    case 'weekend_tasks': {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM task_history
        WHERE family_member_id = ?
        AND CAST(strftime('%w', completed_at) AS INTEGER) IN (0, 6)
      `).get(familyMemberId);
      return result.count;
    }

    case 'perfect_week': {
      // Check if user completed at least one task every day for 7 consecutive days
      const history = db.prepare(`
        SELECT DATE(completed_at) as date FROM task_history
        WHERE family_member_id = ?
        ORDER BY completed_at DESC
        LIMIT 100
      `).all(familyMemberId);

      if (history.length === 0) return 0;

      const dates = [...new Set(history.map(h => h.date))];
      let consecutiveDays = 1;
      let maxConsecutiveDays = 1;

      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          consecutiveDays++;
          maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
        } else {
          consecutiveDays = 1;
        }
      }

      return maxConsecutiveDays >= 7 ? 1 : 0;
    }

    default:
      return 0;
  }
}

/**
 * Get all achievements with progress for a family member
 * @param {string} familyMemberId - The ID of the family member
 * @returns {object[]} - Array of achievements with progress and earned status
 */
export function getAchievementsWithProgress(familyMemberId) {
  const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY category, requirement_value').all();

  const userAchievements = db.prepare(`
    SELECT achievement_id, progress, earned_at
    FROM user_achievements
    WHERE family_member_id = ?
  `).all(familyMemberId);

  const userAchievementMap = new Map(
    userAchievements.map(ua => [ua.achievement_id, ua])
  );

  return allAchievements.map(achievement => {
    const userAchievement = userAchievementMap.get(achievement.id);
    const isEarned = userAchievement && userAchievement.earned_at !== null;
    const progress = userAchievement ? userAchievement.progress : calculateProgress(familyMemberId, achievement);

    return {
      ...achievement,
      earned: isEarned,
      earned_at: userAchievement?.earned_at || null,
      progress,
      progress_percentage: Math.min(100, Math.round((progress / achievement.requirement_value) * 100))
    };
  });
}
