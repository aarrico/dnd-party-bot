#!/usr/bin/env node
/**
 * Standalone script to generate a session image without starting the bot
 * 
 * Usage:
 *   npm run generate-image <sessionId>
 *   or
 *   ts-node src/scripts/generate-session-image.ts <sessionId>
 * 
 * Example:
 *   npm run generate-image 1234567890
 */

import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { createSessionImage } from '../shared/messages/sessionImage.js';
import { Session, SessionStatus } from '#modules/session/domain/session.types.js';
import { PartyMemberImgInfo } from '../modules/session/domain/session.types.js';
import { setRoleCache } from '../modules/role/domain/roleManager.js';
import { getRoles } from '../modules/role/repository/role.repository.js';
import { createLogger, format, transports } from 'winston';

// Script-specific logger with console-only transport (no file logging for CLI output)
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.printf(({ message }) => String(message)),
  ),
  transports: [new transports.Console()],
});

// Initialize Prisma client
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * Mock function to get user avatar URL
 * In a real bot, this would fetch from Discord API
 * For the script, we'll use default Discord avatars
 */
const getMockAvatarURL = (userId: string): string => {
  // Use Discord's default avatars based on user ID
  const avatarIndex = parseInt(userId.slice(-1)) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`;
};

/**
 * Get party info for image generation
 */
const getPartyInfoForImg = async (sessionId: string): Promise<PartyMemberImgInfo[]> => {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      partyMembers: {
        include: {
          user: true,
          role: true,
        },
      },
    },
  });

  return session.partyMembers.map((member) => ({
    userId: member.user.id,
    username: member.user.username,
    displayName: member.user.username, // For testing, use username as displayName
    userAvatarURL: getMockAvatarURL(member.user.id),
    role: member.role.id,
  }));
};

/**
 * Main function to generate session image
 */
async function generateSessionImage(sessionId: string): Promise<void> {
  logger.info(`\n🎨 Generating session image for session: ${sessionId}\n`);

  const roles = await getRoles();
  setRoleCache(roles);
  try {
    // Fetch session data
    logger.info('📊 Fetching session data from database...');
    const sessionData = await prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
    });

    // Fetch party members
    logger.info('👥 Fetching party members...');
    const partyMembers = await getPartyInfoForImg(sessionId);

    if (partyMembers.length === 0) {
      logger.warn('⚠️  No party members found for this session');
      return;
    }

    // Check for Game Master
    const hasGM = partyMembers.some(member => member.role === 'GAME_MASTER');
    if (!hasGM) {
      logger.error('❌ Error: No Game Master found in party members');
      logger.info('Party members:', partyMembers.map(p => ({ username: p.username, role: p.role })));
      return;
    }

    // Prepare session object for image generation
    const session: Session = {
      id: sessionData.id,
      name: 'Night of the Bell\'s Toll',
      date: sessionData.date,
      campaignId: sessionData.campaignId,
      partyMessageId: sessionData.partyMessageId,
      eventId: sessionData.eventId,
      status: sessionData.status as SessionStatus,
      timezone: sessionData.timezone ?? 'America/Los_Angeles',
    };

    logger.info(`📝 Session: ${session.name}`);
    logger.info(`📅 Date: ${session.date.toLocaleDateString()} at ${session.date.toLocaleTimeString()}`);
    logger.info(`🌍 Timezone: ${session.timezone}`);
    logger.info(`📊 Status: ${session.status}`);
    logger.info(`👥 Party size: ${partyMembers.length}`);
    logger.info('Party members:');
    partyMembers.forEach(member => {
      logger.info(`  - ${member.displayName} (@${member.username}) (${member.role})`);
    });

    // Generate the image
    logger.info('\n🖼️  Generating session image...');
    await createSessionImage(session, partyMembers);

    logger.info('\n✅ Session image generated successfully!');
    logger.info('📂 Output location: resources/temp/current-session.png\n');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('No') && error.message.includes('found')) {
        logger.error(`\n❌ Error: Session with ID "${sessionId}" not found in database\n`);
      } else {
        logger.error(`\n❌ Error generating session image: ${error.message}`);
        logger.error(error);
      }
    } else {
      logger.error(`\n❌ Unknown error: ${String(error)}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get session ID from command line arguments
const sessionId = process.argv[2];

if (!sessionId) {
  logger.error(`
❌ Usage: npm run generate-image <sessionId>

Example:
  npm run generate-image 1234567890

Or with ts-node:
  ts-node src/scripts/generate-session-image.ts 1234567890
  `);
  process.exit(1);
}

// Run the script
void generateSessionImage(sessionId);
