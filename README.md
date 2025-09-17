# ChordJS

## Overview

ChordJS is a framework built on top of Discord.js. This framework was created with the goal of making Discord bot development easier and more structured. Adapting an opinionated coding style and convention system, ChordJS enforces consistency in how commands, events, and configurations are written. By doing so, it reduces ambiguity, improves readability, and helps developers focus more on functionality rather than boilerplate.

## Installation

- Direct from GitHub

    ```js
    npm i https://github.com/Danang-Bahtiar/ChordJS.git
    ```

- From NPM Registry

    ```js
    npm i chordjs
    ```

## Usage

1. Create `chordjs.config.js` in the project root:

    ```js
    // example chordjs.config.js
    import { defineConfig } from "chordjs";
    import { GatewayIntentBits } from "discord.js";

    const config = defineConfig({
        core: {
            intents: [GatewayIntentBits.Guilds],
            clientId: "your-client-id",
            discordToken: "your-discord-token",
            ownerId: "your-bot-owner-id-or-your-user-id"
        },
        test: {
            // If provided, slash commands will only register to this guild (fast updates).
            // Otherwise, they will register globally (slower updates).
            // if not provided, slash commands will only loaded and not registered on bot creation.
            guildId: "your-guild-id"
        },
        custom: {
            // By default, ChordJS adds a built-in interactionCreate handler
            // that processes slash commands. 
            // Set this to false if you want to handle interactionCreate yourself.
            useDefaultInteractionEvent: true,

            slashCommandDirPath: "./custom/slashCommands",
            eventDirPath: "./custom/events"
        },
        handlers: [
            { name: "customHandler", handlerInstance: new CustomHandler() }
        ]
    });

    export default config;
    ```

2. `index.js`
    ```js
    import { ChordJS } from "chordjs";

    const bot = ChordJS.create();
    bot.login();
    ```
