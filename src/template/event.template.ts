import { Client } from "discord.js";

/**
 * Template for defining Discord event handlers.
 * Each event must have a name, a flag indicating if it should be executed once,
 * and an execute function that contains the event logic.
 * @property {string} name - The name of the event (e.g., 'messageCreate', 'guildMemberAdd').
 * @property {boolean} once - Indicates if the event should be executed only once.
 * @property {function} execute - The function to execute when the event is triggered. Note that the client is passed as the first argument and always first.
 * @example
 * ```typescript
 * const exampleEvent: EventTemplate = {
 *   name: "ready",
 *   once: true,
 *   execute: async (client: Client) => {
 *     console.log(`Logged in as ${client.user?.tag}!`);
 *   }
 * }
 * ```
 */
export type eventTemplate = {
  name: string;
  once: boolean;
  execute: (client: Client, ...args: any[]) => Promise<void>;
};
