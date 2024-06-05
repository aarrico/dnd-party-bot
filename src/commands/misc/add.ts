import "dotenv/config";
import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
  name: "add",
  description: "adds 2 numbers together!",
  options: [
    {
      name: "first-number",
      description: "The first number",
      type: ApplicationCommandOptionType.Number,
      choices: [
        {
          name: "one",
          value: 1,
        },
        {
          name: "two",
          value: 2,
        },
        {
          name: "three",
          value: 3,
        },
      ],
      required: true,
    },
    {
      name: "second-number",
      description: "The second number",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  cooldown: 0,
  callBack: ({ interaction }) => {
    const num1 = interaction?.options?.get("first-number")?.value as number;
    const num2 = interaction?.options?.get("second-number")?.value as number;
    interaction.followUp(
      num1 && num2 ? `${num1} + ${num2} = ${num1 + num2}` : "There was an error"
    );
  },
});
