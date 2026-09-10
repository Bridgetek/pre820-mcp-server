export function normalizeText(input: string): string {
    return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokenize(input: string): string[] {
    return normalizeText(input)
        .split(/[^a-z0-9_+.-]+/i)
        .map((s) => s.trim())
        .filter(Boolean);
}

export function includesSearchPhrase(input: string, phrase: string): boolean {
    const normalizePhrase = (value: string) => normalizeText(value)
        .replace(/[_-]+/g, " ")
        .replace(/[^a-z0-9+.\s]+/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    const normalizedInput = normalizePhrase(input);
    const normalizedPhrase = normalizePhrase(phrase);
    return normalizedPhrase.length > 0 &&
        ` ${normalizedInput} `.includes(` ${normalizedPhrase} `);
}
