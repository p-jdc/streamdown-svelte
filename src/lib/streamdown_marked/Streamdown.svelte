<script lang="ts">
	import { parseMarkdownIntoTokens } from './lib/parse-blocks';
	import { cn } from './lib/utils';
	import type { StreamdownProps } from '.';
	import TokenParser from './TokenParser.svelte';
	import { setContext } from 'svelte';
	import type { BundledTheme } from 'shiki';
	import { SHIKI_THEME_CONTEXT_KEY, type ShikiThemeContextType } from './lib/code/types';
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';
	import { MERMAID_CONFIG_CONTEXT_KEY } from './lib/mermaid-context';
	import type { Token } from 'marked';

	let {
		content = '',
		parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
		shikiTheme = ['github-light' as BundledTheme, 'github-dark' as BundledTheme],
		allowedLinkPrefixes = ['*'],
		allowedImagePrefixes = ['*'],
		defaultOrigin = '',
		class: className,
		mermaidConfig,
		...props
	}: StreamdownProps & WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	// Set up theme context for CodeBlock components with derived updates
	const themeContext: ShikiThemeContextType = {
		get lightTheme() {
			return shikiTheme[0];
		},
		get darkTheme() {
			return shikiTheme[1];
		}
	};
	setContext(SHIKI_THEME_CONTEXT_KEY, themeContext);

	// Set up mermaidConfig context for Mermaid components
	setContext(MERMAID_CONFIG_CONTEXT_KEY, mermaidConfig);

	// Fast token key generation optimized for streaming performance
	function getTokenKey(token: Token, index: number): string {
		// For code blocks use completely stable key during streaming
		if (token.type === 'code') {
			const language = token.lang || 'text';
			// Only use type, language, and index - no content-based keys that change during streaming
			return `code_${language}_${index}`;
		}

		// For other tokens, use length in chunks of 50 to balance efficiency vs stability
		const text = token.raw || ('text' in token ? token.text : '');
		const lengthChunk = text.length > 0 ? Math.floor(text.length / 50) : 0;
		return `${token.type}_${lengthChunk}_${index}`;
	}

	// Parse markdown into individual tokens
	const tokens = $derived(() => {
		// Safely convert content to string, handling various input types
		const safeContent = typeof content === 'string' ? content : String(content ?? '');

		// Early return for empty content to avoid unnecessary parsing
		if (!safeContent.trim()) {
			return [];
		}

		return parseMarkdownIntoTokens(safeContent, shouldParseIncompleteMarkdown);
	});
</script>

<div class={cn('space-y-4', className)} {...props}>
	{#each tokens() as token, j (getTokenKey(token, j))}
		<TokenParser {token} {allowedLinkPrefixes} {allowedImagePrefixes} {defaultOrigin} />
	{/each}
</div>
