import { execSync } from "child_process";

function run(cmd) {
    console.log(`\n> ${cmd}\n`);
    execSync(cmd, {
        stdio: "inherit"
    });
}

run("npm run clean");
run("npm run build");
//run('npm version patch -m "release: %s"');
//run("git push");
//run("git push --tags");
run("npm publish -w @bridgetek/eveapps-pre82x-mcp-server --access public");

console.log("\nRelease complete.");