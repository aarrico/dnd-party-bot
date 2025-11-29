import { CronJob } from 'cron';
import { client } from '../index.js';
import { getSessionById } from '../modules/session/repository/session.repository.js';
import { SessionWithParty } from '../modules/session/domain/session.types.js';
import { notifyGuild } from '../shared/discord/messages.js';
import {
  getHoursBefore,
  getMinutesBefore,
  formatSessionDateLong,
  isFutureDate
} from '../shared/datetime/dateUtils.js';

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
    this.cancelSessionTasks(sessionId);

    const reminderTime = getHoursBefore(sessionDate, 1); // 1 hour before
    const cancelTime = getMinutesBefore(sessionDate, 5); // 5 minutes before start

    const task: ScheduledTask = { sessionId };

    if (isFutureDate(reminderTime)) {
      const reminderJob = new CronJob(
        reminderTime,
        () => this.handleReminder(sessionId),
        null,
        true,
        'UTC'
      );
      task.reminderJob = reminderJob;
      console.log(`Scheduled reminder for session ${sessionId} at ${reminderTime.toISOString()} (UTC)`);
    } else {
      console.log(`Session ${sessionId} reminder time has already passed (${reminderTime.toISOString()})`);
    }

    if (isFutureDate(cancelTime)) {
      const cancellationJob = new CronJob(
        cancelTime,
        () => this.handleCancellation(sessionId),
        null,
        true,
        'UTC'
      );
      task.cancellationJob = cancellationJob;
      console.log(`Scheduled cancellation check for session ${sessionId} at ${cancelTime.toISOString()} (UTC)`);
    } else {
      console.log(`Session ${sessionId} cancellation time has already passed (${cancelTime.toISOString()})`);
    }

    if (task.reminderJob || task.cancellationJob) {
      this.scheduledTasks.set(sessionId, task);
    } else {
      console.log(`No tasks scheduled for session ${sessionId} - all times have passed`);
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

  private clearReminderTask(sessionId: string): void {
    const task = this.scheduledTasks.get(sessionId);
    if (!task?.reminderJob) {
      return;
    }

    try {
      task.reminderJob.stop();
    } catch (error) {
      console.error(`Failed to stop reminder job for session ${sessionId}:`, error);
    }

    task.reminderJob = undefined;

    if (!task.cancellationJob) {
      this.scheduledTasks.delete(sessionId);
      console.log(`Cleared reminder task for session ${sessionId}; no cancellation job remained`);
    } else {
      this.scheduledTasks.set(sessionId, task);
      console.log(`Cleared reminder task for session ${sessionId}; cancellation job still scheduled`);
    }
  }

  private async handleReminder(sessionId: string): Promise<void> {
    try {
      const session = await getSessionById(sessionId, true);

      const isPartyFull = session.partyMembers.length >= 6;

      await this.sendSessionReminders(session, isPartyFull);
    } catch (error) {
      console.error(`Error handling reminder/cancellation for session ${sessionId}:`, error);
    } finally {
      this.clearReminderTask(sessionId);
    }
  }

  private async handleCancellation(sessionId: string): Promise<void> {
    try {
      const session = await getSessionById(sessionId, true);

      const isPartyFull = session.partyMembers.length >= 6;

      if (!isPartyFull) {
        await this.cancelUnfilledSession(session);
      } else {
        console.log(`Session ${sessionId} has a full party (${session.partyMembers.length}/6), no cancellation needed`);

        try {
          const { updateSession } = await import('../modules/session/repository/session.repository.js');
          await updateSession(session.id, { status: 'ACTIVE' });
          console.log(`Updated session ${session.id} status to ACTIVE`);
        } catch (error) {
          console.error(`CRITICAL: Failed to update session ${session.id} status to ACTIVE:`, error);
        }

        try {
          const { createSessionImage } = await import('../shared/messages/sessionImage.js');
          const { getPartyInfoForImg } = await import('../modules/session/controller/session.controller.js');
          const party = await getPartyInfoForImg(session.id);
          const sessionData = {
            id: session.id,
            name: session.name,
            date: session.date,
            campaignId: session.campaignId,
            partyMessageId: session.partyMessageId ?? '',
            eventId: session.eventId,
            status: 'ACTIVE' as const,
            timezone: session.timezone ?? 'America/Los_Angeles',
          };
          await createSessionImage(sessionData, party);
          console.log(`Regenerated session image with ACTIVE status border`);
        } catch (error) {
          console.error(`Failed to regenerate session image:`, error);
        }
      }

      this.cancelSessionTasks(sessionId);
    } catch (error) {
      console.error(`Error handling cancellation for session ${sessionId}:`, error);
    }
  }

  private async sendSessionReminders(session: SessionWithParty, sendToPartyOnly: boolean): Promise<void> {
    console.log(`Sending reminders for session ${session.name} to ${session.partyMembers.length} members`);

    if (sendToPartyOnly) {
      let successCount = 0;
      let failureCount = 0;

      for (const member of session.partyMembers) {
        try {
          const { getUserTimezone } = await import('../modules/user/repository/user.repository.js');
          const userTimezone = await getUserTimezone(member.userId);
          const reminderMessage = this.createReminderMessage(session, userTimezone);

          const user = await client.users.fetch(member.userId);
          await user.send(reminderMessage);
          console.log(`Sent reminder to ${member.username} (${member.userId})`);
          successCount++;
        } catch (error) {
          console.error(`Failed to send reminder to ${member.username} (${member.userId}):`, error);
          failureCount++;
        }
      }

      console.log(`Reminder summary for session ${session.id}: ${successCount} sent, ${failureCount} failed`);
    } else {
      const { getUserTimezone } = await import('../modules/user/repository/user.repository.js');
      await notifyGuild(session.campaignId, async (userId: string) => {
        const userTimezone = await getUserTimezone(userId);
        return this.createReminderMessage(session, userTimezone);
      });
    }
  }

  private async cancelUnfilledSession(session: SessionWithParty): Promise<void> {
    console.log(`Cancelling unfilled session ${session.name} - only ${session.partyMembers.length}/6 members`);

    // Note: The cancellation message will be formatted per-user in the notifyGuild call
    // For now we use session timezone as the reason string, but notifyGuild doesn't use it directly for user messages
    const cancellationReason = `Insufficient players (${session.partyMembers.length}/6)`;

    try {
      const { cancelSession } = await import('../modules/session/controller/session.controller.js');
      await cancelSession(session.id, cancellationReason);
      console.log(`Successfully canceled unfilled session ${session.id}`);
    } catch (error) {
      console.error(`CRITICAL: Failed to cancel unfilled session ${session.id}:`, error);

      // Try direct database update as fallback
      try {
        const { updateSession } = await import('../modules/session/repository/session.repository.js');
        await updateSession(session.id, { status: 'CANCELED' });
        console.log(`Fallback: Updated session ${session.id} status to CANCELED directly`);
      } catch (fallbackError) {
        console.error(`CRITICAL: Even fallback database update failed for session ${session.id}:`, fallbackError);
      }
    }
  }


  private createReminderMessage(session: SessionWithParty, timezone: string): string {
    const sessionTime = formatSessionDateLong(session.date, timezone);

    return `⏰ **Session Reminder**\n\n` +
      `🎲 **[${session.name}](https://discord.com/channels/${session.campaignId}/${session.id}/${session.partyMessageId})** starts in 1 hour!\n` +
      `📅 **Time:** ${sessionTime}\n` +
      `🏰 **Channel:** <#${session.id}>\n` +
      `👥 **Party Size:** ${session.partyMembers.length}/6 members\n\n` +
      `See you at the table! 🎯`;
  }


  private createCancellationMessage(session: SessionWithParty, timezone: string): string {
    const sessionTime = formatSessionDateLong(session.date, timezone);

    return `❌ **Session Canceled**\n\n` +
      `🎲 **[${session.name}](https://discord.com/channels/${session.campaignId}/${session.id}/${session.partyMessageId})** has been canceled due to insufficient players.\n` +
      `📅 **Was scheduled for:** ${sessionTime}\n` +
      `👥 **Party Size:** ${session.partyMembers.length}/6 members (minimum 6 required)\n\n` +
      `We need a full party to run the session. Please try scheduling a new session when more players are available! 🎯`;
  }

  public async initializeExistingSessions(): Promise<void> {
    try {
      console.log('Initializing session scheduler...');

      const { getSessions } = await import('../modules/session/repository/session.repository.js');

      const allSessions = await getSessions({
        includeId: true,
        includeTime: true,
        includeCampaign: false,
        includeUserRole: false,
      });

      const futureSessions = allSessions.filter(session => isFutureDate(session.date));

      console.log(`Found ${futureSessions.length} future sessions to schedule`);

      for (const session of futureSessions) {
        this.scheduleSessionTasks(session.id, session.date);
      }

      console.log('Session scheduler initialization complete');
    } catch (error) {
      console.error('Error initializing session scheduler:', error);
    }
  }

  public getScheduledTaskCount(): number {
    return this.scheduledTasks.size;
  }

  public shutdown(): void {
    console.log(`Shutting down session scheduler with ${this.scheduledTasks.size} active tasks...`);

    for (const [sessionId, task] of this.scheduledTasks.entries()) {
      try {
        if (task.reminderJob) {
          task.reminderJob.stop();
        }
        if (task.cancellationJob) {
          task.cancellationJob.stop();
        }
        console.log(`Stopped tasks for session ${sessionId}`);
      } catch (error) {
        console.error(`Error stopping tasks for session ${sessionId}:`, error);
      }
    }

    this.scheduledTasks.clear();
    console.log('Session scheduler shutdown complete');
  }
}

export const sessionScheduler = SessionScheduler.getInstance();