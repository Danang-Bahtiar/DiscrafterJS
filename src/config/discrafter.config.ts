import { GatewayIntentBits } from "discord.js";
import { RegistryTemplate } from "../template/registry.template.js";

/**
 * Configuration for Discrafter options.
 *
 * Defines the customizable settings for initializing and running Discrafter.
 *
 * @property core - Core Discord client settings.
 * @property core.intents - An array of GatewayIntentBits to specify which Discord events the bot should receive.
 * @property core.clientId - The client ID of your Discord application.
 * @property core.discordToken - The authentication token for your Discord bot.
 * @property core.ownerId - The user ID of the bot's owner, used for permission checks.
 *
 * @property development - (Optional) Configuration for testing.
 * @property development.developmentMode - A boolean indicating whether the bot is running in development mode.
 * @property development.developmentGuildId - The ID of the guild (server) used for testing purposes, such as deploying test commands.
 *
 * @property slashCommand - Slash command handler configuration.
 * @property slashCommand.useDefaultHandler - A boolean indicating whether to use the default slash command handler.
 * @property slashCommand.customDirPath - (Optional) The directory path for the default handler to load slash command file from.
 * @property slashCommand.guilds - (Optional) An array of guild IDs to which slash commands will be registered. If not provided, commands are registered globally.
 *
 * @property event - Event handler configuration.
 * @property event.useDefaultHandler - A boolean indicating whether to use the default event handler.
 * @property event.customDirPath - (Optional) The directory path for the default handler to load file from.
 *
 * @property helper - Helper Function handler configuration.
 * @property helper.useDefaultHandler - A boolean indicating whether to use the dault Helper handler.
 * @property helper.customDirPath - (Optional) The directory path for the default handler to load file from.
 *
 * @property custom - (Optional) Custom handler settings.
 * @property custom.useDefaultInteractionEvent - (Optional) Whether to use the default `interactionCreate` event handler, which handles only slash command interactions.
 *
 * @example
 * ```ts
 * import { GatewayIntentBits } from "discord.js";
 *
 * const config: DiscrafterConfig = {
 *   core: {
 *     intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
 *     clientId: "your-client-id",
 *     discordToken: "your-discord-token",
 *     ownerId: "your-bot-owner-id-or-your-user-id"
 *   },
 *   development: {
 *     developmentMode: true;
 *     developmentGuildId?: "your-guild-id";
 *   },
 *   slashCommand: {
 *      useDefaultHandler: true,
 *      customDirPath: "./src/slashCommands",
 *      globalRegister: false
 *      guilds: ["guild-id-1", "guild-id-2"]},
 *   event: {
 *      useDefaultHandler: true,
 *      customDirPath: "./src/events"
 *   },
 *   helper: {
 *      useDefaultHandler: true,
 *      customDirPath: "./src/helpers"
 *   },
 *   custom: {
 *      useDefaultInteractionEvent: true,
 *   },
 * };
 * ```
 */
export interface DiscrafterConfig {
  core: {
    intents: GatewayIntentBits[];
    clientId: string;
    discordToken: string;
    ownerId: string;
  };
  development: {
    developmentMode: boolean;
    developmentGuildId?: string;
  };
  slashCommand: {
    useDefaultHandler: boolean;
    customDirPath?: string;
    globalRegister?: boolean;
    guilds?: string[];
  };
  event: {
    useDefaultHandler: boolean;
    customDirPath?: string;
  };
  helper: {
    useDefaultHandler: boolean;
    customDirPath?: string;
  };
  custom: {
    useDefaultInteractionEvent: boolean;
    useDefaultReloadCommand: boolean;
  };
  axios: AxiosConfig;
}

/**
 * Can set baseURL to null if enabled is false.
 */
export interface AxiosConfig {
  enabled: boolean;
  defaultTimeout?: number;
  baseURL: string | any;
  subURL?: string;
}

/**
 * Defines and returns a Discrafter configuration object.
 * @param config - The Discrafter configuration object.
 * @returns The same Discrafter configuration object passed as an argument.
 *
 * @example
 * ```ts
 * import { defineConfig } from "./template/discrafter.config.js";
 * import { GatewayIntentBits } from "discord.js";
 *
 * const config = defineConfig({
 *   core: {
 *     intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
 *     clientId: "your-client-id",
 *     discordToken: "your-discord-token",
 *     ownerId: "your-bot-owner-id-or-your-user-id"
 *   },
 *   development: {
 *     developmentMode: true;
 *     developmentGuildId: "your-guild-id";
 *   },
 *   slashCommand: {
 *      useDefaultHandler: true,
 *      customDirPath: "./src/slashCommands",
 *      globalRegister: false
 *      guilds: ["guild-id-1", "guild-id-2"]},
 *   event: {
 *      useDefaultHandler: true,
 *      customDirPath: "./src/events"
 *   },
 *   helper: {
 *      useDefaultHandler: true,
 *      customDirPath: "./src/helpers"
 *   },
 *   custom: {
 *      useDefaultInteractionEvent: true,
 *   },
 *   axios: {
 *      enabled: true,
 *      defaultTimeout: 5000,
 *      baseURL: "https://api.example.com",
 *      subURL: "https://backup-api.example.com"
 *   }
 * });
 * ```
 */
export function defineConfig(config: DiscrafterConfig): DiscrafterConfig {
  return config;
}
