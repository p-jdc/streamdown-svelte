<!-- CodeBlockDownloadButton.svelte - Download button for code blocks -->
<script lang="ts">
	import Download from '@lucide/svelte/icons/download';
	import { cn, save } from '../utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { BundledLanguage } from 'shiki';
	import { languageExtensionMap } from './highlighter';

	interface CodeBlockDownloadButtonProps extends HTMLAttributes<HTMLButtonElement> {
		onDownload?: () => void;
		onError?: (error: Error) => void;
		code: string; // Allow overriding the context code
		language?: BundledLanguage; // Allow overriding the language
	}

	let {
		onDownload,
		onError,
		code: propCode,
		language: propLanguage,
		children,
		class: className = '',
		...restProps
	}: CodeBlockDownloadButtonProps = $props();

	// Use prop code if provided, otherwise fall back to context
	const codeToUse = $derived(propCode ?? '');

	// Get file extension from language mapping
	const extension = $derived(() => {
		if (!propLanguage) {
			return 'txt';
		}
		return propLanguage && propLanguage in languageExtensionMap
			? languageExtensionMap[propLanguage]
			: 'txt';
	});

	// Generate meaningful filename based on language
	const filename = $derived(() => {
		const ext = extension();
		const baseName = propLanguage || 'code';
		return `${baseName}.${ext}`;
	});
	const mimeType = 'text/plain';

	// Download function
	const downloadCode = () => {
		try {
			save(filename(), codeToUse, mimeType);
			onDownload?.();
		} catch (error) {
			onError?.(error as Error);
		}
	};
</script>

<button
	class={cn(
		'cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground',
		className
	)}
	onclick={downloadCode}
	title="Download file"
	type="button"
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<Download size={14} />
	{/if}
</button>
