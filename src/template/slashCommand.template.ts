import { Client, Interaction, SlashCommandBuilder } from "discord.js";

/**
 * Template interface for defining a slash command handler.
 * Includes command data, permission level, and execution logic.
 *
 * @property data - The SlashCommandBuilder instance defining the command structure.
 * @property execute - The asynchronous function to be called when the command is invoked. Receives the interaction and client as parameters.
 * @example
 * ```typescript
 * import { SlashCommandBuilder, Interaction, Client } from "discord.js";
 * const exampleCommand: slashCommandTemplate = {
 *   data: new SlashCommandBuilder()
 *     .setName("example")
 *     .setDescription("An example command"),
 *   execute: async (interaction: Interaction, client: Client) => {
 *      if (!interaction.isCommand()) return;
 *      await interaction.reply("This is an example command!");
 *   }
 * }
 * ```
 */
export interface slashCommandTemplate {
    tag: "bot" | "owner" | "user";
    data: SlashCommandBuilder;
    execute: (interaction: Interaction, client: Client) => Promise<void>;
}