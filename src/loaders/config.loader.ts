import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import type { ChordJSConfig } from "../template/chordjs.config.js";

export async function loadConfig(): Promise<ChordJSConfig> {
  const fullPath = path.resolve(process.cwd(), "chordjs.config.js");

  if (!fs.existsSync(fullPath)) {
    throw new Error(`ChordJS config not found at: ${fullPath}`);
  }

  const module = await import(pathToFileURL(fullPath).href);
  return (module.default || module) as ChordJSConfig;
}

