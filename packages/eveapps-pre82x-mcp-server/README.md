# EveApps-Pre82x MCP Server

EveApps-Pre82x MCP Server for AI-assisted PRE820 and EveApps development.

The server identifies itself to MCP clients as `EveApps-Pre82x`. The npm package and executable are `@bridgetek/eveapps-pre82x-mcp-server` and `eveapps-pre82x-mcp-server`.

`@bridgetek/eveapps-pre82x-mcp-server` provides a local Model Context Protocol (MCP) server that enables AI coding assistants to interact with PRE820/EveApps development resources.

It uses `@bridgetek/eveapps-pre82x-core` as the underlying engine for:

- API and command lookup
- Sample discovery
- Knowledge retrieval
- Ranking and search
- PRE820/EVE development assistance workflows

The server works with a local EveApps repository checkout to provide project-aware development support.

## Installation

Install from npm:

```
npm install -g @bridgetek/eveapps-pre82x-mcp-server
```

Verify installation:

```
eveapps-pre82x-mcp-server --help
```

## Quick start

Start the MCP server with your local EveApps repository:

```
eveapps-pre82x-mcp-server --eveapps /path/to/EveApps-repository
```

If `--eveapps` is not provided, the current working directory will be used.

The server can then be configured as an MCP server in compatible AI development tools such as Claude Code.

Example:

```
{
  "mcpServers": {
    "EveApps-Pre82x": {
      "command": "eveapps-pre82x-mcp-server",
      "args": [
        "--eveapps",
        "/path/to/EveApps-repository"
      ]
    }
  }
}
```

## Command line options

|Option|Description|
|------|-----------|
|--eveapps <path>|Path to a local EveApps repository used for source search and development assistance|
|--help, -h|Display command usage information|

## Features

The MCP server provides AI-assisted workflows for PRE820/EVE development, including:

- Finding relevant PRE820/EVE samples
- Searching API commands and registers
- Retrieving development guidance
- Mapping requirements to existing examples
- Supporting code generation and validation workflows

## Relationship with eveapps-pre82x-core

This package provides the MCP integration layer.

The underlying retrieval and indexing functionality is provided by:

`@bridgetek/eveapps-pre82x-core`

Architecture:

```
AI Assistant
      |
      v
eveapps-pre82x-mcp-server
      |
      v
eveapps-pre82x-core
      |
      v
EveApps repository + indexes
```

## Development

- Source entry: `packages/eveapps-pre82x-mcp-server/src/server.ts` (TypeScript).
- TypeScript path mapping uses the local `@bridgetek/eveapps-pre82x-core` source for fast development. See `packages/eveapps-pre82x-mcp-server/tsconfig.json`.

Build from the monorepo root:

```sh
# Install locked dependencies:
npm ci

# Build all packages:
npm run build

# Or build only the MCP server:
npm --prefix packages/eveapps-pre82x-mcp-server run build

# Run the built server:
node packages/eveapps-pre82x-mcp-server/dist/cli.js --eveapps /path/to/EveApps-repository
```

Use `npm ci` for fresh checkouts and CI builds. Commit the root `package-lock.json` to GitHub so contributors and CI use the same dependency versions. This monorepo shares one root lockfile; do not create a separate lockfile in this package.

To add or update this package's dependencies, run `npm install <dependency> --workspace @bridgetek/eveapps-pre82x-mcp-server` from the repository root. Commit the changed package manifest together with the root `package-lock.json`. Keep `node_modules/` ignored by Git.

## Publishing

This package is scoped to the `@bridgetek` organization and is published publicly. Typical publish flow:

```bash
cd packages/eveapps-pre82x-core
npm publish --access public

cd ../eveapps-pre82x-mcp-server
# ensure core is published first (or available in registry)
npm publish --access public
```

> [!NOTE]
> - `@bridgetek/eveapps-pre82x-core` should be published before publishing this package.
> - The package is configured as a public scoped npm package.
> - If the scoped package already exists, bump `version` before publishing: `npm version patch`.
> - If npm account security requires two-factor authentication, an OTP will be required during publishing.

## Troubleshooting

### Cannot resolve eveapps-pre82x-core

If running from a local development checkout, link both packages:

```bash
npm --prefix packages/eveapps-pre82x-core link
npm --prefix packages/eveapps-pre82x-mcp-server link
```

### Build issues

Make sure dependencies are installed from the repository root:

```
npm ci
```

If `npm ci` reports that the lockfile and package manifests are out of sync after an intentional dependency change, run `npm install` from the repository root and commit the updated manifests and root `package-lock.json`.

Then rebuild:

```
npm run build
```

## License

See repository `LICENSE.md`.

## Maintainers

BridgeTek engineering team
