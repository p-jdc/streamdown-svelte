<!-- CodeBlock.svelte - Modern Svelte 5 version -->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { BundledLanguage } from 'shiki';
	import { cn } from '../utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SHIKI_THEME_CONTEXT_KEY, type ShikiThemeContextType } from './types';
	import { highlightCode } from './highlighter';

	interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
		code: string;
		language: BundledLanguage;
		preClass?: string;
	}

	// Props for the main CodeBlock component
	let {
		code,
		language,
		preClass,
		class: className = '',
		children,
		...restProps
	}: CodeBlockProps = $props();

	// Get theme context
	const themeContext = getContext<ShikiThemeContextType>(SHIKI_THEME_CONTEXT_KEY);

	if (!themeContext) {
		throw new Error('CodeBlock must be used within a Streamdown component');
	}

	// Reactive state for highlighted HTML
	let lightHtml = $state<string>('');
	let darkHtml = $state<string>('');

	// Handle syntax highlighting
	$effect(() => {
		let isMounted = true;

		highlightCode(code, language, [themeContext.lightTheme, themeContext.darkTheme], preClass).then(
			([light, dark]) => {
				if (isMounted) {
					lightHtml = light;
					darkHtml = dark;
				}
			}
		);

		return () => {
			isMounted = false;
		};
	});
</script>

<div
	class="my-4 w-full overflow-hidden rounded-xl border"
	data-code-block-container
	data-language={language}
	{...restProps}
>
	<div
		class="flex items-center justify-between bg-muted/80 p-3 text-xs text-muted-foreground"
		data-code-block-header
		data-language={language}
	>
		<span class="ml-1 font-mono lowercase">{language}</span>
		<div class="flex items-center gap-2">{@render children?.()}</div>
	</div>
	<div class="w-full">
		<div class="min-w-full">
			<!-- Light theme version -->
			<div
				class={cn('overflow-x-auto dark:hidden', className)}
				data-code-block
				data-language={language}
				{...restProps}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags (it is sanitized)-->
				{@html lightHtml}
			</div>
			<!-- Dark theme version -->
			<div
				class={cn('hidden overflow-x-auto dark:block', className)}
				data-code-block
				data-language={language}
				{...restProps}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags (it is sanitized)-->
				{@html darkHtml}
			</div>
		</div>
	</div>
</div>
