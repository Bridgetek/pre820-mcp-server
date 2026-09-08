import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
    findRelevantSample,
    findRelevantSampleInput,
} from "./tools/findRelevantSample.js";
import {
    explainEveSymbol,
    explainEveSymbolInput,
} from "./tools/explainEveSymbol.js";
import {
    generateBuildCommand,
    generateBuildCommandInput,
} from "./tools/generateBuildCommand.js";
import {
    traceFeatureToCommands,
    traceFeatureToCommandsInput,
} from "./tools/traceFeatureToCommands.js";
import {
    generateScreenScaffold,
    generateScreenScaffoldInput,
} from "./tools/generateScreenScaffold.js";
import {
    validatePre820Code,
    validatePre820CodeInput,
} from "./tools/validatePre820Code.js";
import {
    readSourceFile,
    readSourceFileInput,
} from "./tools/readSourceFile.js";

import { loadBuildMatrix, loadCommands, loadSamples, loadRegisters } from "./lib/loadIndex.js";

const server = new McpServer({
    name: "pre820-mcp-server",
    version: "1.0.1",
});

server.registerTool(
    "find_relevant_sample",
    {
        title: "Find Relevant PRE820 Sample",
        description: "Find the most relevant sample in the PRE820 repository for a user request.",
        inputSchema: findRelevantSampleInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(findRelevantSample(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "explain_eve_symbol",
    {
        title: "Explain EVE Symbol",
        description: "Explain a PRE820/EVE helper or GPU macro, including canonical EVE_CoDl and EVE_CoCmd helpers. Prefer helpers over raw XXX and CMD_XXX macros in generated application code.",
        inputSchema: explainEveSymbolInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(explainEveSymbol(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "generate_build_command",
    {
        title: "Generate Build Command",
        description: "Generate a valid build command from platform/graphics/display/SPI selections.",
        inputSchema: generateBuildCommandInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(generateBuildCommand(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "trace_feature_to_commands",
    {
        title: "Trace Feature to Commands",
        description: "Map a requested PRE820 feature to related commands and samples.",
        inputSchema: traceFeatureToCommandsInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(traceFeatureToCommands(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "generate_screen_scaffold",
    {
        title: "Generate Screen Scaffold",
        description: `
Generate a partial PRE820 screen scaffold for integration into an EveApps project.

IMPORTANT:
- Treat the output as a starting point, not production-ready source
- Add the requested controls inside the display frame
- Verify application globals and platform-specific initialization
- Compile and test the result in the target project

The generated scaffold is not authoritative and must be reviewed before use.
`,
        inputSchema: generateScreenScaffoldInput.shape,
    },
    async (args) => {
        const scaffold = generateScreenScaffold(args);

        if (!scaffold.files?.length) {
            throw new Error("No scaffold files generated");
        }

        const files = scaffold.files;
        const file = files[0]!;

        const artifact = {
            artifactType: "source_scaffold",
            scaffoldType: "partial_screen_scaffold",

            language: "c",
            path: file.path,

            complete: scaffold.complete,
            authoritative: scaffold.authoritative,

            includesRuntimeInit: true,
            includesCalibration: true,

            notes: scaffold.notes,

            content: file.content,
        };

        return {
            structuredContent: artifact,

            content: [
                {
                    type: "text",
                    text:
`GENERATED PRE820 SCREEN SCAFFOLD

Path: ${file.path}

This is a partial starting point, not production-ready or authoritative code.
Add controls inside the display frame, verify application globals and
platform-specific initialization, then compile and test in the target project.
`,
                },
                {
                    type: "text",
                    text: file.content,
                },
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            artifactType: artifact.artifactType,
                            scaffoldType: artifact.scaffoldType,
                            path: artifact.path,
                            complete: artifact.complete,
                            authoritative: artifact.authoritative,
                            includesRuntimeInit:
                                artifact.includesRuntimeInit,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }
);

server.registerTool(
    "validate_pre820_code",
    {
        title: "Validate PRE820 Code",
        description: "Check PRE820/EVE code and recommend EVE_CoDl or EVE_CoCmd helpers for equivalent raw GPU macros, while allowing intentional packed command usage.",
        inputSchema: validatePre820CodeInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(validatePre820Code(args), null, 2),
            },
        ],
    })
);

server.registerTool(
    "pre820_read_file",
    {
        title: "Read raw source file",
        description: "Read the raw contents of a file from the local EveApps repository.",
        inputSchema: readSourceFileInput.shape,
    },
    async (args) => ({
        content: [
            {
                type: "text",
                text: JSON.stringify(readSourceFile(args, {
                    workspaceRoot: process.cwd(),
                    eveappsRoot: process.env.EVEAPPS_ROOT,
                } as any), null, 2),
            },
        ],
    })
);

server.registerResource(
    "pre820_commands",
    "pre820://api/commands",
    {
        title: "PRE820 Commands Index",
        description: "Indexed PRE820/EVE command list",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "pre820://api/commands",
                mimeType: "application/json",
                text: JSON.stringify(loadCommands(), null, 2),
            },
        ],
    })
);

server.registerResource(
    "pre820_registers",
    "pre820://api/registers",
    {
        title: "PRE820 Registers Index",
        description: "Indexed PRE820/EVE register and constant list",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "pre820://api/registers",
                mimeType: "application/json",
                text: JSON.stringify(loadRegisters(), null, 2),
            },
        ],
    })
);

server.registerResource(
    "pre820_samples",
    "pre820://samples",
    {
        title: "PRE820 Samples Index",
        description: "Indexed PRE820 sample list",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "pre820://samples",
                mimeType: "application/json",
                text: JSON.stringify(loadSamples(), null, 2),
            },
        ],
    })
);

server.registerResource(
    "pre820_build_matrix",
    "pre820://build/matrix",
    {
        title: "PRE820 Build Matrix",
        description: "Allowed build combinations",
        mimeType: "application/json",
    },
    async () => ({
        contents: [
            {
                uri: "pre820://build/matrix",
                mimeType: "application/json",
                text: JSON.stringify(loadBuildMatrix(), null, 2),
            },
        ],
    })
);

async function main() {
    console.error("MCP SERVER STARTED");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP SERVER CONNECTED");
}

main().catch((err) => {
    console.error("PRE820 MCP server failed:", err);
    process.exit(1);
});
