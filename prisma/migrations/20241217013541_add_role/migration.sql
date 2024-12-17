-- CreateTable
CREATE TABLE "role"
(
    "id"       UUID NOT NULL DEFAULT gen_random_uuid(),
    "name"     TEXT NOT NULL,
    "emoji_id" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

INSERT INTO role (name, emoji_id)
VALUES ('Tank',
        '1227069036806799440'),
       ('Support',
        '1227069035070488618'),
       ('Range DPS',
        '1227069033094844416'),
       ('Melee DPS',
        '1227069030590845113'),
       ('Face',
        '1227069028930027570'),
       ('Control',
        '1227069027172749354');