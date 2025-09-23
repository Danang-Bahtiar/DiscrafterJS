/**
 * Template for defining a helper function.
 * Each helper function must have name, type and an executable function.
 * @property {string} name - the name of helper function.
 * @property {"Interaction" | "Client" | "Args" | "InteractionClient" | "InteractionArgs" | "ClientArgs" | "All"} type - type of the helper function. Indicating what parameter the executable could take.
 * @property {string} description - description of the helper function.
 * @property {function} execute - executable function for what the heper function will do.
 * @see Helper execute function argument order:
 * - Interaction should always be the first argument (if used).
 * - Client should always be the second argument (if used).
 * - Any additional arguments should come after (3rd slot and beyond).
 *
 * @example types:
 *  Interaction -> (interaction)
 *  Client -> (client)
 *  InteractionClient -> (interaction, client)
 *  InteractionArgs -> (interaction, ...args)
 *  ClientArgs -> (client, ...args)
 *  All -> (interaction, client, ...args)
 */
export type helperTemplate = {
  name: string;
  type:
    | "Interaction"
    | "Client"
    | "Args"
    | "InteractionClient"
    | "InteractionArgs"
    | "ClientArgs"
    | "All";
  description?: string;
  execute: (...args: any[]) => Promise<void>;
};
