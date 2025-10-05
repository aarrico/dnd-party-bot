-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "timezone" SET DEFAULT 'America/Los_Angeles';

-- Migrate existing timezone data from abbreviations to IANA format
UPDATE "public"."user"
SET "timezone" = CASE
  WHEN "timezone" IN ('PST', 'PDT') THEN 'America/Los_Angeles'
  WHEN "timezone" IN ('MST', 'MDT') THEN 'America/Denver'
  WHEN "timezone" IN ('CST', 'CDT') THEN 'America/Chicago'
  WHEN "timezone" IN ('EST', 'EDT') THEN 'America/New_York'
  WHEN "timezone" = 'AKST' OR "timezone" = 'AKDT' THEN 'America/Anchorage'
  WHEN "timezone" = 'HST' THEN 'Pacific/Honolulu'
  WHEN "timezone" = 'UTC' THEN 'America/Los_Angeles' -- Default fallback
  WHEN "timezone" = 'GMT' THEN 'America/Los_Angeles' -- Default fallback
  ELSE "timezone" -- Keep IANA format if already set
END
WHERE "timezone" NOT LIKE 'America/%' AND "timezone" NOT LIKE 'Pacific/%';
