import { Client, Collection } from "discord.js";
import { ChordJSConfig } from "../config/chordjs.config.js";
import { loadConfig } from "../loaders/config.loader.js";
import { eventTemplate } from "../template/event.template.js";
import { slashCommandTemplate } from "../template/slashCommand.template.js";
import SlashCommandManager from "../handlers/slashCommand.js";
import EventManager from "../handlers/event.js";
import path from "path";

class ChordJS {
  private client!: Client;
  private discordToken!: string;
  private HandlerCollection: Collection<string, any> = new Collection();

  //============================= Static Methods ==============================//

  static async create() {
    const config: ChordJSConfig = await loadConfig();
    const instance = new ChordJS();

    instance.configResolver(config);

    await instance.setup(config);

    return instance;
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

  //============================= Private Methods ==============================//

  private configResolver(config: ChordJSConfig) {
    this.client = new Client({ intents: config.core.intents });
    this.discordToken = config.core.discordToken;
  }

  private async setup(config: ChordJSConfig) {
    // SlashCommand
    if (config.slashCommand.useDefaultHandler) {
      const slashCommandManager = new SlashCommandManager();
      // Resolve the absolute path from the project's root.
      const commandsPath = path.resolve(
        process.cwd(),
        config.slashCommand.customDirPath ?? "./src/slashCommands"
      );

      await slashCommandManager.init(
        commandsPath,
        config.core.clientId,
        config.core.discordToken
      );
      this.HandlerCollection.set("slashCommand", slashCommandManager);
      console.log("[HND] Loaded handler: slashCommand");
    }

    if (config.development?.developmentMode) {
      console.log("Running in development mode.");

      const slashCommandManager = this.HandlerCollection.get("slashCommand");

      if (config.development?.developmentGuildId) {
        console.log(
          `[DEV] Registering commands to guild: ${config.development.developmentGuildId}`
        );
        await slashCommandManager.registerGuildCommands(
          config.development.developmentGuildId
        );
      }

      // Extra dev utilities
      console.log("[DEV] Commands loaded:", slashCommandManager.listCommands());

      process.on("uncaughtException", (err) => {
        console.error("[DEV] Uncaught exception:", err);
      });

      process.on("unhandledRejection", (reason) => {
        console.error("[DEV] Unhandled rejection:", reason);
      });
    }

    if (config.slashCommand.globalRegister ?? false) {
      const slashCommandManager = this.HandlerCollection.get("slashCommand");
      if (slashCommandManager) {
        await slashCommandManager.registerGlobalCommands();
        console.log("Registered global slash commands.");
      }
    }

    if (config.custom?.useDefaultInteractionEvent ?? false) {
      const slashHandler = this.HandlerCollection.get("slashCommand");
      this.client.on("interactionCreate", async (interaction) => {
        if ("commandName" in interaction) {
          if (interaction.isAutocomplete()) {
            const command = interaction.commandName;
            return slashHandler
              .getCommands(command)
              .autocomplete(interaction, this.client);
          }

          if (interaction.isChatInputCommand()) {
            const command = interaction.commandName;
            return slashHandler
              .getCommands(command)
              .execute(interaction, this.client);
          }
        } else if ("customId" in interaction) {
          const [command, action] = interaction.customId.split("-");
          if (!command) return; // ignore malformed customId

          const cmd = slashHandler.getCommands(command);
          if (cmd && typeof cmd[action] === "function") {
            return cmd[action](interaction, this.client);
          }
        }
      });
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
  }

  //============================= Public Methods ==============================//

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

  
}

export default ChordJS;
