import { z } from "zod";
import { eveFunctionToGpuMacro } from "../lib/eveSymbolAliases.js";
import { loadCommands } from "../lib/loadIndex.js";

export const validatePre820CodeInput = z.object({
    code: z.string().min(1),
    platform: z.string().optional(),
    display: z.string().optional(),
});

export type ValidatePre820CodeInput = z.infer<typeof validatePre820CodeInput>;

export function validatePre820Code(args: ValidatePre820CodeInput) {
    const code = args.code;
    const macroToHelper = new Map<string, string>();
    for (const command of loadCommands()) {
        const macro = eveFunctionToGpuMacro(command.name);
        if (macro && !macroToHelper.has(macro)) {
            macroToHelper.set(macro, command.name);
        }
    }

    const invokedMacros = [...code.matchAll(/\b([A-Z][A-Z0-9_]*)\s*\(/g)]
        .map(match => match[1])
        .filter((macro): macro is string => !!macro);
    const coprocessorTokens = [...code.matchAll(/\b(CMD_[A-Z0-9_]+)\b/g)]
        .map(match => match[1])
        .filter((macro): macro is string => !!macro);
    const preferredReplacements = [...new Set([...invokedMacros, ...coprocessorTokens])]
        .filter(macro => macroToHelper.has(macro))
        .map(macro => ({
        found: macro,
        preferred: macroToHelper.get(macro)!,
    }));
    const issues: Array<{
        severity: "high" | "medium" | "low";
        title: string;
        detail: string;
        suggestion: string;
    }> = [];

    const hasCoprocessorUsage = /EVE_CoCmd_/m.test(code) || preferredReplacements.some(
        replacement => replacement.preferred.startsWith("EVE_CoCmd_")
    );
    if (!hasCoprocessorUsage) {
        issues.push({
            severity: "low",
            title: "No obvious coprocessor commands detected",
            detail: "The snippet does not appear to use known EVE command helpers.",
            suggestion: "Check whether this is the intended rendering layer.",
        });
    }

    const tagMatches = [...code.matchAll(/\bTAG\s*\(\s*(\d+)\s*\)/g)].map((m) => m[1]);
    const duplicates = tagMatches.filter((tag, i) => tagMatches.indexOf(tag) !== i);
    if (duplicates.length > 0) {
        issues.push({
            severity: "medium",
            title: "Duplicate touch tag values",
            detail: `Repeated TAG ids found: ${[...new Set(duplicates)].join(", ")}`,
            suggestion: "Assign unique TAG values to each interactive control.",
        });
    }

    if (!/DISPLAY|swap|Swap|DL_DISPLAY/i.test(code)) {
        issues.push({
            severity: "medium",
            title: "Possible incomplete frame/display-list sequence",
            detail: "No obvious display termination or swap marker found.",
            suggestion: "Verify the display-list end and frame swap sequence.",
        });
    }

    if (preferredReplacements.length > 0) {
        issues.push({
            severity: "low",
            title: "Raw EVE macro has a preferred helper",
            detail: preferredReplacements
                .map(replacement => `${replacement.found} -> ${replacement.preferred}`)
                .join(", "),
            suggestion:
                "Prefer the EVE_CoDl or EVE_CoCmd helper in generated application code. Keep the raw macro only when intentionally constructing, storing, or transmitting low-level command words.",
        });
    }

    return {
        issues,
        preferred_replacements: preferredReplacements,
        symbol_policy: {
            equivalent_for_search: true,
            generated_code_preference: "EVE_CoDl_* and EVE_CoCmd_* helpers",
            raw_macros_allowed_for: [
                "packed display-list word construction",
                "display-list command arrays",
                "coprocessor command-buffer arrays",
                "intentional low-level EVE_Cmd_wr32 paths",
            ],
        },
        summary: {
            high: issues.filter((i) => i.severity === "high").length,
            medium: issues.filter((i) => i.severity === "medium").length,
            low: issues.filter((i) => i.severity === "low").length,
        },
    };
}
