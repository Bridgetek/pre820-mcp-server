import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
    createWorkspaceContext,
    generateBuildCommand,
    generateBuildCommandInput,

    findRelevantSample,
    findRelevantSampleInput,

    explainEveSymbol,
    explainEveSymbolInput,

    generateScreenScaffold,
    generateScreenScaffoldInput,

    validatePre820Code,
    validatePre820CodeInput,

    traceFeatureToCommands,
    traceFeatureToCommandsInput,

    readSourceFile,
    readSourceFileInput,

    lookupModuleGraphics,
    lookupModuleGraphicsInput,

    retrieveAnswer
} from "@bridgetek/pre820-eveapps-core";

import path from "path";
import fs from "fs";

// -----------------------------
// Workspace handling
// -----------------------------
function parseArgs(argv: string[]) {
    const args: any = {};

    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--eveapps") {
            args.eveappsRoot = argv[i + 1];
        }
    }

    return args;
}

function printUsage(): void {
    console.log(`Usage: node server.js [--eveapps <path>]

Options:
  --eveapps <path>    Path to the local EveApps repository
  --help, -h          Show this help message
`);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    process.exit(0);
}

// EveApps separation (future-proof)
const args = parseArgs(process.argv);

const eveappsRoot = args.eveappsRoot ?? process.cwd();

// Context object passed to core
const context = createWorkspaceContext(eveappsRoot);

// -----------------------------
// MCP Server
// -----------------------------
const server = new McpServer(
    {
        name: "pre820-mcp-server",
        version: "1.0.1"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// -----------------------------
// Helper wrapper (IMPORTANT)
// Prevents MCP crash propagation
// -----------------------------
type TextContentBlock = {
    type: "text";
    text: string;
    annotations?: {
        audience?: ("user" | "assistant")[];
        priority?: number;
        lastModified?: string;
    };
    _meta?: Record<string, unknown>;
};
type ToolResponse = {
    content: TextContentBlock[];
    _meta?: Record<string, unknown>;
};

function safeTool<Args extends unknown>(fn: (args: Args, extra?: unknown) => Promise<unknown> | unknown) {
    return async (args: Args, extra?: unknown): Promise<ToolResponse> => {
        try {
            const result = await fn(args, extra);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (err: any) {
            console.error("[PRE820 MCP ERROR]", err);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: err.message ?? String(err)
                        }, null, 2)
                    }
                ]
            };
        }
    };
}

// -----------------------------
// Primary PRE820 engineering AI tool
// -----------------------------
server.registerTool(
    "ask_pre820",
    {
        title: "Primary PRE820 and EveApps Engineering Assistant",

        description:
            "Authoritative local PRE820 engineering assistant. " +
            "Uses indexed PRE820 knowledge plus direct source-code " +
            "search over the local EveApps repository configured " +
            "through --eveapps. " +

            "Use this tool FIRST for all PRE820, EveApps, EVE graphics, " +
            "display pipeline, rendering, widget, command buffer, " +
            "register, sample project, build system, SPI, display timing, " +
            "platform porting, UI generation, API usage, and debugging questions. " +

            "Treat EVE_CoDl_xxx helpers and corresponding XXX macros, and EVE_CoCmd_xxx " +
            "helpers and corresponding CMD_XXX tokens from EVE_GpuDefs.h, as equivalent " +
            "during retrieval and usage analysis. Prefer EVE_CoDl_xxx and EVE_CoCmd_xxx " +
            "helpers in generated application code unless a packed or intentionally low-level command word is required. " +

            "This tool searches the user's LOCAL EveApps source tree and " +
            "returns concrete source file matches, sample references, " +
            "commands, and implementation details before external web search.",

        inputSchema: z.object({
            query: z.string().describe(
                "Natural language PRE820/EveApps engineering question"
            )
        }).shape
    },

    safeTool(async (args: { query: string }) => {

        const result = await retrieveAnswer(
            context,
            args.query
        );

        // Strengthen Claude confidence with explicit wording
        return {
            ...result,

            retrieval_context: {
                local_repo_enabled: !!context.eveappsRoot,
                local_repo: context.eveappsRoot ?? null,

                retrieval_priority: [
                    "pre820-eveapps-core index",
                    "local EveApps source repository",
                    "metadata ranking"
                ],

                symbol_policy: {
                    equivalent_for_search: true,
                    generated_code_preference: "EVE_CoDl_* and EVE_CoCmd_* helpers",
                    raw_macros_allowed_for: [
                        "packed display-list word construction",
                        "display-list command arrays",
                        "coprocessor command-buffer arrays",
                        "intentional low-level EVE_Cmd_wr32 paths"
                    ]
                },

                note:
                    "Results were generated from local PRE820/EveApps " +
                    "engineering resources before considering external sources."
            }
        };
    })
);

