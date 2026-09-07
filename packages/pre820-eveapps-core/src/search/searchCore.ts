import { WorkspaceContext } from "../context.js";
import type { RetrievalResult } from "../router/types.js";
import { loadCommands, loadRegisters } from "../lib/loadIndex.js";
import { expandEveSymbolAliases } from "../lib/eveSymbolAliases.js";

export function searchCore(context: WorkspaceContext, query: string): RetrievalResult {
    try {
        const commands = loadCommands();
        const registers = loadRegisters();
        const queryLower = query.toLowerCase();
        const commandAliases = expandEveSymbolAliases(query, commands.map(command => command.name))
            .map(alias => alias.toLowerCase());

        // Try to find exact command/register matches
        const matchedCommands = commands.filter(c =>
            c.name.toLowerCase().includes(queryLower) ||
            c.summary?.toLowerCase().includes(queryLower) ||
            commandAliases.includes(c.name.toLowerCase())
        ).slice(0, 5);

        const matchedRegisters = registers.filter(r =>
            r.name.toLowerCase().includes(queryLower) ||
            r.summary?.toLowerCase().includes(queryLower)
        ).slice(0, 5);

        const hasMatches = matchedCommands.length > 0 || matchedRegisters.length > 0;

        if (!hasMatches) {
            return {
                answer: {
                    message: `No PRE820/EVE core references found for: "${query}"`,
                    tip: "Try searching for specific command names, register names, or features"
                },
                confidence: 0,
                source: "core",
                references: []
            };
        }

        const references: string[] = [];
        if (matchedCommands.length > 0) {
            references.push(`Commands: ${matchedCommands.map(c => c.name).join(", ")}`);
        }
        if (matchedRegisters.length > 0) {
            references.push(`Registers: ${matchedRegisters.map(r => r.name).join(", ")}`);
        }
        // Assign confidence according to match quality:
        // - exact name match: 1.0
        // - alias match: 0.95
        // - name contains query: 0.85
        // - summary contains query: 0.6
        // This allows routeQuery to prefer the core index for strong matches.
        const scoreForCommand = (c: any) => {
            const nameLower = c.name.toLowerCase();
            if (nameLower === queryLower) return 1.0;
            if (commandAliases.includes(nameLower)) return 0.95;
            if (nameLower.includes(queryLower)) return 0.85;
            if (c.summary?.toLowerCase().includes(queryLower)) return 0.6;
            return 0.5;
        };

        const registerAliases = expandEveSymbolAliases(query, registers.map(r => r.name)).map(a => a.toLowerCase());
        const scoreForRegister = (r: any) => {
            const nameLower = r.name.toLowerCase();
            if (nameLower === queryLower) return 1.0;
            if (registerAliases.includes(nameLower)) return 0.95;
            if (nameLower.includes(queryLower)) return 0.85;
            if (r.summary?.toLowerCase().includes(queryLower)) return 0.6;
            return 0.5;
        };

        const commandScores = matchedCommands.map(scoreForCommand);
        const registerScores = matchedRegisters.map(scoreForRegister);
        const bestScore = Math.max(0, ...(commandScores.length ? commandScores : [0]), ...(registerScores.length ? registerScores : [0]));

        return {
            answer: {
                message: `Found ${matchedCommands.length} commands and ${matchedRegisters.length} registers for: "${query}"`,
                commands: matchedCommands.map(c => ({
                    name: c.name,
                    type: "command",
                    signature: c.signature,
                    summary: c.summary,
                    related_samples: c.related_samples || [],
                })),
                registers: matchedRegisters.map(r => ({
                    name: r.name,
                    type: r.kind,
                    value: r.value ?? null,
                    variants: r.variants,
                    summary: r.summary,
                }))
            },
            confidence: hasMatches ? bestScore : 0,
            source: "core",
            references
        };
    } catch (err) {
        return {
            answer: {
                error: `Error searching core data: ${err instanceof Error ? err.message : String(err)}`
            },
            confidence: 0,
            source: "core",
            references: []
        };
    }
}
