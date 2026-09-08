# Pre820 MCP Server Specification

## 1. Purpose

This document defines the product and engineering specification for a Model Context Protocol (MCP) server built around the `EveApps` repository.

The goal is to turn the Pre820 SDK and sample repository into an AI-assisted developer workflow that helps users:

- find the right sample faster
- understand Pre820 EVE API symbols
- map user requirements to commands and samples
- generate minimal screen scaffolds
- validate common mistakes in Pre820 application code (TBD)
- generate valid build commands for supported target configurations

This MCP server is intended to support both learning and production development workflows.

---

## 2. Product Positioning

Recommended positioning names:

- Pre820 Application Builder Assistant
- Pre820 Sample Navigator
- Pre820 API Copilot
- Pre820 Board Porting Assistant (TBD)

Primary value proposition:

- reduce onboarding time for new developers
- reduce repeated support / FAE effort
- improve discoverability of samples and APIs
- provide repo-grounded guidance instead of generic code generation

---

## 3. Scope

### 3.1 In Scope

The MCP server should:

1. index commands, constants, registers, and samples from the repo
2. expose repo-grounded resources to AI clients
3. provide tools for search, explanation, build guidance, and scaffold generation
4. produce deterministic, structured outputs
5. prioritize existing repo samples over invented code patterns

### 3.2 Out of Scope for V1

The MCP server should not:

1. modify the repo automatically
2. generate full production applications from scratch
3. replace the Pre820 programming guide or datasheet
4. invent symbols, macros, or APIs not present in indexed source data
5. require a vector database in the first release

---

## 4. Target Users

### 4.1 Beginner Developer

Typical needs:

- Which sample should I start from?
- What does this command do?
- How do I build for RP2040?

### 4.2 Application Developer

Typical needs:

- How do I build a touch menu?
- Which commands are involved in animation?
- Can you generate a minimal screen skeleton?

### 4.3 Platform Engineer / FAE

Typical needs:

- Which repo sample best matches this customer use case?
- What does `REG_TOUCH_TAG` mean?
- Why does this code look structurally wrong?

---

## 5. Architecture Overview

The system consists of two major parts:

1. offline indexer
2. MCP server

### 5.1 Offline Indexer

The indexer scans the `EveApps` repo and generates structured JSON artifacts:

- `commands.json`
- `samples.json`
- `registers.json`
- `build_matrix.json`
- `feature_graph.json`

### 5.2 MCP Server

The MCP server loads these JSON artifacts and exposes:

- resources
- tools
- prompts

Recommended implementation:

- Language: TypeScript
- Runtime: Node.js 20+
- Transport: stdio
- Data source: local JSON files

---

## 6. Pre820 MCP Server Setup Guide for EveApps

This guide explains how to connect the Pre820 MCP Server to your local EveApps workspace, enabling AI assistants to understand the EveApps SDK, browse samples, and provide project-aware assistance.

### Developing this monorepo

From the root of this repository, install the locked dependencies and build all packages:

```sh
npm ci
npm run build
```

Use `npm ci` for fresh checkouts and CI builds. It installs the versions recorded in `package-lock.json` and fails if the lockfile and package manifests are out of sync.

Commit the root `package-lock.json` to GitHub. This npm workspace uses one shared lockfile; run dependency commands from the repository root rather than creating lockfiles in individual packages. When adding or updating dependencies, use `npm install` (with `--workspace <package-name>` for a workspace package) and commit the changed `package.json` files together with `package-lock.json`. Keep `node_modules/` ignored by Git.

The installation instructions below are for using the published MCP server with an EveApps checkout.

### Prerequisites

Before you begin, make sure you have:

* **Node.js** (version 18 or later recommended)

You can verify your Node.js installation:
```sh
node -v
npm -v
```
#### Download the EveApps Repository

Clone or download the EveApps repository to your local machine.

Example:

```sh
git clone https://github.com/Bridgetek/EveApps
```

Suppose the repository is located at:

```sh
D:\EveApps
```

#### Install the latest version globally using npm:

```sh
npm install -g @bridgetek/pre820-mcp-server
```

After installation, you can verify it by running:

```sh
pre820-mcp-server --help
```

### Option 1: Using Visual Studio Code + Claude Code

#### Step 1: Open the EveApps Repository

Open the **EveApps** folder in Visual Studio Code.

#### Step 2: Create an MCP Configuration File

In the **root directory** of the repository, create a new file named:

```
.mcp.json
```

Add the following content:

```
{
  "mcpServers": {
    "pre820": {
      "command": "pre820-mcp-server",
      "args": [
        "--eveapps",
        "D:\\EveApps"
      ]
    }
  }
}
```

Replace:

```
D:\\EveApps
```

with the actual path to your local EveApps repository.

For example:

```
{
  "mcpServers": {
    "pre820": {
      "command": "pre820-mcp-server",
      "args": [
        "--eveapps",
        "C:\\Users\\John\\Documents\\EveApps"
      ]
    }
  }
}
```

> [!NOTE]
> * Use double backslashes (\\) in Windows paths inside JSON files.
> * Alternatively, you may use forward slashes:
> "D:/EveApps"

#### Step 3: Restart Visual Studio Code

Save the **.mcp.json** file.

Close and reopen Visual Studio Code (or reload the window) so that the MCP configuration is detected and the Pre820 MCP Server starts.

#### Step 4: Verify the MCP Server

Open Claude Code and run:

```
/mcp
```

Confirm that the Pre820 MCP Server appears in the list and shows a connected status.

Once connected, you can start using the server by asking questions such as:

```
What tools do you have for Pre820?
```

If the MCP server is configured correctly, Claude Code should list the available Pre820 development tools.

### Option 2: Using Claude Desktop

#### Step 1: Open Claude Desktop MCP Settings

Open the Claude Desktop MCP configuration file("claude_desktop_config.json") and add a new Pre820 server entry.

#### step 2: Add the Pre820 MCP Server Configuration

Example configuration:

```
{
  "mcpServers": {
    "pre820": {
      "command": "pre820-mcp-server",
      "args": [
        "--eveapps",
        "D:\\EveApps"
      ]
    }
  }
}
```

Replace the path with the location of your local EveApps repository.

#### Step 3: Restart Claude Desktop

Save the configuration file, **completely close** Claude Desktop, and then launch it again to ensure the new MCP configuration is loaded.

#### Step 4: Verify the MCP Server

Start a new conversation and ask:

```
What tools do you have for Pre820?
```

If the server starts successfully, Claude Desktop will be able to access the Pre820-specific tools provided by the MCP server.

### Troubleshooting
#### pre820-mcp-server is not recognized

Verify that the package was installed successfully:

```sh
npm install -g pre820-mcp-server
```

Then check:

```sh
pre820-mcp-server --help
```

If the command is still not found, ensure that your global npm installation path is included in your system **PATH** environment variable.

#### The claude code cannot find any Pre820 tools

Check that:

* .mcp.json is located in the root of the EveApps workspace.
* The --eveapps path points to the correct local repository.
* Visual Studio Code has been restarted after creating or modifying .mcp.json.

### Example Directory Structure
```
EveApps/
│
├── .mcp.json
├── common/
├── SampleApp/
└── ...
```