// -----------------------------
// Legacy tools (unchanged behavior)
// -----------------------------

server.registerTool(
    "generate_build_command",
    {
        title: "Generate validated PRE820 build command",
        description: "Generate a validated build command for PRE820/EVE targets.",
        inputSchema: generateBuildCommandInput.shape,
    },
    safeTool(generateBuildCommand)
);

server.registerTool(
    "find_relevant_sample",
    {
        title: "Find relevant EveApps sample",
        description: "Find the most relevant EveApps sample for the provided request.",
        inputSchema: findRelevantSampleInput.shape,
    },
    safeTool(findRelevantSample)
);

server.registerTool(
    "explain_eve_symbol",
    {
        title: "Explain PRE820/EVE symbol",
        description: "Explain a PRE820/EVE helper or GPU macro, including canonical EVE_CoDl and EVE_CoCmd helpers. Prefer helpers over raw XXX and CMD_XXX macros in generated application code.",
        inputSchema: explainEveSymbolInput.shape,
    },
    safeTool(explainEveSymbol)
);

server.registerTool(
    "generate_screen_scaffold",
    {
        title: "Generate screen scaffold",
        description: "Generate a PRE820 screen scaffold from inputs.",
        inputSchema: generateScreenScaffoldInput.shape,
    },
    safeTool(generateScreenScaffold)
);

server.registerTool(
    "validate_pre820_code",
    {
        title: "Validate PRE820 code for issues",
        description: "Validate PRE820/EVE code and recommend EVE_CoDl or EVE_CoCmd helpers for equivalent raw GPU macros, while allowing intentional packed command usage.",
        inputSchema: validatePre820CodeInput.shape,
    },
    safeTool(validatePre820Code)
);

server.registerTool(
    "trace_feature_to_commands",
    {
        title: "Trace feature to PRE820 commands",
        description: "Trace feature usage to commands.",
        inputSchema: traceFeatureToCommandsInput.shape,
    },
    safeTool(traceFeatureToCommands)
);

server.registerTool(
    "pre820_read_file",
    {
        title: "Read raw source file",
        description: "Read the raw contents of a file from the local EveApps repository.",
        inputSchema: readSourceFileInput.shape,
    },
    safeTool(async (args: { relative_path: string }) => readSourceFile(args, context))
);

server.registerTool(
    "lookup_module_graphics",
    {
        title: "Lookup module and graphics metadata",
        description: "Resolve module codes and graphics chip metadata from the local PRE820 indexes.",
        inputSchema: lookupModuleGraphicsInput.shape,
    },
    safeTool(lookupModuleGraphics)
);

// -----------------------------
// Startup diagnostics (VERY IMPORTANT for EXE)
// -----------------------------
console.error("===================================");
console.error("PRE820 MCP Server Starting...");
console.error("eveappsRoot:", eveappsRoot ?? "NOT SET");
console.error("Node:", process.version);
console.error("===================================");

// -----------------------------
// Start transport
// -----------------------------
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("PRE820 MCP Server running...");
