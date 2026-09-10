import type { RetrievalResult } from "./types.js";
import { clampConfidence } from "../lib/confidence.js";

export function mergeResults(
    coreResult: RetrievalResult,
    eveappsResult: RetrievalResult
): RetrievalResult {
    const references = [...new Set([
        ...(coreResult.references ?? []),
        ...(eveappsResult.references ?? []),
    ])];

    const metadata = coreResult.metadata || eveappsResult.metadata
        ? {
            core: coreResult.metadata ?? null,
            eveapps: eveappsResult.metadata ?? null,
        }
        : undefined;

    return {
        answer: {
            message: "Combined PRE820 core and EveApps results.",
            core: coreResult.answer,
            eveapps: eveappsResult.answer,
        },
        confidence: clampConfidence(Math.max(
            coreResult.confidence ?? 0,
            eveappsResult.confidence ?? 0
        )),
        source: "both",
        references,
        metadata,
    };
}
