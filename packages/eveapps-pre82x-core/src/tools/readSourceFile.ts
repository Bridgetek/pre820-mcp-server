import fs from "fs";
import path from "path";
import { z } from "zod";

import type { WorkspaceContext } from "../context.js";

export const readSourceFileInput = z.object({
    relative_path: z
        .string()
        .trim()
        .min(1)
        .max(4096)
        .describe("Path to a source file under the local EveApps repo, for example: SampleApp/Widget/Src/Widget.c"),
});

export type ReadSourceFileInput = z.infer<typeof readSourceFileInput>;

export function readSourceFile(
    args: ReadSourceFileInput,
    context: WorkspaceContext
) {
    const repoRoot = path.resolve(context.eveappsRoot ?? process.cwd());
    const fullPath = path.resolve(repoRoot, args.relative_path);
    const lexicalRelativePath = path.relative(repoRoot, fullPath);

    if (
        lexicalRelativePath === ".." ||
        lexicalRelativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(lexicalRelativePath)
    ) {
        throw new Error("relative_path must stay inside the local EveApps repository root.");
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        throw new Error(`File not found: ${args.relative_path}`);
    }

    const realRepoRoot = fs.realpathSync(repoRoot);
    const realFullPath = fs.realpathSync(fullPath);
    const realRelativePath = path.relative(realRepoRoot, realFullPath);
    if (
        realRelativePath === ".." ||
        realRelativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(realRelativePath)
    ) {
        throw new Error("relative_path resolves outside the local EveApps repository root.");
    }

    const fileStat = fs.statSync(realFullPath);

    return {
        path: lexicalRelativePath.split(path.sep).join("/"),
        size_bytes: fileStat.size,
        content: fs.readFileSync(realFullPath, "utf-8"),
    };
}
