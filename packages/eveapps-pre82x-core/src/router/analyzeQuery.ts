export interface QueryAnalysis {
    isBuild: boolean;
    isScreen: boolean;
    isSymbol: boolean;
    isSample: boolean;
    isDebug: boolean;
    isGeneric: boolean;
}

export function analyzeQuery(query: string): QueryAnalysis {
    const q = query.toLowerCase();

    return {
        isBuild: q.includes("build") || q.includes("cmake") || q.includes("compile"),
        isScreen: q.includes("screen") || q.includes("ui") || q.includes("widget"),
        isSymbol: q.includes("cmd") || q.includes("register") || q.includes("api"),
        isSample: q.includes("sample") || q.includes("example"),
        isDebug: q.includes("error") || q.includes("fail") || q.includes("issue"),
        isGeneric: true
    };
}