interface PromptGPT {
    promptGPT: string,
    model: string,
    key: string,
    retryCount: number,
    retryInterval: number,
    baseUrl?: string,
}

export { type PromptGPT };