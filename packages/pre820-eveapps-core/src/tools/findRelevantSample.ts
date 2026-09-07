import { z } from "zod";
import { loadFeatureGraph, loadSamples } from "../lib/loadIndex.js";
import { rankSamples } from "../lib/rank.js";

export const findRelevantSampleInput = z.object({
    query: z.string().min(3),
    platform: z.string().optional(),
    display: z.string().optional(),
    limit: z.number().int().min(1).max(10).default(3),
});

export type FindRelevantSampleInput = z.infer<typeof findRelevantSampleInput>;

export function findRelevantSample(args: FindRelevantSampleInput) {
    const samples = loadSamples();
    const featureGraph = loadFeatureGraph();

    const ranked = rankSamples(args.query, samples, featureGraph, args.platform)
        .slice(0, args.limit)
        .map(({ sample, score }) => ({
            sample_id: sample.id,
            name: sample.name,
            path: sample.path,
            score,
            summary: sample.summary,
            commands: sample.commands_used,
            reason: `Matched query against sample summary/categories/commands${args.platform ? ` and preferred platform ${args.platform}` : ""}.`,
        }));

    return {
        matches: ranked,
        recommended_starting_point: ranked[0]?.sample_id ?? null,
        assumptions: {
            platform: args.platform ?? null,
            display: args.display ?? null,
        },
    };
}
