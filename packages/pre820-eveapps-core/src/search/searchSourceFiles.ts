import fs from "fs";
import path from "path";

import { expandEveSymbolAliases } from "../lib/eveSymbolAliases.js";
import { loadCommands } from "../lib/loadIndex.js";

export interface SourceFileMatch {
    file: string;
    relativePath: string;
    matchedLines: string[];
    matchedSymbols?: string[];
}

const SOURCE_EXTENSIONS = [
    ".c",
    ".h",
    ".txt",
    ".md"
];

function collectFiles(dir: string, out: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            collectFiles(fullPath, out);
            continue;
        }

        const ext = path.extname(entry.name).toLowerCase();

        if (SOURCE_EXTENSIONS.includes(ext)) {
            out.push(fullPath);
        }
    }

    return out;
}

export function searchSourceFiles(
    eveappsRoot: string,
    query: string
): SourceFileMatch[] {

    const files = collectFiles(eveappsRoot);
    const gpuMacros = new Set<string>();
    for (const file of files) {
        if (path.basename(file).toLowerCase() !== "eve_gpudefs.h") continue;

        try {
            const text = fs.readFileSync(file, "utf-8");
            for (const match of text.matchAll(/^\s*#\s*define\s+([A-Z][A-Z0-9_]*)\b/gm)) {
                const macro = match[1];
                if (macro) gpuMacros.add(macro);
            }
        } catch {
            // Alias validation is optional when a header cannot be read.
        }
    }

    const aliases = expandEveSymbolAliases(
        query,
        loadCommands().map(command => command.name),
        gpuMacros
    );
    const searchTerms = [...new Set([query, ...aliases])]
        .map(term => term.toLowerCase())
        .filter(Boolean);

    const results: SourceFileMatch[] = [];

    for (const file of files) {

        try {
            const text = fs.readFileSync(file, "utf-8");

            const lines = text.split(/\r?\n/);

            const matchedLines = lines
                .filter(line => searchTerms.some(term => line.toLowerCase().includes(term)))
                .slice(0, 5);

            if (matchedLines.length > 0) {
                results.push({
                    file,
                    relativePath: path.relative(eveappsRoot, file),
                    matchedLines,
                    matchedSymbols: aliases.filter(alias =>
                        matchedLines.some(line => line.toLowerCase().includes(alias.toLowerCase()))
                    )
                });
            }

        } catch {
            // ignore unreadable files
        }
    }

    return results.slice(0, 10);
}
