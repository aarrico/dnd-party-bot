import { CronJob } from 'cron';
import { getSessionById } from '../modules/session/repository/session.repository.js';
import { SessionWithParty } from '../modules/session/domain/session.types.js';
import {
  getHoursBefore,
  getMinutesBefore,
  formatSessionDateLong,
  isFutureDate,
} from '../shared/datetime/dateUtils.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import { getUserTimezone } from '../modules/user/repository/user.repository.js';
import { notifyParty } from '../shared/discord/messages.js';

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

    logger.info('Scheduling tasks for session', {
      sessionId,
      sessionDate: sessionDate.toISOString(),
      reminderTime: reminderTime.toISOString(),
      cancelTime: cancelTime.toISOString(),
    });

    if (isFutureDate(reminderTime)) {
      const reminderJob = new CronJob(
        reminderTime,
        () => this.handleReminder(sessionId),
        null,
        true,
        'UTC'
      );
      task.reminderJob = reminderJob;
      logger.info('✅ Scheduled reminder job', {
        sessionId,
        reminderTime: reminderTime.toISOString(),
      });
    } else {
      logger.info('⏭️ Reminder time already passed, skipping', {
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
      logger.info('✅ Scheduled cancellation check job', {
        sessionId,
        cancelTime: cancelTime.toISOString(),
      });
    } else {
      logger.info('⏭️ Cancellation time already passed, skipping', {
        sessionId,
        cancelTime: cancelTime.toISOString(),
      });
    }

    if (task.reminderJob || task.cancellationJob) {
      this.scheduledTasks.set(sessionId, task);
      logger.info('Session tasks registered', {
        sessionId,
        hasReminder: !!task.reminderJob,
        hasCancellation: !!task.cancellationJob,
      });
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
      logger.info('Cleared reminder task; no cancellation job remained', {
        sessionId,
      });
    } else {
      this.scheduledTasks.set(sessionId, task);
      logger.info('Cleared reminder task; cancellation job still scheduled', {
        sessionId,
      });
    }
  }

  private async handleReminder(sessionId: string): Promise<void> {
    logger.info('Handling session reminder', { sessionId });

    try {
      const session = await getSessionById(sessionId, true);

      logger.debug('Session reminder context', {
        sessionId,
        sessionName: session.name,
        partySize: session.partyMembers.length,
      });

      // Send reminder DMs to party members (status will change to ACTIVE at 5 min mark)
      await this.sendSessionReminders(session);
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
          const { updateSession } = await import(
            '../modules/session/repository/session.repository.js'
          );
          await updateSession(session.id, { status: 'ACTIVE' });
          logger.info('Updated session status to ACTIVE after full party', {
            sessionId: session.id,
          });
        } catch (error) {
          logger.error('Failed to update session status to ACTIVE', {
            sessionId: session.id,
            error,
          });
        }

        try {
          const { regenerateSessionMessage } = await import(
            '../modules/session/controller/session.controller.js'
          );
          await regenerateSessionMessage(session.id, session.campaignId);
          logger.info('Regenerated and updated session message with ACTIVE status', {
            sessionId: session.id,
          });
        } catch (error) {
          logger.error(
            'Failed to regenerate session message during cancellation handling',
            { sessionId: session.id, error }
          );
        }
      }

      this.cancelSessionTasks(sessionId);
      logger.info('Session cancellation check completed', {
        sessionId,
        wasCanceled: !isPartyFull,
      });
    } catch (error) {
      logger.error('Error handling cancellation for session', {
        sessionId,
        error,
      });
    }
  }

  private async sendSessionReminders(session: SessionWithParty): Promise<void> {
    logger.info('Sending session reminders', {
      sessionId: session.id,
      sessionName: session.name,
      partySize: session.partyMembers.length,
    });

    const partyMemberIds = session.partyMembers.map((member) => member.userId);

    await notifyParty(partyMemberIds, async (userId: string) => {
      const userTimezone = await getUserTimezone(userId);
      return this.createReminderMessage(session, userTimezone);
    });

    logger.info('Session reminders sent', { sessionId: session.id });
  }

  private async cancelUnfilledSession(
    session: SessionWithParty
  ): Promise<void> {
    logger.warn('Cancelling unfilled session', {
      sessionId: session.id,
      sessionName: session.name,
      partySize: session.partyMembers.length,
    });

    try {
      const { cancelSession } = await import(
        '../modules/session/controller/session.controller.js'
      );
      const cancellationReason = `Insufficient players (${session.partyMembers.length}/6)`;
      await cancelSession(session.id, cancellationReason);
      logger.info('Successfully canceled unfilled session', {
        sessionId: session.id,
      });
    } catch (error) {
      logger.error('Failed to cancel unfilled session', {
        sessionId: session.id,
        error,
      });

      // Try direct database update as fallback
      try {
        const { updateSession } = await import(
          '../modules/session/repository/session.repository.js'
        );
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

  private async createReminderMessage(
    session: SessionWithParty,
    timezone: string
  ): Promise<string> {
    const sessionTime = formatSessionDateLong(session.date, timezone);

    // Get guildId from campaign for Discord URL
    const { getCampaignWithGuildId } = await import(
      '../modules/session/repository/session.repository.js'
    );
    const campaign = await getCampaignWithGuildId(session.campaignId);
    const guildId = campaign?.guildId ?? '';

    return (
      `⏰ **Session Reminder**\n\n` +
      `🎲 **[${session.name}](https://discord.com/channels/${guildId}/${session.campaignId}/${session.id})** starts in 1 hour!\n` +
      `📅 **Time:** ${sessionTime}\n` +
      `🏰 **Channel:** <#${session.campaignId}>\n` +
      `👥 **Party Size:** ${session.partyMembers.length}/6 members\n\n` +
      `See you at the table! 🎯`
    );
  }

  public async initializeExistingSessions(): Promise<void> {
    try {
      logger.info('🔄 Initializing session scheduler...');

      const { getSessions } = await import(
        '../modules/session/repository/session.repository.js'
      );

      const allSessions = await getSessions({
        includeId: true,
        includeTime: true,
        includeCampaign: false,
        includeUserRole: false,
      });

      const futureSessions = allSessions.filter((session) =>
        isFutureDate(session.date)
      );

      logger.info('📅 Future sessions found for scheduling', {
        totalSessions: allSessions.length,
        futureSessions: futureSessions.length,
      });

      if (futureSessions.length === 0) {
        logger.info('ℹ️  No future sessions to schedule');
      } else {
        for (const session of futureSessions) {
          logger.info('📝 Scheduling session', {
            sessionId: session.id,
            sessionDate: session.date.toISOString(),
          });
          this.scheduleSessionTasks(session.id, session.date);
        }
      }

      logger.info('✅ Session scheduler initialization complete', {
        scheduledSessions: futureSessions.length,
        totalTasks: this.scheduledTasks.size,
      });
    } catch (error) {
      logger.error('❌ Error initializing session scheduler', { error });
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
