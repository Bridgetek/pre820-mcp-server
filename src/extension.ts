import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

const providerId = 'bridgetek.pre820';
const configurationSection = 'bridgetekPre820';
const eveAppsPathSetting = 'eveAppsPath';
const selectRepositoryCommand = 'bridgetek.pre820.selectEveAppsRepository';

interface ServerPackage {
	cliPath: string;
	version: string;
}

export function activate(context: vscode.ExtensionContext): void {
	const didChangeEmitter = new vscode.EventEmitter<void>();

	context.subscriptions.push(didChangeEmitter);
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration(`${configurationSection}.${eveAppsPathSetting}`)) {
			didChangeEmitter.fire();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand(selectRepositoryCommand, async () => {
		const selection = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
			openLabel: 'Use as EveApps Repository',
			title: 'Select the local EveApps repository',
		});

		if (!selection?.[0]) {
			return;
		}

		const target = vscode.workspace.workspaceFile || vscode.workspace.workspaceFolders?.length
			? vscode.ConfigurationTarget.Workspace
			: vscode.ConfigurationTarget.Global;
		await vscode.workspace
			.getConfiguration(configurationSection)
			.update(eveAppsPathSetting, selection[0].fsPath, target);
		void vscode.window.showInformationMessage(`Pre820 EveApps repository set to ${selection[0].fsPath}`);
	}));

	context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider(providerId, {
		onDidChangeMcpServerDefinitions: didChangeEmitter.event,
		provideMcpServerDefinitions: () => {
			const serverPackage = getServerPackage(context);
			const eveAppsPath = getEveAppsPath();
			return [createMcpServerDefinition(
				serverPackage.cliPath,
				serverPackage.version,
				eveAppsPath,
			)];
		},
		resolveMcpServerDefinition: async server => {
			if (!(server instanceof vscode.McpStdioServerDefinition)) {
				return undefined;
			}

			const cliPath = server.args[0];
			if (!cliPath || !fs.existsSync(cliPath)) {
				throw new Error(
					'The bundled @bridgetek/eveapps-pre82x-mcp-server package is missing. Reinstall the EveApps-Pre82x extension.',
				);
			}

			const eveAppsPath = server.args[2];
			if (!eveAppsPath || !fs.existsSync(eveAppsPath) || !fs.statSync(eveAppsPath).isDirectory()) {
				const action = await vscode.window.showErrorMessage(
					'The configured Pre820 EveApps repository does not exist.',
					'Select Repository',
				);
				if (action === 'Select Repository') {
					await vscode.commands.executeCommand(selectRepositoryCommand);
				}
				return undefined;
			}

			return server;
		},
	}));
}

export function createMcpServerDefinition(
	cliPath: string,
	version: string,
	eveAppsPath: string,
): vscode.McpStdioServerDefinition {
	const definition = new vscode.McpStdioServerDefinition(
		'BridgeTek EveApps-Pre82x',
		process.execPath,
		[cliPath, '--eveapps', eveAppsPath],
		{
			ELECTRON_RUN_AS_NODE: '1',
		},
		version,
	);
	definition.cwd = vscode.Uri.file(eveAppsPath);
	return definition;
}

function getServerPackage(context: vscode.ExtensionContext): ServerPackage {
	const packageRoot = vscode.Uri.joinPath(
		context.extensionUri,
		'node_modules',
		'@bridgetek',
		'eveapps-pre82x-mcp-server',
	);
	const packageJsonPath = vscode.Uri.joinPath(packageRoot, 'package.json').fsPath;
	const cliPath = vscode.Uri.joinPath(packageRoot, 'dist', 'cli.js').fsPath;

	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: unknown };
		if (typeof packageJson.version !== 'string') {
			throw new Error('package version is missing');
		}
		return { cliPath, version: packageJson.version };
	} catch (error) {
		throw new Error(
			`Unable to load the bundled @bridgetek/eveapps-pre82x-mcp-server package: ${getErrorMessage(error)}`,
		);
	}
}

function getEveAppsPath(): string {
	const configuredPath = vscode.workspace
		.getConfiguration(configurationSection)
		.get<string>(eveAppsPathSetting, '')
		.trim();
	const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	if (!configuredPath) {
		return workspacePath ?? process.cwd();
	}

	return path.isAbsolute(configuredPath)
		? path.normalize(configuredPath)
		: path.resolve(workspacePath ?? process.cwd(), configuredPath);
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function deactivate(): void {}
