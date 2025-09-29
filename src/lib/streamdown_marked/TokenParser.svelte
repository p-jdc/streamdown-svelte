<script lang="ts">
	import type { Token, Tokens } from 'marked';
	import CodeBlock from './lib/code/CodeBlock.svelte';
	import CodeBlockCopyButton from './lib/code/CodeBlockCopyButton.svelte';
	import CodeBlockDownloadButton from './lib/code/CodeBlockDownloadButton.svelte';
	import Mermaid from './lib/Mermaid.svelte';
	import { TableCopyButton, TableDownloadDropdown } from './lib/table';
	import { bundledLanguages, type BundledLanguage } from 'shiki';
	import { getContext } from 'svelte';
	import { SHIKI_THEME_CONTEXT_KEY, type ShikiThemeContextType } from './lib/code/types';
	import { createHardenedUrlTransformer, validateMarkdownOptions } from './lib/harden-markdown';
	import katex from 'katex';
	import DOMPurify from 'isomorphic-dompurify';

	interface Props {
		token: Token;
		allowedLinkPrefixes?: string[];
		allowedImagePrefixes?: string[];
		defaultOrigin?: string;
	}

	let {
		token,
		allowedLinkPrefixes = ['*'],
		allowedImagePrefixes = ['*'],
		defaultOrigin = ''
	}: Props = $props();

	// Get the Shiki theme context from parent Streamdown component
	const themeContext = getContext<ShikiThemeContextType>(SHIKI_THEME_CONTEXT_KEY);

	// Most efficient: switch statement for many comparisons
	const isBlockLevel = $derived.by(() => {
		switch (token.type) {
			case 'space':
			case 'code':
			case 'blockquote':
			case 'html':
			case 'heading':
			case 'hr':
			case 'list':
			case 'listitem':
			case 'checkbox':
			case 'paragraph':
			case 'table':
			case 'tablerow':
			case 'tablecell':
			case 'blockKatex':
				return true;
			default:
				return false;
		}
	});

	const opts = $derived.by(() => {
		return validateMarkdownOptions({
			defaultOrigin,
			allowedLinkPrefixes,
			allowedImagePrefixes
		});
	});

	const linkTransformer = $derived.by(() => {
		return createHardenedUrlTransformer(opts.allowedLinkPrefixes, opts.defaultOrigin);
	});

	const imageTransformer = $derived.by(() => {
		return createHardenedUrlTransformer(opts.allowedImagePrefixes, opts.defaultOrigin);
	});
</script>

