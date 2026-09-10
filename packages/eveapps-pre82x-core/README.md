# @bridgetek/eveapps-pre82x-core

Core runtime library for PRE820 and EveApps development workflows.

`@bridgetek/eveapps-pre82x-core` provides the retrieval engine, ranking logic, indexed data access, and reusable tool implementations used by the `@bridgetek/eveapps-pre82x-mcp-server`.

It includes:

- Programmatic APIs and utilities for PRE820/EveApps knowledge retrieval
- Sample, command, register, and feature indexing support
- Runtime data files required for search and ranking operations
- Core functionality shared by MCP-based developer tools

## Installation

From npm (public scoped package):

```bash
npm install @bridgetek/eveapps-pre82x-core
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
} from "@bridgetek/eveapps-pre82x-core";

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

## Relationship with EveApps-Pre82x MCP Server

This package is the core library layer used by:

`@bridgetek/eveapps-pre82x-mcp-server`

The MCP server provides the AI integration layer, while this package provides the underlying:

- knowledge retrieval
- sample discovery
- API lookup
- ranking and indexing capabilities

## Development

From the repo root (monorepo):

```bash
# install locked dependencies
npm ci
# build this package
npm --prefix packages/eveapps-pre82x-core run build
# or build all packages from root
npm run build
```

Use `npm ci` for fresh checkouts and CI builds. Commit the root `package-lock.json` to GitHub so contributors and CI use the same dependency versions. This monorepo shares one root lockfile; do not create a separate lockfile in this package.

To add or update this package's dependencies, run `npm install <dependency> --workspace @bridgetek/eveapps-pre82x-core` from the repository root. Commit the changed package manifest together with the root `package-lock.json`. Keep `node_modules/` ignored by Git.

If `npm ci` reports that the lockfile and package manifests are out of sync after an intentional dependency change, run `npm install` from the repository root and commit the updated manifests and root lockfile.

TypeScript path mapping in `packages/eveapps-pre82x-mcp-server/tsconfig.json` points at the local `src/index.ts` for fast development.

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
cd packages/eveapps-pre82x-core
# ensure version bumped if needed
npm version patch
npm publish --access public
```

Then publish dependent packages (for example `@bridgetek/eveapps-pre82x-mcp-server`) after the core package is available.

> [!NOTE]
> - The package is configured as a public scoped npm package.
> - If npm account security requires two-factor authentication, an OTP may be required during publishing.
> - Dependent packages such as `@bridgetek/eveapps-pre82x-mcp-server` should be updated after publishing a new core version.

## License

See the repository `LICENSE.md` for licensing details.

## Maintainers

BridgeTek internal team
