import { QueryAnalysis } from "./analyzeQuery.js";
import { RouteDecision } from "./types.js";

export function routeQuery(
    query: string,
    analysis: QueryAnalysis,
    coreScore: number,
    hasEveApps: boolean
): RouteDecision {

    // 1. Strong core match -> always use core
    if (coreScore >= 0.75) {
        return {
            source: "core",
            confidence: coreScore,
            reason: "High confidence match in pre820-eveapps-core index"
        };
    }

    // 2. Structured engineering queries -> try both
    if (analysis.isBuild || analysis.isSymbol || analysis.isScreen) {
        return {
            source: hasEveApps ? "both" : "core",
            confidence: 0.6,
            reason: "Structured engineering query"
        };
    }

    // 3. Debug or unknown -> prefer EveApps if available
    if (analysis.isDebug || analysis.isSample) {
        return {
            source: hasEveApps ? "eveapps" : "core",
            confidence: 0.4,
            reason: "Debug/sample query fallback"
        };
    }

    // 4. Default fallback
    return {
        source: hasEveApps ? "eveapps" : "core",
        confidence: 0.2,
        reason: "Default fallback routing"
    };
}