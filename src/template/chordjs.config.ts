import { GatewayIntentBits } from "discord.js";
import { handlerEntry } from "./handler.template.js";

/**
 * Configuration for ChordJS options.
 *
 * Defines the customizable settings for initializing and running ChordJS.
 *
 * @property core - Core Discord client settings.
 * @property core.intents - Array of GatewayIntentBits to specify Discord gateway intents.
 * @property core.clientId - The client ID of the Discord application.
 * @property core.discordToken - The token used to authenticate the Discord client.
 * @property core.ownerId - The user ID of the bot owner or administrator.
 *
 * @property test - (Optional) Test-specific configuration.
 * @property test.guildId - The guild ID used for testing slash commands or events.
 *
 * @property custom - (Optional) Custom directory paths for loading handlers.
 * @property custom.useDefaultInteractionEvent - Whether to use the default interactionCreate event handler. The default interactionCreate handler only registers slash commands.
 * @property custom.slashCommandDirPath - Directory path for custom slash command handlers.
 * @property custom.eventDirPath - Directory path for custom event handlers.
 * 
 * @property handlers - (Optional) Custom handler entries. Each entry provides a name and an already-instantiated handler.
 *
 * @example
 * ```ts
 * import { GatewayIntentBits } from "discord.js";
 *
 * const config: ChordJSConfig = {
 *   core: {
 *     intents: [GatewayIntentBits.Guilds],
 *     clientId: "your-client-id",
 *     discordToken: "your-discord-token",
 *     ownerId: "your-bot-owner-id-or-your-user-id"
 *   },
 *   test: { guildId: "your-guild-id" },
 *   custom: {
 *     useDefaultInteractionEvent: true,
 *     slashCommandDirPath: "./custom/slashCommands",
 *     eventDirPath: "./custom/events"
 *   },
 *   handlers: [
 *     { name: "customHandler", handlerInstance: new CustomHandler() }
 *   ]
 * };
 * ```
 */
export interface ChordJSConfig {
  core: {
    intents: GatewayIntentBits[];
    clientId: string;
    discordToken: string;
    ownerId: string;
  };
  test?: {
    guildId: string;
  };
  custom?: {
    useDefaultInteractionEvent?: boolean;
    slashCommandDirPath?: string;
    eventDirPath?: string;
  }
  handlers?: handlerEntry[];
}

/**
 * Defines and returns a ChordJS configuration object.
 * @param config - The ChordJS configuration object.
 * @returns The same ChordJS configuration object passed as an argument.
 * 
 * @example
 * ```ts
 * import { defineConfig } from "./template/chordjs.config.js";
 * import { GatewayIntentBits } from "discord.js";
 * 
 * const config = defineConfig({
 *   core: {
 *     intents: [GatewayIntentBits.Guilds],
 *     clientId: "your-client-id",
 *     discordToken: "your-discord-token",
 *     ownerId: "your-bot-owner-id-or-your-user-id"
 *   },
 *   test: { guildId: "your-guild-id" },
 *   custom: {
 *     slashCommandDirPath: "./custom/slashCommands",
 *     eventDirPath: "./custom/events"
 *   },
 *   handlers: [
 *    { name: "customHandler", handlerInstance: new CustomHandler() }
 *   ]
 * });
 * ```
 */
export function defineConfig(config: ChordJSConfig): ChordJSConfig {
  return config;
}