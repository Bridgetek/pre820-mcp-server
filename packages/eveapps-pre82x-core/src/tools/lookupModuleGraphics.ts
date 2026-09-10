import { z } from "zod";
import { loadGraphics, loadModules } from "../lib/loadIndex.js";
import { resolveModuleGraphics } from "../lib/moduleGraphicsLookup.js";

export const lookupModuleGraphicsInput = z.object({
    module: z.string().min(1).describe(
        "Module product code or graphics chip name, for example ME817EV, EVE_GRAPHICS_ME817EV, or BT817"
    ),
});

export type LookupModuleGraphicsInput = z.infer<typeof lookupModuleGraphicsInput>;

export function lookupModuleGraphics(args: LookupModuleGraphicsInput) {
    const modules = loadModules();
    const graphics = loadGraphics();
    const resolution = resolveModuleGraphics(args.module, modules, graphics);

    if (!resolution) {
        return {
            found: false,
            module: args.module,
            message: "No matching module product code or graphics chip found in the local indexes.",
            availableGraphics: Object.keys(graphics),
        };
    }

    return {
        found: true,
        requested: args.module,
        ...resolution,
    };
}
