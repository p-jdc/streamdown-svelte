// Export the main Streamdown component and types
export { default as Streamdown } from './Streamdown.svelte';
export { default } from './Streamdown.svelte';

// Export table components
export * from './lib/table';

// Re-export highlightCode
export { highlightCode } from './lib/code/highlighter';

import type { Plugin } from 'svelte-exmarkdown';
import type { BundledTheme } from 'shiki';
import type { MermaidConfig } from 'mermaid';

export interface StreamdownProps {
	content?: string;
	defaultOrigin?: string;
	allowedLinkPrefixes?: string[];
	allowedImagePrefixes?: string[];
	parseIncompleteMarkdown?: boolean;
	class?: string;
	plugins?: Plugin[];
	shikiTheme?: [BundledTheme, BundledTheme];
	mermaidConfig?: MermaidConfig;
}
