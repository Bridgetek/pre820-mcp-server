import type { GraphicsIndexItem, ModuleIndexItem } from "../types.js";

export interface ModuleGraphicsMatch {
    module: string;
    alias: string;
    details: ModuleIndexItem;
}

export interface ModuleGraphicsResolution {
    query: string;
    matchType: "module" | "graphics";
    module: string | null;
    graphic: string;
    moduleDetails: ModuleIndexItem | null;
    matchingModules: ModuleGraphicsMatch[];
    graphicsDetails: GraphicsIndexItem | null;
    graphicsFamily: string | null;
    graphicsFeatures: string[];
}

function normalize(value: string): string {
    return value.trim().toUpperCase();
}

function shortModuleName(value: string): string {
    return value.replace(/^EVE_GRAPHICS_/i, "");
}

function identifierAppearsIn(query: string, identifier: string): boolean {
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Z0-9])${escaped}($|[^A-Z0-9])`, "i").test(query);
}

function findGraphics(
    query: string,
    graphics: Record<string, GraphicsIndexItem>
): [string, GraphicsIndexItem] | undefined {
    const entries = Object.entries(graphics);
    const exact = entries.find(([key]) => normalize(key) === normalize(query));
    if (exact) return exact;

    return entries
        .sort(([a], [b]) => b.length - a.length)
        .find(([key]) => identifierAppearsIn(query, key));
}

function findModule(
    query: string,
    modules: Record<string, ModuleIndexItem>
): [string, ModuleIndexItem] | undefined {
    const entries = Object.entries(modules);
    const normalizedQuery = normalize(query);
    const exact = entries.find(([key]) =>
        normalize(key) === normalizedQuery || normalize(shortModuleName(key)) === normalizedQuery
    );
    if (exact) return exact;

    return entries
        .sort(([a], [b]) => shortModuleName(b).length - shortModuleName(a).length)
        .find(([key]) => identifierAppearsIn(query, shortModuleName(key)));
}

function matchingModules(
    graphic: string,
    modules: Record<string, ModuleIndexItem>
): ModuleGraphicsMatch[] {
    return Object.entries(modules)
        .filter(([, entry]) => normalize(entry.graphic) === normalize(graphic))
        .map(([key, details]) => ({
            module: key,
            alias: shortModuleName(key),
            details,
        }));
}

export function resolveModuleGraphics(
    query: string,
    modules: Record<string, ModuleIndexItem>,
    graphics: Record<string, GraphicsIndexItem>
): ModuleGraphicsResolution | undefined {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return undefined;

    // A chip name such as BT817 intentionally takes precedence over the
    // generic EVE_GRAPHICS_BT817 module selector so callers get the complete
    // chip-to-module mapping.
    const graphicsMatch = findGraphics(trimmedQuery, graphics);
    const moduleMatch = graphicsMatch ? undefined : findModule(trimmedQuery, modules);

    if (!graphicsMatch && !moduleMatch) return undefined;

    const graphic = graphicsMatch?.[0] ?? moduleMatch![1].graphic;
    const graphicsDetails = graphicsMatch?.[1]
        ?? Object.entries(graphics).find(([key]) => normalize(key) === normalize(graphic))?.[1]
        ?? null;

    return {
        query,
        matchType: graphicsMatch ? "graphics" : "module",
        module: moduleMatch?.[0] ?? null,
        graphic,
        moduleDetails: moduleMatch?.[1] ?? null,
        matchingModules: matchingModules(graphic, modules),
        graphicsDetails,
        graphicsFamily: graphicsDetails?.family ?? null,
        graphicsFeatures: graphicsDetails?.feature ?? [],
    };
}
