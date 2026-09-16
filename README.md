# BridgeTek EveApps-Pre82x MCP Server for VS Code

Official Visual Studio Code integration for the
[`@bridgetek/eveapps-pre82x-mcp-server`](https://www.npmjs.com/package/@bridgetek/eveapps-pre82x-mcp-server)
package.

The extension makes PRE820 EveApps tools available to Codex and GitHub
Copilot in Visual Studio Code. It can discover samples, provide EVE API
guidance, generate scaffolds, validate code, and generate build commands.

## Tested AI agents

- Codex
- GitHub Copilot

## Getting started

1. Clone the [EveApps repository](https://github.com/Bridgetek/EveApps), then
   open its root folder in VS Code. The selected folder should contain
   `DemoApps`, `SampleApp`, and `common`.
2. If EveApps is not the first workspace folder, run **EveApps-Pre82x: Select
   EveApps Repository** from the Command Palette.
3. Open Codex or GitHub Copilot Chat in agent mode.
4. Ask the AI agent to connect to the **BridgeTek EveApps-Pre82x** MCP server.
   This extension entry runs the bundled `EveApps-Pre82x` server. For example:
   `Connect to the BridgeTek EveApps-Pre82x MCP server.`
5. Follow the AI agent's instructions to start, trust, or enable the MCP server
   and its tools when prompted.
6. Ask the agent a PRE820 question to confirm the connection. For example:
   `What EveApps-Pre820 tools do you have?`

Here is an example prompt you can try to create a new project:

> Please create a new EVE application project under `SampleApp` that
> demonstrates an on-screen keyboard on a 1280 x 800 LCD and connects to the
> PC through FT4222.

The npm server and its indexed PRE820 data are bundled with the extension. A
global npm installation is not required.

## Settings

- `bridgetekPre820.eveAppsPath`: path to a local EveApps repository. It may be
  absolute or relative to the first workspace folder. When empty, the first
  workspace folder is used. Select the repository root, not an individual
  application under `DemoApps` or `SampleApp`.

## Requirements

- Visual Studio Code 1.125.0 or newer.
- A local checkout of the
  [EveApps repository](https://github.com/Bridgetek/EveApps) for
  project-aware source and sample searches.

## Troubleshooting

Run **MCP: List Servers** from the Command Palette and select **BridgeTek
EveApps-Pre82x** to view its status, output, or restart the server after
changing the repository path.
