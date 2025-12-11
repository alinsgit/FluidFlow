/// <reference types="vite/client" />

// Raw file imports (for prompt templates)
declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '*.txt?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly API_KEY: string;
  readonly GEMINI_API_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly ANTHROPIC_API_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
