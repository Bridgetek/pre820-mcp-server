import type { GraphicsIndexItem, ModuleIndexItem } from "../types.js";
import type {
    RegisterIndexItem,
    RegisterSupportCondition,
    RegisterVariant,
} from "./loadIndex.js";

export interface RegisterVariantContext {
    family?: string;
    graphics?: string;
}

export interface ResolvedGraphicsContext {
    graphics: string;
    family: string;
}

function normalizeGraphics(value: string): string {
    return value.trim().toUpperCase().replace(/^EVE_GRAPHICS_/, "");
}

function parseGeneration(value: string): { generation: number; orLater: boolean } | null {
    const match = /^GEN(\d+)(\+)?$/i.exec(value.trim());
    if (!match) return null;

    return {
        generation: Number(match[1]),
        orLater: Boolean(match[2]),
    };
}

function familyMatches(actual: string, expected: string): boolean {
    const actualGeneration = parseGeneration(actual);
    const expectedGeneration = parseGeneration(expected);

    if (!actualGeneration || !expectedGeneration) {
        return actual.trim().toUpperCase() === expected.trim().toUpperCase();
    }

    return expectedGeneration.orLater
        ? actualGeneration.generation >= expectedGeneration.generation
        : actualGeneration.generation === expectedGeneration.generation;
}

function conditionMatches(
    condition: RegisterSupportCondition,
    context: RegisterVariantContext
): boolean {
    if (condition.graphics) {
        if (!context.graphics) return false;
        const actualGraphics = normalizeGraphics(context.graphics);
        if (!condition.graphics.some(value => normalizeGraphics(value) === actualGraphics)) {
            return false;
        }
    }

    if (condition.family) {
        if (!context.family) return false;
        if (!condition.family.some(value => familyMatches(context.family!, value))) {
            return false;
        }
    }

    return true;
}

function variantSpecificity(variant: RegisterVariant): number {
    // A concrete graphics match is more specific than a family-wide match.
    return (variant.supportedWhen.graphics ? 2 : 0) +
        (variant.supportedWhen.family ? 1 : 0);
}

export function resolveGraphicsContext(
    graphics: string | undefined,
    graphicsIndex: Record<string, GraphicsIndexItem>,
    modulesIndex: Record<string, ModuleIndexItem> = {}
): ResolvedGraphicsContext | undefined {
    if (!graphics) return undefined;

    const graphicsKey = normalizeGraphics(graphics);
    const directGraphics = Object.entries(graphicsIndex).find(
        ([key]) => normalizeGraphics(key) === graphicsKey
    );
    if (directGraphics) {
        return {
            graphics: directGraphics[0],
            family: directGraphics[1].family,
        };
    }

    const moduleEntry = Object.entries(modulesIndex).find(
        ([key]) => normalizeGraphics(key) === graphicsKey
    )?.[1];
    if (!moduleEntry) return undefined;

    const moduleGraphicsKey = normalizeGraphics(moduleEntry.graphic);
    const resolvedGraphics = Object.entries(graphicsIndex).find(
        ([key]) => normalizeGraphics(key) === moduleGraphicsKey
    );
    if (!resolvedGraphics) return undefined;

    return {
        graphics: resolvedGraphics[0],
        family: resolvedGraphics[1].family,
    };
}

export function inferGraphicsFamily(
    graphics: string | undefined,
    graphicsIndex: Record<string, GraphicsIndexItem>,
    modulesIndex: Record<string, ModuleIndexItem> = {}
): string | undefined {
    return resolveGraphicsContext(graphics, graphicsIndex, modulesIndex)?.family;
}

export function resolveRegisterVariant(
    register: RegisterIndexItem,
    context: RegisterVariantContext
): RegisterVariant | undefined {
    return register.variants
        ?.filter(variant => conditionMatches(variant.supportedWhen, context))
        .sort((left, right) => variantSpecificity(right) - variantSpecificity(left))[0];
}
