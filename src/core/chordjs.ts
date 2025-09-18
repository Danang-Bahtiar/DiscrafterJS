import { Client, Collection } from "discord.js";
import { ChordJSConfig } from "../config/chordjs.config.js";
import { loadConfig } from "../loaders/config.loader.js";
import { eventTemplate } from "../template/event.template.js";
import { slashCommandTemplate } from "../template/slashCommand.template.js";
import SlashCommandManager from "../handlers/slashCommand.js";
import EventManager from "../handlers/event.js";

class ChordJS {
  private client!: Client;
  private discordToken!: string;
  private HandlerCollection: Collection<string, any> = new Collection();

  private configResolver(config: ChordJSConfig) {
    this.client = new Client({ intents: config.core.intents });
    this.discordToken = config.core.discordToken;
  }

  private async defaultSetup(config: ChordJSConfig) {
    // SlashCommand
    if (config.slashCommand.useDefaultHandler) {
      const slashCommandManager = new SlashCommandManager();
      await slashCommandManager.init(
        config.slashCommand.customDirPath ?? "./src/slashCommands",
        config.core.clientId,
        config.core.discordToken
      );
      this.HandlerCollection.set("slashCommand", slashCommandManager);
      console.log("[HND] Loaded handler: slashCommand");
    }

    // if (config.event.useDefaultHandler) {
    //   const eventManager = new EventManager();
    //   await eventManager.init(
    //     config.event.customDirPath ?? "./src/events",
    //     this.client
    //   );
    //   this.HandlerCollection.set("event", eventManager);
    //   console.log("[HND] Loaded handler: event");
    // }

    if (config.development?.developmentMode) {
      console.log("Running in development mode.");
      if (config.development?.developmentGuildId) {
        console.log(
          `Development guild ID set to: ${config.development.developmentGuildId}`
        );
        const slashCommandManager = this.getHandler("slashCommand") as SlashCommandManager;
        if (slashCommandManager) {
          await slashCommandManager.registerCommands(config.development.developmentGuildId);
          console.log(
            `Registered slash commands to development guild ID: ${config.development.developmentGuildId}`
          );
        }
      }
    }

    // if (config.custom?.useDefaultInteractionEvent ?? false) {
    //   this.client.on("interactionCreate", async (interaction) => {
    //     if (!interaction.isChatInputCommand()) return;
    //     const command = interaction.commandName;
    //     if (!command) return;
    //     await this.getHandler("slashCommand")?.useCommand(command, interaction, this.client);
    //   });
    // }
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
      this.client.once("clientReady", () => {
        console.log(`Bot logged in successfully as ${this.client.user?.tag}.`);
      });
    } catch (error) {
      console.error("Error logging in:", error);
    }
  }

  protected getHandler(name: string) {
    return this.HandlerCollection.get(name);
  }

  // static Event(config: eventTemplate): eventTemplate {
  //   if (!config.name || !config.execute) {
  //     throw new Error("Event must have 'name' and 'execute' fields.");
  //   }
  //   return config;
  // }

  static SlashCommand<T extends slashCommandTemplate>(config: T): T {
    if (!config.data || !config.execute) {
      throw new Error("SlashCommand must have 'data' and 'execute' fields.");
    }
    return config;
  }
}

export default ChordJS;
