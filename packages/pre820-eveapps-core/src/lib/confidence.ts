export function clampConfidence(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value));
}

/**
 * Convert an unbounded positive ranking score to a 0-1 confidence value.
 * A score equal to `scale` maps to 0.5, with diminishing returns above it.
 */
export function rankingScoreToConfidence(score: number, scale = 5): number {
    if (!Number.isFinite(score) || score <= 0) return 0;
    if (!Number.isFinite(scale) || scale <= 0) {
        throw new Error("Confidence scale must be greater than zero.");
    }

    return clampConfidence(score / (score + scale));
}
