import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";
import {
  deleteSessionById,
  GetPartyForSession,
} from "../../db/session";
import { deleteChannel } from "../../discord/channel";

import {sendEphemeralReply} from "../../discord/message";

export default new Command({
  name: "delete-session",
  description:
    "Deletes a session, its channel, and removes session contents from db.",
  options: [
    {
      name: "session-id",
      description: "UUID of session to be deleted",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "reason",
      description: "Reason to users as to why session is being deleted.",
      type: ApplicationCommandOptionType.String,
    },
  ],
  cooldown: 0,
  callBack: async ({ client, interaction }) => {
    try {
      const sessionId = interaction.options.get("session-id")?.value as string;
      const reason = interaction.options.get("reason")?.value as string;

      //message all users in session
      const party = await GetPartyForSession(sessionId);
      party.forEach(async (partyMember) => {
        const user = await client.users.fetch(partyMember.user.userChannelId);
        user.send({
          content: `Hi there, I just wanted you to know that ${partyMember.session.name} has been canceled.`,
        });
      });
      //delete session channel
      deleteChannel(client, party[0].session.channelId, reason);
      //delete session data
      deleteSessionById(sessionId);

      sendEphemeralReply(
        `Session, Channel, and data for session have been deleted.`,
        interaction
      );
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
});
