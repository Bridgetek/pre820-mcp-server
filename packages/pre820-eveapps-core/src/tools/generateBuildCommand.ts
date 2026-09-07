import { z } from "zod";
import { loadBuildMatrix } from "../lib/loadIndex.js";

const projectNamePattern = /^[A-Za-z0-9][A-Za-z0-9_.+-]*$/;
const toolchainPathPattern = /^(?:[A-Za-z]:[\\/]|\/)[A-Za-z0-9 _().+\\/-]+$/;

export const generateBuildCommandInput = z.object({
    platform: z.string().min(1),
    graphics: z.string().min(1),
    display: z.string().min(1),
    toolchain: z.enum(["cmake", "nmake"]).default("cmake"),
    project: z.string().max(120).regex(
        projectNamePattern,
        "Project must be a DemoApps or SampleApp folder name"
    ).optional(),
    ft9xx_toolchain: z.string().trim().min(1).max(260).regex(
        toolchainPathPattern,
        "FT9XX toolchain must be an absolute path without shell metacharacters"
    ).optional(),
});

export type GenerateBuildCommandInput = z.infer<typeof generateBuildCommandInput>;

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

export function generateBuildCommand(args: GenerateBuildCommandInput) {
    const matrix = loadBuildMatrix();
    const errors: string[] = [];
    const selectedToolchain = args.toolchain ?? "cmake";

    // Public callers can invoke this function without going through Zod.
    if (args.project && (args.project.length > 120 || !projectNamePattern.test(args.project))) {
        errors.push("Project must be a DemoApps or SampleApp folder name.");
    }
    if (args.ft9xx_toolchain && (
        args.ft9xx_toolchain.length > 260 ||
        !toolchainPathPattern.test(args.ft9xx_toolchain)
    )) {
        errors.push("FT9XX toolchain must be an absolute path without shell metacharacters.");
    }

    const platformMatch = Object.entries(matrix.platforms).find(
        ([name]) => normalize(name) === normalize(args.platform)
    );
    const platformName = platformMatch?.[0];
    const platform = platformMatch?.[1];
    if (!platformName || !platform) {
        errors.push(`Unknown platform: ${args.platform}`);
    }

    const graphicsList = matrix.graphics ?? [];
    const graphicsName = graphicsList.find(
        (item) => normalize(item) === normalize(args.graphics)
    );
    if (!graphicsName) {
        errors.push(`Unsupported graphics: ${args.graphics}`);
    }

    const displayList = matrix.displays ?? [];
    const displayName = displayList.find(
        (item) => normalize(item) === normalize(args.display)
    );
    if (!displayName) {
        errors.push(`Unsupported display: ${args.display}`);
    }

    const isFt9xx = platform?.requires?.includes("FT9XX_TOOLCHAIN") ?? false;
    if (isFt9xx && !args.ft9xx_toolchain) {
        errors.push("FT9XX platforms require ft9xx_toolchain.");
    }
    if (isFt9xx && selectedToolchain !== "cmake") {
        errors.push("FT9XX platforms must use the CMake build flow.");
    }

    if (errors.length > 0) {
        return {
            valid: false,
            errors,
            suggested_fixes: [
                "Check platform/graphics/display spelling in build_matrix.json",
                "Use a display and graphics value listed in the repository matrix",
                "For FT90X/FT93X, provide the FT9XX Toolchain installation path",
            ],
        };
    }

    const generatorName = platform!.generator ?? "Unix Makefiles";
    const buildTool = platform!.buildTool ?? matrix.generators?.[generatorName]?.tool ?? "make";
    const definitions = [
        `-DEVE_APPS_PLATFORM=${platformName}`,
        `-DEVE_APPS_GRAPHICS=${graphicsName}`,
        `-DEVE_APPS_DISPLAY=${displayName}`,
        ...(isFt9xx
            ? [`"-DFT9XX_TOOLCHAIN=${args.ft9xx_toolchain}"`]
            : []),
    ];
    const configureCommand = `cmake -G "${generatorName}" ${definitions.join(" ")} ..`;
    const buildCommand = `cmake --build ./${args.project ? ` --target ${args.project}` : ""}`;
    const commands = selectedToolchain === "cmake"
        ? [
            "cmake -E make_directory build",
            "cd build",
            configureCommand,
            buildCommand,
        ]
        : [`${buildTool} ${args.project ?? "SampleApp"}`];

    return {
        valid: true,
        command: commands.join(" && "),
        commands,
        configureCommand: selectedToolchain === "cmake" ? configureCommand : undefined,
        buildCommand: selectedToolchain === "cmake" ? buildCommand : commands[0],
        platform,
        platformName,
        graphicsName,
        displayName,
        generator: generatorName,
        buildTool,
        requirements: platform!.requires ?? [],
        notes: [
            "Generated from the current build_matrix.json schema",
            ...(isFt9xx
                ? ["FT90X/FT93X uses Eclipse CDT4 - Unix Makefiles and requires FT9XX_TOOLCHAIN"]
                : ["Add board-specific prerequisites separately if needed"]),
        ],
    };
}
