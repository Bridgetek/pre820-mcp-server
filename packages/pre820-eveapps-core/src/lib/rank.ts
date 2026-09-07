import type { FeatureGraphItem, SampleIndexItem } from "../types.js";
import { includesSearchPhrase, tokenize, normalizeText } from "./normalize.js";
import { expandEveSymbolAliases } from "./eveSymbolAliases.js";

export function rankSamples(
    query: string,
    samples: SampleIndexItem[],
    featureGraph: Record<string, FeatureGraphItem>,
    platform?: string
) {
    const knownCommands = new Set([
        ...samples.flatMap(sample => sample.commands_used ?? []),
        ...Object.values(featureGraph).flatMap(feature => feature.commands.map(command => command.name)),
    ]);
    const aliases = expandEveSymbolAliases(query, knownCommands);
    const expandedQuery = [query, ...aliases].join(" ");
    const q = normalizeText(expandedQuery);
    const qTokens = new Set(tokenize(expandedQuery));

    return samples
        .map((sample) => {
            let relevanceScore = 0;

            const haystack = normalizeText([
                sample.name,
                sample.summary,
                ...(sample.categories ?? []),
                ...(sample.keywords ?? []),
                ...(sample.commands_used ?? []),
            ].join(" "));

            for (const token of qTokens) {
                if (haystack.includes(token)) relevanceScore += 2;
            }

            for (const [feature, meta] of Object.entries(featureGraph)) {
                if (includesSearchPhrase(q, feature) ||
                    meta.keywords.some((k) => includesSearchPhrase(q, k))) {
                    if (meta.samples.includes(sample.id)) relevanceScore += 5;
                    const overlap = sample.commands_used.filter((c) => meta.commands.some((cmd) => cmd.name === c)).length;
                    relevanceScore += overlap;
                }
            }

            let rankingBonus = 0;

            if (platform && sample.platform_notes?.some(
                item => item.toLowerCase() === platform.toLowerCase()
            )) {
                rankingBonus += 2;
            }

            if (sample.difficulty === "beginner") {
                rankingBonus += 0.5;
            }

            return {
                sample,
                relevanceScore,
                score: relevanceScore + rankingBonus,
            };
        })
        .filter((x) => x.relevanceScore > 0)
        .sort((a, b) => b.score - a.score);
}
