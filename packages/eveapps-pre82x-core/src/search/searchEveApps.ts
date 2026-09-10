import fs from "fs";
import path from "path";

import { loadSamples } from "../lib/loadIndex.js";
import { loadFeatureGraph } from "../lib/loadIndex.js";
import { rankSamples } from "../lib/rank.js";
import { rankingScoreToConfidence } from "../lib/confidence.js";

import { searchSourceFiles } from "./searchSourceFiles.js";

import { RetrievalResult } from "../router/types.js";

export async function searchEveApps(
    eveappsRoot: string,
    query: string
): Promise<RetrievalResult> {

    try {

        // ------------------------------------
        // 1. Metadata search
        // ------------------------------------

        const samples = loadSamples();
        const featureGraph = loadFeatureGraph();

        const ranked = rankSamples(query, samples, featureGraph)
            .slice(0, 5)
            .map(({ sample, score }) => {

                const samplePath = path.join(
                    eveappsRoot,
                    sample.path
                );

                return {
                    sample_id: sample.id,
                    name: sample.name,
                    path: sample.path,
                    full_path: samplePath,
                    exists: fs.existsSync(samplePath),
                    score,
                    summary: sample.summary,
                    commands_used: (sample.commands_used || []).slice(0, 10),
                    categories: sample.categories || [],
                    platform_notes: sample.platform_notes || []
                };
            });

        // ------------------------------------
        // 2. REAL source search
        // ------------------------------------

        const sourceMatches = searchSourceFiles(
            eveappsRoot,
            query
        );

        // ------------------------------------
        // 3. Combined confidence
        // ------------------------------------

        // Sample ranking scores are intentionally unbounded. Convert the top
        // score to a 0-1 confidence while retaining each raw score above.
        const metadataConfidence = rankingScoreToConfidence(
            ranked[0]?.score ?? 0
        );

        const sourceConfidence =
            sourceMatches.length > 0 ? 0.8 : 0;

        const confidence = Math.max(
            metadataConfidence,
            sourceConfidence
        );

        // ------------------------------------
        // 4. Nothing found
        // ------------------------------------

        if (
            ranked.length === 0 &&
            sourceMatches.length === 0
        ) {

            return {
                answer: {
                    message: `No relevant EveApps results found for: "${query}"`,
                    suggestions: [
                        "Try searching for exact PRE820 command names",
                        "Search for widget or sample names",
                        "Search for API symbols"
                    ]
                },
                confidence: 0,
                source: "eveapps",
                references: []
            };
        }

        // ------------------------------------
        // 5. Build references
        // ------------------------------------

        const references = [

            ...ranked.map(r =>
                `${r.name} (${r.path})`
            ),

            ...sourceMatches.map(r =>
                r.relativePath
            )
        ];

        // ------------------------------------
        // 6. Final merged result
        // ------------------------------------

        return {

            answer: {

                message:
                    `Found EveApps results for: "${query}"`,

                metadata_matches: ranked,

                source_matches: sourceMatches.map(match => ({
                    file: match.relativePath,
                    matched_lines: match.matchedLines,
                    matched_symbols: match.matchedSymbols
                })),

                next_steps: [

                    ranked[0]
                        ? `Review sample: ${ranked[0].path}`
                        : undefined,

                    sourceMatches[0]
                        ? `Inspect source file: ${sourceMatches[0].relativePath}`
                        : undefined

                ].filter(Boolean)
            },

            confidence,

            source: "eveapps",

            references
        };

    } catch (err) {

        return {

            answer: {

                error:
                    `Error searching EveApps: ${err instanceof Error
                        ? err.message
                        : String(err)
                    }`,

                eveappsRoot,

                tip:
                    "Ensure --eveapps points to the EveApps repository root"
            },

            confidence: 0,

            source: "eveapps",

            references: []
        };
    }
}
