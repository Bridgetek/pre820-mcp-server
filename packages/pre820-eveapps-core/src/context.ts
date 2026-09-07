import fs from "fs";
import path from "path";

export interface WorkspaceContext {
    eveappsRoot?: string;

    dataRoot: string;

    resolveDataPath(file: string): string;

    readJsonFile<T>(file: string): T;
}

export function createWorkspaceContext(eveappsRootOption?: string): WorkspaceContext {

    const givenRoot: string = (typeof eveappsRootOption === "string" && eveappsRootOption.length > 0)
        ? eveappsRootOption
        : process.cwd();

    const eveappsRoot = path.resolve(givenRoot);

    const dataRoot = path.join(eveappsRoot, "data");

    function resolveDataPath(file: string): string {
        const candidates = [
            path.join(eveappsRoot, "data", file),
            path.join(eveappsRoot, "dist", "data", file)
        ];

        for (const p of candidates) {
            if (fs.existsSync(p)) return p;
        }

        throw new Error(
            `Missing data file: ${file}\nChecked:\n${candidates.join("\n")}`
        );
    }

    function readJsonFile<T>(file: string): T {
        const fullPath = resolveDataPath(file);
        const content = fs.readFileSync(fullPath, "utf-8");
        return JSON.parse(content) as T;
    }

    return {
        eveappsRoot,
        dataRoot,
        resolveDataPath,
        readJsonFile,
    };
}