import {
    rmSync,
    existsSync,
    readdirSync,
    statSync
} from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function removeTsBuildInfo(dir) {
    if (!existsSync(dir)) return;

    for (const entry of readdirSync(dir)) {
        const fullPath = path.join(dir, entry);

        if (statSync(fullPath).isDirectory()) {
            removeTsBuildInfo(fullPath);
        } else if (entry.endsWith(".tsbuildinfo")) {
            console.log(`Removing ${fullPath}`);
            rmSync(fullPath, { force: true });
        }
    }
}

// Remove root dist
rmSync(path.join(__dirname, "../dist"), {
    recursive: true,
    force: true
});

// Remove package dist folders
const packagesDir = path.join(__dirname, "../packages");

if (existsSync(packagesDir)) {
    for (const pkg of readdirSync(packagesDir)) {
        rmSync(path.join(packagesDir, pkg, "dist"), {
            recursive: true,
            force: true
        });
    }

    // Remove all *.tsbuildinfo files
    removeTsBuildInfo(packagesDir);
}

// Remove root tsbuildinfo (if any)
removeTsBuildInfo(path.join(__dirname, ".."));

console.log("Clean completed.");