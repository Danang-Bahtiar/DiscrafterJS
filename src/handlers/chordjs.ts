import { Client, Collection } from "discord.js";
import SlashCommandManager from "./slashCommand.js";
import { ChordJSConfig } from "../template/chordjs.config.js";
import EventManager from "./event.js";

import { loadConfig } from "../loaders/config.loader.js";

class ChordJS {
  private client!: Client;
  private discordToken!: string;
  private HandlerCollection: Collection<string, any> = new Collection();

  private configResolver(config: ChordJSConfig) {
    this.client = new Client({ intents: config.core.intents });
    this.discordToken = config.core.discordToken;
  }

  private async defaultSetup(config: ChordJSConfig) {
    // Slash Command
    const slashCommandManager = new SlashCommandManager();
    await slashCommandManager.init(
      config.custom?.slashCommandDirPath ?? "./src/slashCommands",
      config.core.clientId,
      config.core.discordToken,
    );

    if (config.test?.guildId) {
      await slashCommandManager.registerCommands(config.test.guildId);
      console.log(
        `Registered slash commands to guild ID: ${config.test.guildId}`
      );
    }

    this.HandlerCollection.set("slashCommand", slashCommandManager);

    if (config.custom?.useDefaultInteractionEvent ?? false) {
      this.client.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.commandName;
        if (!command) return;
        await slashCommandManager.useCommand(command, interaction, this.client);
      });
    }

    // Events
    const eventManager = new EventManager();
    await eventManager.init(
      config.custom?.eventDirPath ?? "./src/events",
      this.client
    );

    this.HandlerCollection.set("event", eventManager);

    if (config.handlers) {
      for (const handlerEntry of config.handlers) {
        this.HandlerCollection.set(
          handlerEntry.name,
          handlerEntry.handlerInstance
        );
        console.log(`[HND] Loaded handler: ${handlerEntry.name}`);
      }
    }
  }

  static async create() {
    const config: ChordJSConfig = await loadConfig();
    const instance = new ChordJS();

    instance.configResolver(config);

    await instance.defaultSetup(config);

    return instance;
  }

  public getClient() {
    return this.client;
  }

  public login() {
    try {
      this.client.login(this.discordToken);
      this.client.once("ready", () => {
        console.log(`Bot logged in successfully as ${this.client.user?.tag}.`);
      });
    } catch (error) {
      console.error("Error logging in:", error);
    }
  }

  public async useHandler(name: string, handlerMethod: string, ...args: any) {
    try {
      const handler = this.HandlerCollection.get(name);
      if (!handler) {
        throw new Error(`Handler ${name} not found.`);
      }
      if (typeof handler[handlerMethod] !== "function") {
        throw new Error(
          `Method ${handlerMethod} not found on handler ${name}.`
        );
      }
      return await handler[handlerMethod](...args);
    } catch (error) {
      console.error(`Error using handler ${name}:`, error);
      return error;
    }
  }
}

export default ChordJS;
