// src/utils/path.ts
import path from "path";
import { fileURLToPath } from "url";

/**
 * @internal
 * Utility versions of __dirname and __filename for ESM compatibility.
 */
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
