import { WorkspaceContext } from "../context.js";
import { analyzeQuery } from "./analyzeQuery.js";
import { routeQuery } from "./routeQuery.js";
import { mergeResults } from "./mergeResults.js";
import { RetrievalResult } from "./types.js";

import { searchCore } from "../search/searchCore.js";
import { searchEveApps } from "../search/searchEveApps.js";
import { loadGraphics, loadModules } from "../lib/loadIndex.js";
import { resolveModuleGraphics } from "../lib/moduleGraphicsLookup.js";

function lookupModuleGraphicsContext(query: string): Record<string, unknown> | undefined {
    const resolution = resolveModuleGraphics(query, loadModules(), loadGraphics());
    return resolution ? { ...resolution } : undefined;
}

export async function retrieveAnswer(
    context: WorkspaceContext,
    query: string
): Promise<RetrievalResult> {
    const coreResult = searchCore(context, query);
    const moduleGraphicsContext = lookupModuleGraphicsContext(query);
    const analysis = analyzeQuery(query);
    const decision = routeQuery(
        query,
        analysis,
        coreResult?.confidence ?? 0,
        !!context.eveappsRoot
    );

    switch (decision.source) {
        case "core":
            return {
                answer: coreResult.answer,
                confidence: coreResult.confidence,
                source: "core",
                references: coreResult.references,
                metadata: moduleGraphicsContext,
            };

        case "eveapps": {
            const eveappsResult = await searchEveApps(context.eveappsRoot!, query);
            return {
                answer: eveappsResult.answer,
                confidence: eveappsResult.confidence,
                source: "eveapps",
                references: eveappsResult.references,
                metadata: moduleGraphicsContext,
            };
        }

        case "both": {
            const eveappsResult = await searchEveApps(context.eveappsRoot!, query);
            const merged = mergeResults(coreResult, eveappsResult);
            if (moduleGraphicsContext) {
                merged.metadata = {
                    ...(merged.metadata ?? {}),
                    moduleGraphics: moduleGraphicsContext,
                };
            }
            return merged;
        }

        default:
            return coreResult;
    }
}
