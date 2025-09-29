<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { cn, save } from '../utils';
	import { extractTableDataFromElement, tableDataToCSV, tableDataToMarkdown } from './table-utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		class?: string;
		onDownload?: () => void;
		onError?: (error: Error) => void;
		format?: 'csv' | 'markdown';
		filename?: string;
	};

	let {
		children,
		class: className,
		onDownload,
		onError,
		format = 'csv',
		filename,
		...props
	}: Props = $props();

	function handleDownload(event: MouseEvent) {
		try {
			// Find the closest table element
			const button = event.currentTarget as HTMLButtonElement;
			const tableWrapper = button.closest('[data-streamdown="table-wrapper"]');
			const tableElement = tableWrapper?.querySelector('table') as HTMLTableElement;

			if (!tableElement) {
				onError?.(new Error('Table not found'));
				return;
			}

			const tableData = extractTableDataFromElement(tableElement);
			let content = '';
			let mimeType = '';
			let extension = '';

			switch (format) {
				case 'csv':
					content = tableDataToCSV(tableData);
					mimeType = 'text/csv';
					extension = 'csv';
					break;
				case 'markdown':
					content = tableDataToMarkdown(tableData);
					mimeType = 'text/markdown';
					extension = 'md';
					break;
				default:
					content = tableDataToCSV(tableData);
					mimeType = 'text/csv';
					extension = 'csv';
			}

			save(`${filename || 'table'}.${extension}`, content, mimeType);
			onDownload?.();
		} catch (error) {
			onError?.(error as Error);
		}
	}
</script>

<button
	class={cn(
		'cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground',
		className
	)}
	onclick={handleDownload}
	title={`Download table as ${format.toUpperCase()}`}
	type="button"
	{...props}
>
	{#if children}
		{@render children()}
	{:else}
		<DownloadIcon size={14} />
	{/if}
</button>
