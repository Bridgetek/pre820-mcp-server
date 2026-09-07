import { z } from "zod";
import { loadCommands, loadGraphics, loadModules, loadRegisters } from "../lib/loadIndex.js";
import { expandEveSymbolAliases } from "../lib/eveSymbolAliases.js";
import { resolveGraphicsContext, resolveRegisterVariant } from "../lib/registerVariants.js";

export const explainEveSymbolInput = z.object({
    symbol: z.string().min(2),
    graphics: z.string().min(1).optional(),
    family: z.string().min(1).optional(),
});

export type ExplainEveSymbolInput = z.infer<typeof explainEveSymbolInput>;

export function explainEveSymbol(args: ExplainEveSymbolInput) {
    const commands = loadCommands();
    const registers = loadRegisters();
    const graphicsIndex = loadGraphics();
    const modulesIndex = loadModules();
    const symbol = args.symbol.trim();
    const equivalentSymbols = expandEveSymbolAliases(
        symbol,
        commands.map(command => command.name)
    );

    const commandItem = commands.find(
        (c) => c.name.toLowerCase() === symbol.toLowerCase() ||
            equivalentSymbols.some(alias => alias.toLowerCase() === c.name.toLowerCase())
    );

    if (commandItem) {
        const isCoCmd = commandItem.name.startsWith("EVE_CoCmd_");
        return {
            found: true,
            symbol: commandItem.name,
            requested_symbol: symbol,
            canonical_symbol: commandItem.name,
            preferred_for_generated_code: commandItem.name,
            equivalent_symbols: equivalentSymbols.filter(alias =>
                alias.toLowerCase() !== commandItem.name.toLowerCase()
            ),
            type: "command",
            signature: commandItem.signature,
            summary: commandItem.summary,
            parameters: commandItem.params ?? [],
            related_samples: commandItem.related_samples ?? [],
            related_features: commandItem.related_features ?? [],
            source_file: commandItem.source_file,
            usage_notes: [
                `Treat the ${isCoCmd ? "EVE_CoCmd helper and its CMD_* token" : "EVE_CoDl helper and its display-list macro"} as equivalent when searching and classifying usage in existing code.`,
                `Prefer the ${isCoCmd ? "EVE_CoCmd" : "EVE_CoDl"} helper when generating new application code; use the raw macro for intentionally packed or low-level command words.`,
                "Prefer verifying usage against the closest sample in the repository.",
                "Check command ordering and display-list flow in surrounding code.",
            ],
            common_mistakes: [
                "Passing invalid coordinates or flags.",
                "Using the command outside the expected rendering flow.",
            ],
        };
    }

    const registerItem = registers.find(
        (r) => r.name.toLowerCase() === symbol.toLowerCase()
    );

    if (registerItem) {
        const graphicsContext = resolveGraphicsContext(
            args.graphics,
            graphicsIndex,
            modulesIndex
        );
        const family = args.family ?? graphicsContext?.family;
        const resolvedVariant = resolveRegisterVariant(registerItem, {
            family,
            graphics: graphicsContext?.graphics ?? args.graphics,
        });

        return {
            found: true,
            symbol: registerItem.name,
            type: registerItem.kind,
            value: resolvedVariant?.value ?? registerItem.value ?? null,
            variants: registerItem.variants ?? undefined,
            resolved_for: resolvedVariant ? {
                requested_graphics: args.graphics,
                graphics: graphicsContext?.graphics ?? args.graphics,
                family,
            } : undefined,
            summary: registerItem.summary,
            related_features: registerItem.related_features ?? [],
            source_file: registerItem.source_file,
            usage_notes: [
                "Verify the exact semantics in the programming guide/datasheet.",
                "Check whether this symbol is read-only, write-only, or bitfield-based.",
            ],
        };
    }

    return {
        found: false,
        symbol,
        message: `No exact symbol match found for ${symbol}.`,
    };
}
