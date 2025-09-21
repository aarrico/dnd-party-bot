import { CronJob } from 'cron';
import { client } from '../index.js';
import { getSessionById } from '../db/session.js';
import { SessionWithParty } from '../models/session.js';

interface ScheduledTask {
  sessionId: string;
  reminderJob?: CronJob;
  cancellationJob?: CronJob;
}

class SessionScheduler {
  private static instance: SessionScheduler;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();

  private constructor() { }

  public static getInstance(): SessionScheduler {
    if (!SessionScheduler.instance) {
      SessionScheduler.instance = new SessionScheduler();
    }
    return SessionScheduler.instance;
  }

  public scheduleSessionTasks(sessionId: string, sessionDate: Date): void {
    this.cancelSessionTasks(sessionId); // Remove any existing tasks

    const now = new Date();
    const reminderTime = new Date(sessionDate.getTime() - 60 * 60 * 1000); // 1 hour before

    if (reminderTime > now) {
      const reminderJob = new CronJob(
        reminderTime,
        () => this.handleReminderAndCancellation(sessionId),
        null,
        true,
        'America/Los_Angeles'
      );

      this.scheduledTasks.set(sessionId, {
        sessionId,
        reminderJob,
      });

      console.log(`Scheduled reminder/cancellation check for session ${sessionId} at ${reminderTime.toISOString()}`);
    } else {
      console.log(`Session ${sessionId} reminder time has already passed, not scheduling`);
    }
  }

  public cancelSessionTasks(sessionId: string): void {
    const task = this.scheduledTasks.get(sessionId);
    if (task) {
      if (task.reminderJob) {
        task.reminderJob.stop();
      }
      if (task.cancellationJob) {
        task.cancellationJob.stop();
      }
      this.scheduledTasks.delete(sessionId);
      console.log(`Canceled scheduled tasks for session ${sessionId}`);
    }
  }

  private async handleReminderAndCancellation(sessionId: string): Promise<void> {
    try {
      const session = await getSessionById(sessionId, true);

      // Check if party is full (6 members including GM)
      const partySize = session.partyMembers.length;
      const isPartyFull = partySize >= 6;

      if (isPartyFull) {
        // Send reminders to all party members
        await this.sendSessionReminders(session);
      } else {
        // Cancel the session due to insufficient players
        await this.cancelUnfilledSession(session);
      }

      // Clean up the scheduled task
      this.cancelSessionTasks(sessionId);
    } catch (error) {
      console.error(`Error handling reminder/cancellation for session ${sessionId}:`, error);
    }
  }

  private async sendSessionReminders(session: SessionWithParty): Promise<void> {
    console.log(`Sending reminders for session ${session.name} to ${session.partyMembers.length} members`);

    // Update session status to ACTIVE since it's about to start
    const { updateSession } = await import('../db/session.js');
    await updateSession(session.id, { status: 'ACTIVE' });
    console.log(`Updated session ${session.id} status to ACTIVE`);

    // Regenerate session image with new status border (gold for ACTIVE)
    try {
      const { createSessionImage } = await import('../utils/sessionImage.js');
      await createSessionImage(session.id);
      console.log(`Regenerated session image with ACTIVE status border`);
    } catch (error) {
      console.error(`Failed to regenerate session image:`, error);
    }

    const reminderMessage = this.createReminderMessage(session);

    for (const member of session.partyMembers) {
      try {
        const user = await client.users.fetch(member.userId);
        await user.send(reminderMessage);
        console.log(`Sent reminder to ${member.username} (${member.userId})`);
      } catch (error) {
        console.error(`Failed to send reminder to ${member.username} (${member.userId}):`, error);
      }
    }
  }

  private async cancelUnfilledSession(session: SessionWithParty): Promise<void> {
    console.log(`Cancelling unfilled session ${session.name} - only ${session.partyMembers.length}/6 members`);

    const cancellationMessage = this.createCancellationMessage(session);

    // for (const member of session.partyMembers) {
    //   try {
    //     const user = await client.users.fetch(member.userId);
    //     await user.send(cancellationMessage);
    //     console.log(`Sent cancellation notice to ${member.username} (${member.userId})`);
    //   } catch (error) {
    //     console.error(`Failed to send cancellation notice to ${member.username} (${member.userId}):`, error);
    //   }
    // }

    // Clean up the session - delete the Discord channel and database entry
    try {
      const { cancelSession } = await import('../controllers/session.js');
      await cancelSession(session.id, cancellationMessage);
    } catch (error) {
      console.error(`Failed to clean up canceled session ${session.id}:`, error);
    }
  }

  /**
   * Create reminder message for session participants
   */
  private createReminderMessage(session: SessionWithParty): string {
    const sessionTime = session.date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return `⏰ **Session Reminder**\n\n` +
      `🎲 **${session.name}** starts in 1 hour!\n` +
      `📅 **Time:** ${sessionTime}\n` +
      `🏰 **Channel:** <#${session.id}>\n` +
      `👥 **Party Size:** ${session.partyMembers.length}/6 members\n\n` +
      `See you at the table! 🎯`;
  }

  /**
   * Create cancellation message for session participants
   */
  private createCancellationMessage(session: SessionWithParty): string {
    const sessionTime = session.date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return `❌ **Session Canceled**\n\n` +
      `🎲 **${session.name}** has been canceled due to insufficient players.\n` +
      `📅 **Was scheduled for:** ${sessionTime}\n` +
      `👥 **Party Size:** ${session.partyMembers.length}/6 members (minimum 6 required)\n\n` +
      `We need a full party to run the session. Please try scheduling a new session when more players are available! 🎯`;
  }

  /**
   * Initialize scheduler by loading existing sessions that need scheduling
   */
  public async initializeExistingSessions(): Promise<void> {
    try {
      console.log('Initializing session scheduler...');

      const { getSessions } = await import('../db/session.js');

      // Get all sessions scheduled for the future
      const allSessions = await getSessions({
        includeId: true,
        includeTime: true,
        includeCampaign: false,
        includeUserRole: false,
      });

      const futureSessions = allSessions.filter(session => session.date > new Date());

      console.log(`Found ${futureSessions.length} future sessions to schedule`);

      for (const session of futureSessions) {
        this.scheduleSessionTasks(session.id, session.date);
      }

      console.log('Session scheduler initialization complete');
    } catch (error) {
      console.error('Error initializing session scheduler:', error);
    }
  }

  /**
   * Get number of currently scheduled tasks (for monitoring)
   */
  public getScheduledTaskCount(): number {
    return this.scheduledTasks.size;
  }
}

// Export singleton instance
export const sessionScheduler = SessionScheduler.getInstance();