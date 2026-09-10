import path from "path";

export interface WorkspaceContext {
    workspaceRoot: string;
}

export function resolveDataPath(
    context: WorkspaceContext,
    file: string
) {
    return path.join(context.workspaceRoot, "data", file);
}