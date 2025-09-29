import type { MermaidConfig } from 'mermaid';

// Context key for MermaidConfig
export const MERMAID_CONFIG_CONTEXT_KEY = Symbol('mermaidConfig');

// Type for the context value
export type MermaidConfigContext = MermaidConfig | undefined;
