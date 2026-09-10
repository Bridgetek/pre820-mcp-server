import { z } from "zod";
import { loadFeatureGraph } from "../lib/loadIndex.js";
import { includesSearchPhrase } from "../lib/normalize.js";

export const traceFeatureToCommandsInput = z.object({
    feature: z.string().min(2),
});

export type TraceFeatureToCommandsInput = z.infer<
    typeof traceFeatureToCommandsInput
>;

type Command = {
    name: string;
    type?: string;
    level?: string;
    weight?: number;
};

export function traceFeatureToCommands(
    args: TraceFeatureToCommandsInput
) {
    const graph = loadFeatureGraph();
    const input = args.feature;

    //callback
    const matches = Object.entries(graph)
        .filter(([feature, meta]) => {
            return (
                includesSearchPhrase(input, feature) ||
                meta.keywords.some((k: string) =>
                    includesSearchPhrase(input, k)
                )
            );
        })
        .map(([feature, meta]) => ({
            feature,
            commands: meta.commands as Command[],
            samples: meta.samples as string[],
            registers: meta.registers as string[],
        }));

    if (matches.length === 0) {
        return {
            message: "No matching feature found.",
        };
    }

    // commands
    const allCommands: Command[] = matches.flatMap((m) => m.commands);

    // remove duplicate and keep weight
    const dedup = new Map<string, Command>();

    for (const cmd of allCommands) {
        const existing = dedup.get(cmd.name);

        if (!existing || (cmd.weight ?? 0) > (existing.weight ?? 0)) {
            dedup.set(cmd.name, cmd);
        }
    }

    const uniqueCommands = Array.from(dedup.values());

    // sort
    const ranked = uniqueCommands.sort((a, b) => {
        const wa = a.weight ?? 0;
        const wb = b.weight ?? 0;

        if (wb !== wa) return wb - wa;

        // high-level API
        if (a.level === "high" && b.level !== "high") return -1;
        if (b.level === "high" && a.level !== "high") return 1;

        return 0;
    });

    // remove duplicate
    const samples = [
        ...new Set(matches.flatMap((m) => m.samples)),
    ];

    const registers = [
        ...new Set(matches.flatMap((m) => m.registers)),
    ];

    // explain
    function explain(cmd: Command): string {
        if (cmd.type === "coprocessor") {
            return "High-level API, recommended for UI development";
        }
        if (cmd.type === "display_list") {
            return "Low-level rendering command";
        }
        if (cmd.type === "hal") {
            return "Hardware-level API";
        }
        return "Related command";
    }

    // output
    return {
        features_detected: matches.map((m) => m.feature),

        top_commands: ranked.slice(0, 5).map((c) => ({
            name: c.name,
            type: c.type,
            level: c.level,
            reason: explain(c),
        })),

        all_commands: ranked, // context to AI

        related_samples: samples.slice(0, 5),

        related_registers: registers.slice(0, 20),

        next_steps: [
            "Start with top_commands (prefer high-level APIs)",
            "Refer to related_samples for working examples",
            "Integrate commands into your rendering loop",
        ],
    };
}
