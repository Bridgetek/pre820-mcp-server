import * as assert from 'assert';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import { createMcpServerDefinition } from '../extension';

const execFileAsync = promisify(execFile);

suite('Extension Test Suite', () => {
	const extensionId = 'Bridgetek.bridgetek-pre820-mcp-server-extension';
	const commandId = 'bridgetek.pre820.selectEveAppsRepository';

	test('activates and registers the repository command', async () => {
		const extension = vscode.extensions.getExtension(extensionId);
		assert.ok(extension, `Extension ${extensionId} was not found`);

		await extension.activate();
		assert.strictEqual(extension.isActive, true);

		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes(commandId), `Command ${commandId} was not registered`);
	});

	test('bundles the licensed Pre820 MCP server release', () => {
		const extension = vscode.extensions.getExtension(extensionId);
		assert.ok(extension, `Extension ${extensionId} was not found`);

		const serverRoot = path.join(
			extension.extensionPath,
			'node_modules',
			'@bridgetek',
			'eveapps-pre82x-mcp-server',
		);
		const packageJsonPath = path.join(serverRoot, 'package.json');
		const cliPath = path.join(serverRoot, 'dist', 'cli.js');
		const serverPath = path.join(serverRoot, 'dist', 'server.js');

		assert.ok(fs.existsSync(packageJsonPath), 'Bundled server package.json is missing');
		assert.ok(fs.existsSync(cliPath), 'Bundled server CLI is missing');
		assert.ok(fs.existsSync(serverPath), 'Bundled server implementation is missing');

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
			version?: unknown;
		};
		assert.strictEqual(packageJson.version, '1.1.0');

		const serverSource = fs.readFileSync(serverPath, 'utf8');
		assert.match(
			serverSource,
			/name:\s*["']EveApps-Pre82x["'],\s*\r?\n\s*version:\s*["']1\.1\.0["']/,
			'Bundled server runtime version does not match its package version',
		);
	});

	test('starts the bundled server CLI', async function () {
		this.timeout(10_000);

		const extension = vscode.extensions.getExtension(extensionId);
		assert.ok(extension, `Extension ${extensionId} was not found`);

		const cliPath = path.join(
			extension.extensionPath,
			'node_modules',
			'@bridgetek',
			'eveapps-pre82x-mcp-server',
			'dist',
			'cli.js',
		);
		const definition = createMcpServerDefinition(cliPath, '1.1.0', extension.extensionPath);
		assert.strictEqual(definition.command, process.execPath);
		assert.deepStrictEqual(definition.args, [
			cliPath,
			'--eveapps',
			extension.extensionPath,
		]);
		assert.strictEqual(definition.env.ELECTRON_RUN_AS_NODE, '1');
		assert.strictEqual(
			definition.cwd?.fsPath.toLowerCase(),
			extension.extensionPath.toLowerCase(),
		);

		const { stdout } = await execFileAsync(definition.command, [...definition.args, '--help'], {
			env: {
				...process.env,
				ELECTRON_RUN_AS_NODE: String(definition.env.ELECTRON_RUN_AS_NODE),
			},
			timeout: 8_000,
			windowsHide: true,
		});

		assert.match(stdout, /Usage: node server\.js/);
		assert.match(stdout, /--eveapps <path>/);
	});
});
