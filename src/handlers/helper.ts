import { Collection } from "discord.js";
import { glob } from "glob";
import path from "path";
import { helperTemplate } from "../template/helper.template.js";

// 🎨 Visual Styling Helpers
const style = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  dim: "\x1b[2m",
};

class HelperManager {
  private helperCollection = new Collection<string, helperTemplate>();

  public init = async (helperDirPath: string) => {
    const helperDir = path
      .join(helperDirPath, "/**/*.{ts,js}")
      .replace(/\\/g, "/");
      
    const files = await glob(helperDir);

    if (files.length === 0) {
        console.log(`${style.yellow}[HLP] [WARN] No helper files found.${style.reset}`);
        return;
    }

    for (const file of files) {
      const filePath = `file://${file.replace(/\\/g, "/")}`;

      try {
        const helperModule = await import(`${filePath}?update=${Date.now()}`);
        const helper = helperModule.default;

        if (!helper?.name || typeof helper?.execute !== "function") {
          console.warn(
            `${style.yellow}[HLP] [SKIP] Invalid helper structure: ${path.basename(file)}${style.reset}`
          );
          continue;
        }

        this.helperCollection.set(helper.name, helper);
        
        console.log(
            `${style.magenta}[HLP] Loaded Utility: ${style.reset}${helper.name} ${style.dim}[Type: ${helper.type}]${style.reset}`
        );

      } catch (error) {
         console.error(
            `${style.red}[HLP] [ERR] Failed to load helper ${path.basename(file)}: ${error}${style.reset}`
        );
      }
    }
  };

  public getHelper = (helperName: string): helperTemplate | undefined => {
    return this.helperCollection.get(helperName);
  };
}

export default HelperManager;