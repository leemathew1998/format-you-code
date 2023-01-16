interface scriptType {
    import: Array<{ text: string; lineNumber: number }>;
    module: Array<{ text: string; lineNumber: number }>;
}

export interface scopeType {
    template: Array<{ text: string; lineNumber: number }>;
    script: scriptType;
    style: Array<Array<{ text: string; lineNumber: number }>>;
}