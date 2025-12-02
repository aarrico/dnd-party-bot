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
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('SessionSchedulerService');

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
      logger.info('Scheduled reminder', {
        sessionId,
        reminderTime: reminderTime.toISOString(),
      });
    } else {
      logger.debug('Reminder time already passed', {
        sessionId,
        reminderTime: reminderTime.toISOString(),
      });
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
      logger.info('Scheduled cancellation check', {
        sessionId,
        cancelTime: cancelTime.toISOString(),
      });
    } else {
      logger.debug('Cancellation time already passed', {
        sessionId,
        cancelTime: cancelTime.toISOString(),
      });
    }

    if (task.reminderJob || task.cancellationJob) {
      this.scheduledTasks.set(sessionId, task);
    } else {
      logger.info('No tasks scheduled, all times passed', { sessionId });
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
      logger.info('Canceled scheduled tasks', { sessionId });
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
      logger.error('Failed to stop reminder job', { sessionId, error });
    }

    task.reminderJob = undefined;

    if (!task.cancellationJob) {
      this.scheduledTasks.delete(sessionId);
      logger.info('Cleared reminder task; no cancellation job remained', { sessionId });
    } else {
      this.scheduledTasks.set(sessionId, task);
      logger.info('Cleared reminder task; cancellation job still scheduled', { sessionId });
    }
  }

  private async handleReminder(sessionId: string): Promise<void> {
    logger.info('Handling session reminder', { sessionId });

    try {
      const session = await getSessionById(sessionId, true);

      const isPartyFull = session.partyMembers.length >= 6;
      logger.debug('Session reminder context', {
        sessionId,
        sessionName: session.name,
        partySize: session.partyMembers.length,
        isPartyFull,
      });

      await this.sendSessionReminders(session, isPartyFull);
      logger.info('Session reminder completed', { sessionId });
    } catch (error) {
      logger.error('Error handling reminder for session', { sessionId, error });
    } finally {
      this.clearReminderTask(sessionId);
    }
  }

  private async handleCancellation(sessionId: string): Promise<void> {
    logger.info('Handling session cancellation check', { sessionId });

    try {
      const session = await getSessionById(sessionId, true);

      const isPartyFull = session.partyMembers.length >= 6;
      logger.debug('Session cancellation context', {
        sessionId,
        sessionName: session.name,
        partySize: session.partyMembers.length,
        isPartyFull,
        willCancel: !isPartyFull,
      });

      if (!isPartyFull) {
        await this.cancelUnfilledSession(session);
      } else {
        logger.info('Session has full party; skipping cancellation', {
          sessionId,
          partySize: session.partyMembers.length,
        });

        try {
          const { updateSession } = await import('../modules/session/repository/session.repository.js');
          await updateSession(session.id, { status: 'ACTIVE' });
          logger.info('Updated session status to ACTIVE after full party', { sessionId: session.id });
        } catch (error) {
          logger.error('Failed to update session status to ACTIVE', {
            sessionId: session.id,
            error,
          });
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
          logger.info('Regenerated session image with ACTIVE status', { sessionId: session.id });
        } catch (error) {
          logger.error('Failed to regenerate session image during cancellation handling', { error });
        }
      }

      this.cancelSessionTasks(sessionId);
      logger.info('Session cancellation check completed', {
        sessionId,
        wasCanceled: !isPartyFull,
      });
    } catch (error) {
      logger.error('Error handling cancellation for session', { sessionId, error });
    }
  }

  private async sendSessionReminders(session: SessionWithParty, sendToPartyOnly: boolean): Promise<void> {
    logger.info('Sending session reminders', {
      sessionId: session.id,
      sessionName: session.name,
      partySize: session.partyMembers.length,
      sendToPartyOnly,
    });

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
          logger.debug('Sent reminder DM', {
            sessionId: session.id,
            userId: member.userId,
          });
          successCount++;
        } catch (error) {
          logger.error('Failed to send reminder DM', {
            sessionId: session.id,
            userId: member.userId,
            error,
          });
          failureCount++;
        }
      }

      logger.info('Reminder summary', {
        sessionId: session.id,
        successCount,
        failureCount,
      });
    } else {
      const { getUserTimezone } = await import('../modules/user/repository/user.repository.js');
      await notifyGuild(session.campaignId, async (userId: string) => {
        const userTimezone = await getUserTimezone(userId);
        return this.createReminderMessage(session, userTimezone);
      });
    }
  }

  private async cancelUnfilledSession(session: SessionWithParty): Promise<void> {
    logger.warn('Cancelling unfilled session', {
      sessionId: session.id,
      sessionName: session.name,
      partySize: session.partyMembers.length,
    });

    // Note: The cancellation message will be formatted per-user in the notifyGuild call
    // For now we use session timezone as the reason string, but notifyGuild doesn't use it directly for user messages
    const cancellationReason = `Insufficient players (${session.partyMembers.length}/6)`;

    try {
      const { cancelSession } = await import('../modules/session/controller/session.controller.js');
      await cancelSession(session.id, cancellationReason);
      logger.info('Successfully canceled unfilled session', { sessionId: session.id });
    } catch (error) {
      logger.error('Failed to cancel unfilled session', { sessionId: session.id, error });

      // Try direct database update as fallback
      try {
        const { updateSession } = await import('../modules/session/repository/session.repository.js');
        await updateSession(session.id, { status: 'CANCELED' });
        logger.warn('Fallback: updated session status to CANCELED directly', {
          sessionId: session.id,
        });
      } catch (fallbackError) {
        logger.error('Fallback cancellation update failed', {
          sessionId: session.id,
          error: fallbackError,
        });
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
      logger.info('Initializing session scheduler...');

      const { getSessions } = await import('../modules/session/repository/session.repository.js');

      const allSessions = await getSessions({
        includeId: true,
        includeTime: true,
        includeCampaign: false,
        includeUserRole: false,
      });

      const futureSessions = allSessions.filter(session => isFutureDate(session.date));

      logger.info('Future sessions found for scheduling', {
        count: futureSessions.length,
      });

      for (const session of futureSessions) {
        this.scheduleSessionTasks(session.id, session.date);
      }

      logger.info('Session scheduler initialization complete');
    } catch (error) {
      logger.error('Error initializing session scheduler', { error });
    }
  }

  public getScheduledTaskCount(): number {
    return this.scheduledTasks.size;
  }

  public shutdown(): void {
    logger.info('Shutting down session scheduler', {
      activeTasks: this.scheduledTasks.size,
    });

    for (const [sessionId, task] of this.scheduledTasks.entries()) {
      try {
        if (task.reminderJob) {
          task.reminderJob.stop();
        }
        if (task.cancellationJob) {
          task.cancellationJob.stop();
        }
        logger.info('Stopped scheduled tasks for session', { sessionId });
      } catch (error) {
        logger.error('Error stopping tasks for session', { sessionId, error });
      }
    }

    this.scheduledTasks.clear();
    logger.info('Session scheduler shutdown complete');
  }
}

export const sessionScheduler = SessionScheduler.getInstance();