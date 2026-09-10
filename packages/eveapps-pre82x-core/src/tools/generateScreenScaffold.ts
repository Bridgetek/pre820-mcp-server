import { z } from "zod";

export const generateScreenScaffoldInput = z.object({
    screen_type: z.string().trim().min(1).max(80),
    controls: z.array(
        z.string().trim().min(1).max(120)
    ).max(50).default([]),
    touch: z.boolean().default(true),
    platform: z.string().trim().min(1).max(80).optional(),
    style: z.string().trim().min(1).max(40).default("repo-native-c"),
    flash: z.boolean().default(false),
});

export type GenerateScreenScaffoldInput = z.infer<typeof generateScreenScaffoldInput>;

function toCIdentifier(value: string): string {
    const identifier = value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9_]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();

    if (!identifier) return "screen";
    return /^[A-Za-z_]/.test(identifier) ? identifier : `_${identifier}`;
}

function escapeCString(value: string): string {
    return [...value].map((character) => {
        switch (character) {
            case "\\": return "\\\\";
            case "\"": return "\\\"";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\t": return "\\t";
            default: {
                const codePoint = character.codePointAt(0)!;
                if (codePoint < 0x20 || codePoint === 0x7f) {
                    return `\\${codePoint.toString(8).padStart(3, "0")}`;
                }
                return character;
            }
        }
    }).join("");
}

function sanitizeCComment(value: string): string {
    return value
        .replace(/[\r\n\t]+/g, " ")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\/\*/g, "/ *")
        .replace(/\*\//g, "* /")
        .replace(/\s+/g, " ")
        .trim();
}

export function generateScreenScaffold(args: GenerateScreenScaffoldInput) {
    // Keep direct programmatic calls safe even when they bypass Zod parsing.
    const screenTitle = (args.screen_type.trim() || "Screen").slice(0, 80);
    const functionName = `${toCIdentifier(screenTitle)}_screen_draw`;
    const controls = args.controls.slice(0, 50).map(
        control => sanitizeCComment(control.slice(0, 120))
    );

    const includes = `#include "Common.h"
#include "Platform.h"
#include "EVE_CoCmd.h"`;

    const flashInitialization = args.flash
        ? `Flash_Init(s_pHalContext, TEST_DIR "/Flash/BT81X_Flash.bin", "BT81X_Flash.bin");

    if (!FlashHelper_SwitchFullMode(s_pHalContext))
    {
        APP_ERR("Flash is not able to switch full mode");
        return;
    }`
        : "/* Flash initialization omitted because flash support is disabled. */";

    const content = `${includes}

void ${functionName}(EVE_HalContext* phost) {
    /* Initialize display */
    s_pHalContext = &s_halContext;
    Gpu_Init(s_pHalContext);

    // read and store calibration setting
#if !defined(BT8XXEMU_PLATFORM) && GET_CALIBRATION == 1
    Esd_Calibrate(s_pHalContext);
    Calibration_Save(s_pHalContext);
#endif

    ${flashInitialization}
    EVE_Util_clearScreen(s_pHalContext);

    Display_Start(s_pHalContext);
    /* Title */
    EVE_CoCmd_text(s_pHalContext, 40, 30, 30, 0, "${escapeCString(screenTitle)}");
    Display_End(s_pHalContext);

    /* Controls */
    ${controls.map((control, i) => `/* TODO: control ${i + 1}: ${control} */`).join("\n    ")}

    ${args.touch ? "/* TODO: assign TAG values and handle touch routing */" : ""}

    EVE_Util_clearScreen(s_pHalContext);
    Gpu_Release(s_pHalContext);
}
`;

    return {
        complete: false,
        authoritative: false,
        based_on_sample: "to-be-selected-by-findRelevantSample",
        files: [
            {
                path: `generated/${functionName}.c`,
                content,
            },
        ],
        notes: [
            "Partial scaffold that must be integrated and compiled in the target EveApps project",
            args.flash
                ? "Flash initialization is enabled"
                : "Flash initialization is disabled",
            "Add generated controls inside the Display_Start/Display_End frame flow",
            "Confirm s_pHalContext and s_halContext are declared by the target application",
            "Review platform-specific initialization before using this scaffold",
            "Use the nearest widget/touch sample as the implementation reference",
        ],
    };
}
