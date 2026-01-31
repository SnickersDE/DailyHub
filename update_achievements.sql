-- Add claimed_achievement_ids to user_stats for persistence
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS claimed_achievement_ids text[] DEFAULT '{}';

-- Add unlocked_achievement_ids if not exists (it was missing in sync)
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS unlocked_achievement_ids text[] DEFAULT '{}';
