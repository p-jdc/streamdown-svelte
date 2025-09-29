<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { cn, save } from '../utils';
	import { extractTableDataFromElement, tableDataToCSV, tableDataToMarkdown } from './table-utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		class?: string;
		onDownload?: (format: 'csv' | 'markdown') => void;
		onError?: (error: Error) => void;
	};

	let { children, class: className, onDownload, onError, ...props }: Props = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	function downloadTableData(format: 'csv' | 'markdown') {
		try {
			const tableWrapper = dropdownRef.closest('[data-streamdown="table-wrapper"]');
			const tableElement = tableWrapper?.querySelector('table') as HTMLTableElement;

			if (!tableElement) {
				onError?.(new Error('Table not found'));
				return;
			}

			const tableData = extractTableDataFromElement(tableElement);
			const content = format === 'csv' ? tableDataToCSV(tableData) : tableDataToMarkdown(tableData);
			const extension = format === 'csv' ? 'csv' : 'md';
			const filename = `table.${extension}`;
			const mimeType = format === 'csv' ? 'text/csv' : 'text/markdown';

			save(filename, content, mimeType);
			isOpen = false;
			onDownload?.(format);
		} catch (error) {
			onError?.(error as Error);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<div class="relative" bind:this={dropdownRef} {...props}>
	<button
		class={cn(
			'cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground',
			className
		)}
		onclick={() => (isOpen = !isOpen)}
		title="Download table"
		type="button"
	>
		{#if children}
			{@render children()}
		{:else}
			<DownloadIcon size={14} />
		{/if}
	</button>

	{#if isOpen}
		<div
			class="absolute top-full right-0 z-10 mt-1 min-w-[120px] rounded-md border border-border bg-background shadow-lg"
		>
			<button
				class="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
				onclick={() => downloadTableData('csv')}
				type="button"
			>
				CSV
			</button>
			<button
				class="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
				onclick={() => downloadTableData('markdown')}
				type="button"
			>
				Markdown
			</button>
		</div>
	{/if}
</div>