{#snippet inLine(tokens: Token[])}
	{#each tokens as t, i ('inline' + '-' + t.type + '-' + i)}
		{#if t.type === 'strong'}
			<span data-streamdown="strong" class="font-semibold">
				{t.text}
			</span>
		{:else if t.type === 'em'}
			<em data-streamdown="emphasis" class="italic">
				{t.text}
			</em>
		{:else if t.type === 'codespan'}
			<span data-streamdown="inline-code" class="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
				{t.text}
			</span>
		{:else if t.type === 'link'}
			{@const href = t.href}
			{@const transformedUrl = linkTransformer(href)}
			{@const isIncomplete = href === 'streamdown:incomplete-link'}

			{#if transformedUrl !== null}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					data-streamdown="link"
					data-incomplete={isIncomplete}
					class="font-medium text-primary underline"
					href={transformedUrl}
					target="_blank"
					rel="noopener noreferrer"
					data-sveltekit-reload
				>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{#if t.tokens}
						{@render inLine(t.tokens)}
					{:else}
						{t.text}
					{/if}
				</a>
			{:else}
				<span data-streamdown="link" class="text-gray-500" title={`Blocked URL: ${href}`}>
					{#if t.tokens}
						{@render inLine(t.tokens)} [blocked]
					{:else}
						{t.text} [blocked]
					{/if}
				</span>
			{/if}
		{:else if t.type === 'image'}
			{@const src = t.href}
			{@const alt = t.text || 'Image'}
			{@const transformedUrl = imageTransformer(src)}

			{#if transformedUrl !== null}
				<img data-streamdown="image" src={transformedUrl} {alt} />
			{:else}
				<span
					data-streamdown="image"
					class="inline-block rounded bg-gray-200 px-3 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400"
				>
					[Image blocked: {alt || 'No description'}]
				</span>
			{/if}
		{:else if t.type === 'del' && t.tokens}
			<span data-streamdown="strikethrough" class="line-through">{@render inLine(t.tokens)}</span>
		{:else if t.type === 'del'}
			<span data-streamdown="strikethrough" class="line-through">{t.text}</span>
		{:else if t.type === 'text' && t.tokens}
			{@render inLine(t.tokens)}
		{:else if t.type === 'text'}
			{t.text}
		{:else if t.type === 'inlineKatex'}
			{@const katexHTML = DOMPurify.sanitize(
				katex.renderToString(t.text || '', {
					throwOnError: false,
					displayMode: false
				})
			)}
			<!-- eslint-disable-next-line svelte/no-at-html-tags (it is sanitized)-->
			<span data-streamdown="inline-katex" class="inline align-middle">{@html katexHTML}</span>
		{:else if t.type === 'html'}
			{t.text} <!-- TODO consider handling sub and sup -->
		{:else}
			{JSON.stringify(t)}
		{/if}
	{/each}
{/snippet}

{#snippet listItem(item: Tokens.ListItem)}
	{@const isTask = item.task || false}
	{#if isTask}
		{@const checked = item.checked || false}
		{@const checkboxId = `task-item-${Math.random().toString(36).substr(2, 9)}`}
		{@const labelClass = item.checked ? 'flex-1 line-through text-muted-foreground' : 'flex-1'}
		<li data-streamdown="task-list-item" class="flex items-center gap-2 py-1">
			<input
				type="checkbox"
				id="${checkboxId}"
				{checked}
				disabled
				class="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
			/>
			<label for="${checkboxId}" class="${labelClass}">{@render inLine(item.tokens)}</label>
		</li>
	{:else}
		<li data-streamdown="list-item" class="py-1">
			{@render inLine(item.tokens)}
		</li>
	{/if}
{/snippet}

<!-- Render based on token type -->
{#if isBlockLevel}
	{@const tokenType = token.type}
	{#if tokenType === 'code'}
		{@const language = (token.lang || '').trim() || 'text'}
		{@const code = token.text}
		{@const isValidBundledLanguage = language in bundledLanguages}
		{#if language === 'mermaid'}
			<div data-streamdown="mermaid-block" class="group relative my-4 h-auto rounded-xl border p-4">
				<div class="flex items-center justify-end gap-2">
					<CodeBlockDownloadButton {code} language="mermaid" />
					<CodeBlockCopyButton {code} />
				</div>
				<Mermaid chart={code} />
			</div>
		{:else if isValidBundledLanguage && themeContext}
			<CodeBlock
				data-streamdown="code-block"
				data-language={language}
				{code}
				language={language as BundledLanguage}
				preClass="overflow-x-auto font-mono text-xs p-4 bg-muted/40"
			>
				<CodeBlockDownloadButton language={language as BundledLanguage} {code} />
				<CodeBlockCopyButton {code} />
			</CodeBlock>
		{:else}
			<pre
				data-streamdown="code-block"
				data-language={language}
				class="my-4 h-auto overflow-x-auto rounded-xl border p-4"><code>{code}</code></pre>
		{/if}
	{:else if tokenType === 'table'}
		{@const header = token.header || []}
		{@const rows = token.rows || []}

		<div data-streamdown="table-wrapper" class="my-4 flex flex-col space-y-2">
			<div class="flex items-center justify-end gap-1">
				<TableCopyButton />
				<TableDownloadDropdown />
			</div>
			<div class="overflow-x-auto">
				<table data-streamdown="table" class="w-full border-collapse border border-border">
					<thead data-streamdown="table-header" class="bg-muted/80">
						<tr data-streamdown="table-row" class="border-b border-border">
							{#each header as headerCell, i (headerCell.id ?? i)}
								{@const text = headerCell.text || ''}
								<th
									data-streamdown="table-header-cell"
									class="px-4 py-2 text-left text-sm font-semibold whitespace-nowrap"
								>
									{text}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody data-streamdown="table-body" class="divide-y divide-border bg-muted/40">
						{#each rows as row, i (row.id ?? i)}
							<tr data-streamdown="table-row" class="border-b border-border">
								{#each row as cell, j (cell.id ?? j)}
									{@const text = cell.text || ''}
									<td data-streamdown="table-cell" class="px-4 py-2 text-sm">
										{text}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else if tokenType === 'space'}
		<!-- Space token - usually whitespace -->
		<span class="whitespace-pre"> </span>
	{:else if tokenType === 'blockquote'}
		{@const quote = token.text || ''}
		<blockquote
			data-streamdown="blockquote"
			class="my-4 border-l-4 border-muted-foreground/30 pl-4 text-muted-foreground italic"
		>
			{quote}
		</blockquote>
	{:else if tokenType === 'html'}
		<!-- HTML token -->
	{:else if tokenType === 'heading'}
		{@const depth = token.depth}
		{@const text = token.text || ''}
		{#if depth === 1}
			<h1 data-streamdown="heading-1" class="mt-6 mb-2 text-3xl font-semibold">{text}</h1>
		{:else if depth === 2}
			<h2 data-streamdown="heading-2" class="mt-6 mb-2 text-2xl font-semibold">{text}</h2>
		{:else if depth === 3}
			<h3 data-streamdown="heading-3" class="mt-6 mb-2 text-xl font-semibold">{text}</h3>
		{:else if depth === 4}
			<h4 data-streamdown="heading-4" class="mt-6 mb-2 text-lg font-semibold">{text}</h4>
		{:else if depth === 5}
			<h5 data-streamdown="heading-5" class="mt-6 mb-2 text-base font-semibold">{text}</h5>
		{:else}
			<h6 data-streamdown="heading-6" class="mt-6 mb-2 text-sm font-semibold">{text}</h6>
		{/if}
	{:else if tokenType === 'hr'}
		<hr data-streamdown="horizontal-rule" class="my-6 border-border" />
	{:else if tokenType === 'list'}
		{@const isOrdered = token.ordered || false}
		{@const items = token.items || []}

		{#if isOrdered}
			<ol data-streamdown="ordered-list" class="ml-4 list-outside list-decimal whitespace-normal">
				{#each items as item, i (item.id ?? i)}
					{@render listItem(item)}
				{/each}
			</ol>
		{:else}
			<ul data-streamdown="unordered-list" class="ml-4 list-outside list-disc whitespace-normal">
				{#each items as item, i (item.id ?? i)}
					{@render listItem(item)}
				{/each}
			</ul>
		{/if}
	{:else if tokenType === 'blockKatex'}
		{@const katexHTML = DOMPurify.sanitize(
			katex.renderToString(token.text || '', {
				throwOnError: false,
				displayMode: true
			})
		)}
		<!-- eslint-disable-next-line svelte/no-at-html-tags (it is sanitized)-->
		{@html katexHTML}
	{:else if tokenType === 'paragraph'}
		{@const tokens = token.tokens || []}
		<p>{@render inLine(tokens)}</p>
	{/if}
{/if}
