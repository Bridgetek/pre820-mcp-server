export interface CommandIndexItem {
    name: string;
    category: string;
    signature: string;
    summary: string;
    params?: Array<{
        name: string;
        type: string;
        desc: string;
    }>;
    related_samples?: string[];
    related_features?: string[];
    supportedWhen?: {
        family?: string[];
        platform?: string[];
    };
    requires?: string[];
    source_file: string;
}

export interface SampleIndexItem {
    id: string;
    name: string;
    path: string;
    categories: string[];
    summary: string;
    commands_used: string[];
    platform_notes?: string[];
    assets_required?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    keywords?: string[];
}

export type Command = {
    name: string;
    type: string;
    level: string;
    weight: number;
};

export interface FeatureGraphItem {
    commands: Command[];
    samples: string[];
    keywords: string[];
    registers: string[];
}

export interface BuildMatrix {
    version?: number;
    platforms: Record<
        string,
        {
            generator?: string;
            buildTool?: string;
            host?: string[];
            requires?: string[];
        }
    >;
    graphics?: string[];
    displays?: string[];
    defaults?: {
        platform?: string;
        graphics?: string;
        display?: string;
    };
    generators?: Record<string, { tool?: string }>;
}

export interface ModuleIndexItem {
    graphic: string;
    touch: string;
    supportedDisplays: string[];
    supportedPlatforms: string[];
}

export interface GraphicsIndexItem {
    family: string;
    feature: string[];
}
