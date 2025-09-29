<script lang="ts">
	import { TableCopyButton, TableDownloadButton, TableDownloadDropdown } from '../lib/table';

	export let headers: string[] = [];
	export let rows: string[][] = [];
	export let includeCopy: boolean = true;
	export let includeDownload: boolean = false;
	export let includeDownloadDropdown: boolean = false;
	export let copyFormat: 'csv' | 'markdown' = 'markdown';
	export let downloadFormat: 'csv' | 'markdown' = 'csv';
	export let onCopy: (() => void) | undefined = undefined;
	export let onError: ((e: Error) => void) | undefined = undefined;
	export let onDownload: (() => void) | undefined = undefined;
	export let timeout: number | undefined = undefined;
	export let filename: string | undefined = undefined;
</script>

<div data-streamdown="table-wrapper" class="my-4 flex flex-col space-y-2">
	<div class="flex items-center justify-end gap-1">
		{#if includeCopy}
			<TableCopyButton format={copyFormat} {onCopy} {onError} {timeout} />
		{/if}
		{#if includeDownload}
			<TableDownloadButton format={downloadFormat} {onDownload} {onError} {filename} />
		{/if}
		{#if includeDownloadDropdown}
			<TableDownloadDropdown {onDownload} {onError} />
		{/if}
	</div>
	<div class="overflow-x-auto">
		<table
			data-streamdown="table"
			data-table-container
			class="w-full border-collapse border border-border"
		>
			{#if headers.length > 0}
				<thead data-streamdown="table-header" class="bg-muted/80">
					<tr data-streamdown="table-row" class="border-b border-border">
						{#each headers as header, index (index)}
							<th
								data-streamdown="table-header-cell"
								class="px-4 py-2 text-left text-sm font-medium"
							>
								{header}
							</th>
						{/each}
					</tr>
				</thead>
			{/if}
			{#if rows.length > 0}
				<tbody data-streamdown="table-body">
					{#each rows as row, index (index)}
						<tr data-streamdown="table-row" class="border-b border-border">
							{#each row as cell, cellIndex (cellIndex)}
								<td data-streamdown="table-cell" class="px-4 py-2 text-sm">
									{cell}
								</td>
							{/each}
							<!-- Fill empty cells if row has fewer columns than headers -->
							<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
							{#each Array(Math.max(0, headers.length - row.length)) as _, index (index)}
								<td data-streamdown="table-cell" class="px-4 py-2 text-sm"></td>
							{/each}
						</tr>
					{/each}
				</tbody>
			{/if}
		</table>
	</div>
</div>
