export type RetrievalSource = "core" | "eveapps" | "both";

export interface RouteDecision {
    source: RetrievalSource;
    confidence: number;
    reason: string;
}

export interface RetrievalResult {
    answer: any;
    confidence: number;
    source: RetrievalSource;
    references?: string[];
    metadata?: Record<string, unknown>;
}