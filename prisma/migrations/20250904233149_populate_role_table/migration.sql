INSERT INTO "role" (id, emoji_id, display_name, image_path, description)
VALUES ('GAME_MASTER', 'gm_emoji', 'Game Master', 'resources/images/tank-display.png',
        'Leads and manages the game.'),
       ('TANK', 'tank_emoji', 'Tank', 'resources/images/tank-display.png',
        'Front-line defender who absorbs damage.'),
       ('SUPPORT', 'support_emoji', 'Support', 'resources/images/support-display.png',
        'Heals and buffs the party.'),
       ('RANGE_DPS', 'ranged_emoji', 'Range DPS', 'resources/images/range-dps-display.png',
        'Ranged damage dealer.'),
       ('MELEE_DPS', 'melee_emoji', 'Melee DPS', 'resources/images/melee-dps-display.png',
        'Close combat striker.'),
       ('FACE', 'face_emoji', 'Face', 'resources/images/face-display.png', 'Party spokesperson.'),
       ('CONTROL', 'control_emoji', 'Control', 'resources/images/control-display.png',
        'Battlefield controller.') ON CONFLICT (id) DO NOTHING;