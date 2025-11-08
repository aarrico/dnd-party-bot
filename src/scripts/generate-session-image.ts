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

import { PrismaClient } from '@prisma/client';
import { createSessionImage } from '../shared/messages/sessionImage.js';
import { Session } from '../modules/session/domain/session.types.js';
import { PartyMemberImgInfo } from '../models/discord.js';
import { setRoleCache } from '../models/role.js';
import { getRoles } from '../modules/role/repository/role.repository.js';

// Initialize Prisma client
const prisma = new PrismaClient();

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
    userAvatarURL: getMockAvatarURL(member.user.id),
    role: member.role.id,
  }));
};

/**
 * Main function to generate session image
 */
async function generateSessionImage(sessionId: string): Promise<void> {
  console.log(`\n🎨 Generating session image for session: ${sessionId}\n`);

  const roles = await getRoles();
  setRoleCache(roles);
  try {
    // Fetch session data
    console.log('📊 Fetching session data from database...');
    const sessionData = await prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
    });

    // Fetch party members
    console.log('👥 Fetching party members...');
    const partyMembers = await getPartyInfoForImg(sessionId);

    if (partyMembers.length === 0) {
      console.warn('⚠️  No party members found for this session');
      return;
    }

    // Check for Game Master
    const hasGM = partyMembers.some(member => member.role === 'GAME_MASTER');
    if (!hasGM) {
      console.error('❌ Error: No Game Master found in party members');
      console.log('Party members:', partyMembers.map(p => ({ username: p.username, role: p.role })));
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
      status: sessionData.status as 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED',
      timezone: sessionData.timezone ?? 'America/Los_Angeles',
    };

    console.log(`📝 Session: ${session.name}`);
    console.log(`📅 Date: ${session.date.toLocaleDateString()} at ${session.date.toLocaleTimeString()}`);
    console.log(`🌍 Timezone: ${session.timezone}`);
    console.log(`📊 Status: ${session.status}`);
    console.log(`👥 Party size: ${partyMembers.length}`);
    console.log('Party members:');
    partyMembers.forEach(member => {
      console.log(`  - ${member.username} (${member.role})`);
    });

    // Generate the image
    console.log('\n🖼️  Generating session image...');
    await createSessionImage(session, partyMembers);

    console.log('\n✅ Session image generated successfully!');
    console.log('📂 Output location: resources/temp/current-session.png\n');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('No') && error.message.includes('found')) {
        console.error(`\n❌ Error: Session with ID "${sessionId}" not found in database\n`);
      } else {
        console.error(`\n❌ Error generating session image:`, error.message);
        console.error(error);
      }
    } else {
      console.error(`\n❌ Unknown error:`, error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get session ID from command line arguments
const sessionId = process.argv[2];

if (!sessionId) {
  console.error(`
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
