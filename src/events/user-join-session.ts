import { Event } from "../structures/Event";

export default new Event("interactionCreate", (interaction) => {
  if (!interaction) return;
  console.log(interaction);
});
