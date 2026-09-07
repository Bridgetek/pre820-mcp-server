import { execSync } from "child_process";

console.log("Building workspace (tsc -b)...");

execSync("npx tsc -b --force", {
    stdio: "inherit"
});

console.log("Build done");