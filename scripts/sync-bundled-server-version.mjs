import fs from 'node:fs';
import path from 'node:path';

const serverRoot = path.join(
	process.cwd(),
	'node_modules',
	'@bridgetek',
	'eveapps-pre82x-mcp-server',
);
const packageJsonPath = path.join(serverRoot, 'package.json');
const serverPath = path.join(serverRoot, 'dist', 'server.js');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (typeof packageJson.version !== 'string' || packageJson.version.length === 0) {
	throw new Error(`Missing version in ${packageJsonPath}`);
}

const source = fs.readFileSync(serverPath, 'utf8');
const versionPattern = /(name:\s*["']EveApps-Pre82x["'],\s*\r?\n\s*version:\s*)["'][^"']+["']/;
if (!versionPattern.test(source)) {
	throw new Error(`Unable to locate the MCP server version in ${serverPath}`);
}

const updatedSource = source.replace(versionPattern, `$1"${packageJson.version}"`);
if (updatedSource !== source) {
	fs.writeFileSync(serverPath, updatedSource);
	console.log(`Synchronized bundled MCP server version to ${packageJson.version}`);
}
