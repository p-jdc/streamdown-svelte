<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { getContext } from 'svelte';
	import { MermaidClass } from './mermaidClass.svelte';
	import { MERMAID_CONFIG_CONTEXT_KEY, type MermaidConfigContext } from './mermaid-context';
	import { mode } from 'mode-watcher';

	type Props = {
		chart: string;
		className?: string;
	};

	let { chart, className }: Props = $props();

	// Get mermaidConfig from context
	const mermaidConfig = getContext<MermaidConfigContext>(MERMAID_CONFIG_CONTEXT_KEY);

	// Create the reactive mermaid instance
	let mermaidInstance = new MermaidClass(chart, mermaidConfig);

	// Track current mode reactively
	const isDarkMode = $derived(mode.current === 'dark');

	// Update the instance when chart prop changes
	$effect(() => {
		mermaidInstance.chart = chart;
	});

	// Update theme when mode changes (this also handles initial setup)
	$effect(() => {
		mermaidInstance.setThemeMode(isDarkMode);
	});
</script>

<!-- Show loading only on initial load when we have no content -->
{#if mermaidInstance.isLoading && mermaidInstance.hasNoValidSvg}
	<div data-streamdown="mermaid-block" class={cn('my-4 flex justify-center p-4', className)}>
		<div class="flex items-center space-x-2 text-muted-foreground">
			<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
			<span class="text-sm">Loading diagram...</span>
		</div>
	</div>
{:else if mermaidInstance.error && mermaidInstance.hasNoValidSvg}
	<!-- Only show error if we have no valid SVG to display -->
	<div
		data-streamdown="mermaid-block"
		class={cn('rounded-lg border border-red-200 bg-red-50 p-4', className)}
	>
		<p class="font-mono text-sm text-red-700">Mermaid Error: {mermaidInstance.error}</p>
		<details class="mt-2">
			<summary class="cursor-pointer text-xs text-red-600">Show Code</summary>
			<pre class="mt-2 overflow-x-auto rounded bg-red-100 p-2 text-xs text-red-800">{chart}</pre>
		</details>
	</div>
{:else if mermaidInstance.hasContent}
	<!-- Single SVG that updates based on current theme -->
	<div
		aria-label="Mermaid chart"
		data-streamdown="mermaid-block"
		class={cn('my-4 flex justify-center', className)}
		role="img"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html mermaidInstance.displaySvg}
	</div>
{/if}
