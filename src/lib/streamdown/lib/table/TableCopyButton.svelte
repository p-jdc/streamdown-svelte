<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { cn } from '../utils';
	import { extractTableDataFromElement, tableDataToCSV, tableDataToMarkdown } from './table-utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		class?: string;
		onCopy?: () => void;
		onError?: (error: Error) => void;
		timeout?: number;
		format?: 'csv' | 'markdown';
	};

	let {
		children,
		class: className,
		onCopy,
		onError,
		timeout = 2000,
		format = 'markdown',
		...props
	}: Props = $props();

	let isCopied = $state(false);
	let timeoutId: number | undefined;

	async function copyTableData(event: MouseEvent) {
		if (typeof window === 'undefined' || !navigator?.clipboard?.write) {
			onError?.(new Error('Clipboard API not available'));
			return;
		}

		try {
			if (!isCopied) {
				// Find the closest table element
				const button = event.currentTarget as HTMLButtonElement;
				const tableWrapper = button.closest('[data-streamdown="table-wrapper"]');
				const tableElement = tableWrapper?.querySelector('table') as HTMLTableElement;

				if (!tableElement) {
					onError?.(new Error('Table not found'));
					return;
				}

				const tableData = extractTableDataFromElement(tableElement);
				const clipboardItemData = new ClipboardItem({
					'text/plain':
						format === 'markdown' ? tableDataToMarkdown(tableData) : tableDataToCSV(tableData),
					'text/html': new Blob([tableElement.outerHTML], {
						type: 'text/html'
					})
				});

				await navigator.clipboard.write([clipboardItemData]);
				isCopied = true;
				onCopy?.();
				timeoutId = window.setTimeout(() => (isCopied = false), timeout);
			}
		} catch (error) {
			onError?.(error as Error);
		}
	}

	// Cleanup timeout on component destruction
	$effect(() => {
		return () => {
			if (timeoutId) {
				window.clearTimeout(timeoutId);
			}
		};
	});
</script>

<button
	class={cn(
		'cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground',
		className
	)}
	onclick={copyTableData}
	title={`Copy table as ${format}`}
	type="button"
	{...props}
>
	{#if children}
		{@render children()}
	{:else if isCopied}
		<CheckIcon size={14} />
	{:else}
		<CopyIcon size={14} />
	{/if}
</button>
