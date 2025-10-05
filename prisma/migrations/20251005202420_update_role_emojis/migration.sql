-- Update role emoji_id to use actual Unicode emojis
UPDATE "role" SET "emoji_id" = '👑' WHERE "id" = 'GAME_MASTER';
UPDATE "role" SET "emoji_id" = '🛡️' WHERE "id" = 'TANK';
UPDATE "role" SET "emoji_id" = '💚' WHERE "id" = 'SUPPORT';
UPDATE "role" SET "emoji_id" = '🏹' WHERE "id" = 'RANGE_DPS';
UPDATE "role" SET "emoji_id" = '⚔️' WHERE "id" = 'MELEE_DPS';
UPDATE "role" SET "emoji_id" = '🎭' WHERE "id" = 'FACE';
UPDATE "role" SET "emoji_id" = '🧙' WHERE "id" = 'CONTROL';