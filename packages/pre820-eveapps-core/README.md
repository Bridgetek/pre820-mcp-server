# @bridgetek/pre820-eveapps-core

Core runtime library for PRE820 and EveApps development workflows.

`@bridgetek/pre820-eveapps-core` provides the retrieval engine, ranking logic, indexed data access, and reusable tool implementations used by the `@bridgetek/pre820-mcp-server`.

It includes:

- Programmatic APIs and utilities for PRE820/EveApps knowledge retrieval
- Sample, command, register, and feature indexing support
- Runtime data files required for search and ranking operations
- Core functionality shared by MCP-based developer tools

## Installation

From npm (public scoped package):

```bash
npm install @bridgetek/pre820-eveapps-core
```

When using this monorepo locally, prefer building from source and referencing the package via workspace path or local import.

## Quick usage

Import the primary helpers and tools:

```ts
import {
  createWorkspaceContext,
  retrieveAnswer,
  findRelevantSample,
  // ...other exports
} from "@bridgetek/pre820-eveapps-core";

const context = createWorkspaceContext("/path/to/EveApps-repo");
const result = await retrieveAnswer({ query: "display list of commands" }, { context });
```

Check the `src/index.ts` exports for a complete list of exported symbols.

## Data files

The package includes indexed JSON files used at runtime:

```
data/
 ├── commands.json
 ├── samples.json
 ├── registers.json
 ├── build_matrix.json
 └── feature_graph.json
```

During the build process these files are included in:

`dist/data/`

and published with the npm package.

## Relationship with PRE820 MCP Server

This package is the core library layer used by:

`@bridgetek/pre820-mcp-server`

The MCP server provides the AI integration layer, while this package provides the underlying:

- knowledge retrieval
- sample discovery
- API lookup
- ranking and indexing capabilities

## Development

From the repo root (monorepo):

```bash
# install deps
npm install
# build this package
npm --prefix packages/pre820-eveapps-core run build
# or build all packages from root
npm run build
```

TypeScript path mapping in `packages/pre820-mcp-server/tsconfig.json` points at the local `src/index.ts` for fast development.

## FT90X and FT93X builds

FT9XX targets support two workflows:

1. Import the `FT9XX` project contained in the selected DemoApps or SampleApp project into the FT9XX Toolchain IDE, then build and run it from the GUI.
2. Configure and build from an EveApps `build` directory with CMake:

```bash
cmake -G "Eclipse CDT4 - Unix Makefiles" \
  -DEVE_APPS_PLATFORM=MM900EV3A \
  -DEVE_APPS_GRAPHICS=EVE_GRAPHICS_BT817 \
  -DEVE_APPS_DISPLAY=WXGA \
  "-DFT9XX_TOOLCHAIN=C:\Program Files (x86)\Bridgetek\FT9xx Toolchain" \
  ..
cmake --build ./
```

Use `cmake --build ./ --target <project>` to build one DemoApps or SampleApp folder. The `generateBuildCommand` API accepts `ft9xx_toolchain` for the installation path and optional `project` for this target.

## Publishing

This package is scoped to the `@bridgetek` org. To publish:

```bash
cd packages/pre820-eveapps-core
# ensure version bumped if needed
npm version patch
npm publish --access public
```

Then publish dependent packages (for example `@bridgetek/pre820-mcp-server`) after the core package is available.

> [!NOTE]
> - The package is configured as a public scoped npm package.
> - If npm account security requires two-factor authentication, an OTP may be required during publishing.
> - Dependent packages such as `@bridgetek/pre820-mcp-server` should be updated after publishing a new core version.

## License

See the repository `LICENSE.md` for licensing details.

## Maintainers

BridgeTek internal team
