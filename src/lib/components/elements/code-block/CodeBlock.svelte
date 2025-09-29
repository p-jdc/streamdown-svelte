<script lang="ts">
	import { setContext } from 'svelte';
	import { highlightCode } from '../../../streamdown/lib/code/highlighter';
	import { cn } from '$lib/utils';
	import type { WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { BundledLanguage } from 'shiki';

	type Props = WithElementRef<
		HTMLAttributes<HTMLDivElement> & {
			code: string;
			language: BundledLanguage | string;
			showLineNumbers?: boolean;
		}
	>;

	let {
		code,
		language,
		showLineNumbers = false,
		class: className,
		children,
		ref = $bindable(null),
		...props
	}: Props = $props();

	//TODO fallback or loading for not supported languages

	// Context for providing code to child components
	const codeContextKey = 'code-context';
	setContext(codeContextKey, { code });

	// State for highlighted code (light and dark versions)
	let lightHighlightedCode = $state('');
	let darkHighlightedCode = $state('');
	let isLoading = $state(true);

	// Effect to highlight code when it changes
	$effect(() => {
		let cancelled = false;

		async function performHighlighting() {
			try {
				if (cancelled) return;

				// Use streamdown highlighter with both themes
				const [lightHighlighted, darkHighlighted] = await highlightCode(
					code,
					language as BundledLanguage,
					['github-light-default', 'github-dark-default']
				);

				if (cancelled) return;
				lightHighlightedCode = lightHighlighted;
				darkHighlightedCode = darkHighlighted;
				isLoading = false;
			} catch (error) {
				if (cancelled) return;
				console.error('Failed to highlight code:', error);
				const fallback = `<pre class="p-4 text-sm font-mono bg-transparent text-foreground"><code>${code}</code></pre>`;
				lightHighlightedCode = fallback;
				darkHighlightedCode = fallback;
				isLoading = false;
			}
		}

		performHighlighting();

		return () => {
			cancelled = true;
		};
	}); // CodeBlockCopyButton component context type
	export interface CodeContext {
		code: string;
	}

	// Export the context key for use by CodeBlockCopyButton
	export { codeContextKey };
</script>

<div
	bind:this={ref}
	class={cn(
		'relative w-full overflow-auto overflow-x-auto rounded-md border bg-background text-foreground',
		className
	)}
	{...props}
>
	<div class="relative">
		{#if isLoading}
			<div class="p-4 text-muted-foreground">Loading syntax highlighting...</div>
		{:else}
			<!-- Light theme version -->
			<div
				class={cn(
					'overflow-auto overflow-x-auto dark:hidden [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:whitespace-pre [&_pre]:text-foreground',
					showLineNumbers && 'line-numbers'
				)}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags (it is sanitized)-->
				{@html lightHighlightedCode}
			</div>
			<!-- Dark theme version -->
			<div
				class={cn(
					'hidden overflow-auto overflow-x-auto dark:block [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:whitespace-pre [&_pre]:text-foreground',
					showLineNumbers && 'line-numbers'
				)}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags (it is sanitized)-->
				{@html darkHighlightedCode}
			</div>
		{/if}
		<div class="absolute top-2 right-2 flex items-center gap-2">
			{@render children?.()}
		</div>
	</div>
</div>

<style>
	/* Code block line numbers using CSS counters */
	:global(.line-numbers code) {
		counter-reset: step;
		counter-increment: step 0;
	}

	:global(.line-numbers code .line)::before {
		content: counter(step);
		counter-increment: step;
		width: 1.75rem;
		margin-right: 0.75rem;
		display: inline-block;
		text-align: right;
		color: hsl(var(--muted-foreground));
		user-select: none;
		opacity: 0.6;
	}
</style>
