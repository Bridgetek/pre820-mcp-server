const CODL_PREFIX = "EVE_CoDl_";
const COCMD_PREFIX = "EVE_CoCmd_";

/** Convert an EVE_CoDl helper name to the display-list macro it writes. */
export function coDlFunctionToMacro(symbol: string): string | undefined {
    if (!symbol.toLowerCase().startsWith(CODL_PREFIX.toLowerCase())) {
        return undefined;
    }

    const suffix = symbol.slice(CODL_PREFIX.length);
    if (!suffix) return undefined;

    return suffix
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toUpperCase();
}

/** Convert an EVE_CoCmd helper name to its CMD_* command token. */
export function coCmdFunctionToMacro(symbol: string): string | undefined {
    if (!symbol.toLowerCase().startsWith(COCMD_PREFIX.toLowerCase())) {
        return undefined;
    }

    const suffix = symbol.slice(COCMD_PREFIX.length);
    if (!suffix) return undefined;

    // EVE coprocessor tokens concatenate camel-case words: setBitmap -> CMD_SETBITMAP.
    return `CMD_${suffix.toUpperCase()}`;
}

export function eveFunctionToGpuMacro(symbol: string): string | undefined {
    return coDlFunctionToMacro(symbol) ?? coCmdFunctionToMacro(symbol);
}

/**
 * Expand display-list/coprocessor helpers and EVE_GpuDefs.h macros to equivalent
 * spellings. knownCommands makes the reverse (macro -> helper) mapping exact.
 */
export function expandEveSymbolAliases(
    input: string,
    knownCommands: Iterable<string>,
    knownGpuMacros?: ReadonlySet<string>
): string[] {
    const aliases = new Set<string>();
    const identifiers = input.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) ?? [];
    const commands = [...knownCommands];

    for (const identifier of identifiers) {
        const directCommand = commands.find(
            command => command.toLowerCase() === identifier.toLowerCase()
        );

        if (directCommand) {
            aliases.add(directCommand);
            const macro = eveFunctionToGpuMacro(directCommand);
            if (macro && (!knownGpuMacros || knownGpuMacros.size === 0 || knownGpuMacros.has(macro))) {
                aliases.add(macro);
            }
        }

        const macroName = identifier.toUpperCase();
        if (!knownGpuMacros || knownGpuMacros.size === 0 || knownGpuMacros.has(macroName)) {
            for (const command of commands) {
                if (eveFunctionToGpuMacro(command) === macroName) {
                    aliases.add(command);
                    aliases.add(macroName);
                }
            }
        }
    }

    return [...aliases];
}
