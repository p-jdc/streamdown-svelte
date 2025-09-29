<script lang="ts">
	import { setContext } from 'svelte';
	import CodeBlock from '../lib/code/CodeBlock.svelte';
	import CodeBlockCopyButton from '../lib/code/CodeBlockCopyButton.svelte';
	import CodeBlockDownloadButton from '../lib/code/CodeBlockDownloadButton.svelte';
	import { SHIKI_THEME_CONTEXT_KEY, type ShikiThemeContextType } from '../lib/code/types';
	import type { BundledLanguage } from 'shiki';

	export let code: string = '';
	export let language: BundledLanguage = 'javascript' as unknown as BundledLanguage;
	export let includeCopy: boolean = true;
	export let includeDownload: boolean = false;
	export let onCopy: (() => void) | undefined = undefined;
	export let onError: ((e: Error) => void) | undefined = undefined;
	export let timeout: number | undefined = undefined;

	// Set up theme context that CodeBlock expects
	const themeContext: ShikiThemeContextType = {
		lightTheme: 'github-light',
		darkTheme: 'github-dark'
	};
	setContext(SHIKI_THEME_CONTEXT_KEY, themeContext);
</script>

<CodeBlock {code} {language}>
	{#if includeCopy}
		<CodeBlockCopyButton {onCopy} {onError} {timeout} />
	{/if}
	{#if includeDownload}
		<CodeBlockDownloadButton />
	{/if}
</CodeBlock>
