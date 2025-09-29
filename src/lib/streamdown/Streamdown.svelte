<script lang="ts">
	import Markdown from 'svelte-exmarkdown';
	import type { Plugin } from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import rehypeKatex from 'rehype-katex';
	import remarkMath from 'remark-math';
	import 'katex/dist/katex.min.css';
	import { setContext } from 'svelte';
	import type { BundledTheme } from 'shiki';
	import AstPre from './lib/AstPre.svelte';
	import { createHardenedUrlTransformer, validateMarkdownOptions } from './lib/harden-markdown';
	import { parseMarkdownIntoBlocks } from './lib/parse-blocks';
	import { parseIncompleteMarkdown } from './lib/parse-incomplete-markdown';
	import { cn } from './lib/utils';
	import { SHIKI_THEME_CONTEXT_KEY, type ShikiThemeContextType } from './lib/code/types';
	import { TableCopyButton, TableDownloadDropdown } from './lib/table';
	import { MERMAID_CONFIG_CONTEXT_KEY } from './lib/mermaid-context';
	import type { StreamdownProps } from '.';

	const mathPlugins: Plugin[] = [{ remarkPlugin: [remarkMath], rehypePlugin: [rehypeKatex] }];

	let {
		content = '',
		allowedImagePrefixes = ['*'],
		allowedLinkPrefixes = ['*'],
		defaultOrigin,
		parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
		plugins = [],
		shikiTheme = ['github-light' as BundledTheme, 'github-dark' as BundledTheme],
		mermaidConfig,
		class: className,
		...props
	}: StreamdownProps = $props();

	// Set up theme context for CodeBlock components
	const themeContext: ShikiThemeContextType = {
		lightTheme: shikiTheme[0],
		darkTheme: shikiTheme[1]
	};
	setContext(SHIKI_THEME_CONTEXT_KEY, themeContext);

	// Set up mermaidConfig context for Mermaid components
	setContext(MERMAID_CONFIG_CONTEXT_KEY, mermaidConfig);

	// Update context when themes change
	$effect(() => {
		themeContext.lightTheme = shikiTheme[0];
		themeContext.darkTheme = shikiTheme[1];
	});

	const linkTransformer = $derived.by(() => {
		const opts = validateMarkdownOptions({
			defaultOrigin,
			allowedLinkPrefixes,
			allowedImagePrefixes
		});
		return createHardenedUrlTransformer(opts.allowedLinkPrefixes, opts.defaultOrigin);
	});

	const imageTransformer = $derived.by(() => {
		const opts = validateMarkdownOptions({
			defaultOrigin,
			allowedLinkPrefixes,
			allowedImagePrefixes
		});
		return createHardenedUrlTransformer(opts.allowedImagePrefixes, opts.defaultOrigin);
	});

	// Parse markdown into blocks
	const blocks = $derived(() => {
		// Safely convert content to string, handling various input types
		const safeContent = typeof content === 'string' ? content : String(content ?? '');
		return parseMarkdownIntoBlocks(safeContent);
	});

	// Create plugin for AST-based pre element handling
	const astPlugin: Plugin = {
		renderer: {
			pre: AstPre
		}
	};

	// Create stable GFM plugin instance
	const gfmPluginInstance = gfmPlugin();

	// Create plugins array with GFM support
	const allPlugins = $derived(() => [gfmPluginInstance, astPlugin, ...mathPlugins, ...plugins]);
</script>

<div class={cn('space-y-4', className)} {...props}>
	{#each blocks() as block, index (index)}
		{@const parsedContent = shouldParseIncompleteMarkdown
			? parseIncompleteMarkdown(typeof block === 'string' ? block.trim() : '')
			: typeof block === 'string'
				? block
				: ''}

		<Markdown md={parsedContent} plugins={allPlugins()}>
			{#snippet a(props)}
				{@const { href, children, class: className, ...rest } = props}
				{@const transformedUrl = linkTransformer(href)}
				{@const isIncomplete = href === 'streamdown:incomplete-link'}

				{#if transformedUrl !== null}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						data-streamdown="link"
						data-incomplete={isIncomplete}
						class={cn('font-medium text-primary underline', className)}
						href={transformedUrl}
						target="_blank"
						rel="noopener noreferrer"
						data-sveltekit-reload
						{...rest}
					>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{@render children?.()}
					</a>
				{:else}
					<span data-streamdown="link" class="text-gray-500" title={`Blocked URL: ${href}`}>
						{@render children?.()} [blocked]
					</span>
				{/if}
			{/snippet}

			{#snippet img(props)}
				{@const { src, alt, class: className, ...rest } = props}
				{@const transformedUrl = imageTransformer(src)}

				{#if transformedUrl !== null}
					<img data-streamdown="image" src={transformedUrl} {alt} class={className} {...rest} />
				{:else}
					<span
						data-streamdown="image"
						class="inline-block rounded bg-gray-200 px-3 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400"
					>
						[Image blocked: {alt || 'No description'}]
					</span>
				{/if}
			{/snippet}

			<!-- Basic styling snippets -->
			{#snippet ol(props)}
				{@const { children, class: className, ...rest } = props}
				<ol
					data-streamdown="ordered-list"
					{...rest}
					class={cn('ml-4 list-outside list-decimal whitespace-normal', className)}
				>
					{@render children?.()}
				</ol>
			{/snippet}
			{#snippet ul(props)}
				{@const { children, class: className, ...rest } = props}
				<ul
					data-streamdown="unordered-list"
					{...rest}
					class={cn('ml-4 list-outside list-disc whitespace-normal', className)}
				>
					{@render children?.()}
				</ul>
			{/snippet}
			{#snippet li(props)}
				{@const { children, class: className, ...rest } = props}
				<li data-streamdown="list-item" {...rest} class={cn('py-1', className)}>
					{@render children?.()}
				</li>
			{/snippet}
			{#snippet hr(props)}
				{@const { class: className, ...rest } = props}
				<hr
					data-streamdown="horizontal-rule"
					{...rest}
					class={cn('my-6 border-border', className)}
				/>
			{/snippet}
			{#snippet strong(props)}
				{@const { children, class: className, ...rest } = props}
				<span data-streamdown="strong" {...rest} class={cn('font-semibold', className)}>
					{@render children?.()}
				</span>
			{/snippet}
			{#snippet h1(props)}
				{@const { children, class: className, ...rest } = props}
				<h1
					data-streamdown="heading-1"
					{...rest}
					class={cn('mt-6 mb-2 text-3xl font-semibold', className)}
				>
					{@render children?.()}
				</h1>
			{/snippet}
			{#snippet h2(props)}
				{@const { children, class: className, ...rest } = props}
				<h2
					data-streamdown="heading-2"
					{...rest}
					class={cn('mt-6 mb-2 text-2xl font-semibold', className)}
				>
					{@render children?.()}
				</h2>
			{/snippet}
			{#snippet h3(props)}
				{@const { children, class: className, ...rest } = props}
				<h3
					data-streamdown="heading-3"
					{...rest}
					class={cn('mt-6 mb-2 text-xl font-semibold', className)}
				>
					{@render children?.()}
				</h3>
			{/snippet}
			{#snippet h4(props)}
				{@const { children, class: className, ...rest } = props}
				<h4
					data-streamdown="heading-4"
					{...rest}
					class={cn('mt-6 mb-2 text-lg font-semibold', className)}
				>
					{@render children?.()}
				</h4>
			{/snippet}
			{#snippet h5(props)}
				{@const { children, class: className, ...rest } = props}
				<h5
					data-streamdown="heading-5"
					{...rest}
					class={cn('mt-6 mb-2 text-base font-semibold', className)}
				>
					{@render children?.()}
				</h5>
			{/snippet}
			{#snippet h6(props)}
				{@const { children, class: className, ...rest } = props}
				<h6
					data-streamdown="heading-6"
					{...rest}
					class={cn('mt-6 mb-2 text-sm font-semibold', className)}
				>
					{@render children?.()}
				</h6>
			{/snippet}
			{#snippet table(props)}
				{@const { children, class: className, ...rest } = props}
				<div data-streamdown="table-wrapper" class="my-4 flex flex-col space-y-2">
					<div class="flex items-center justify-end gap-1">
						<TableCopyButton />
						<TableDownloadDropdown />
					</div>
					<div class="overflow-x-auto">
						<table
							data-streamdown="table"
							{...rest}
							class={cn('w-full border-collapse border border-border', className)}
						>
							{@render children?.()}
						</table>
					</div>
				</div>
			{/snippet}
			{#snippet thead(props)}
				{@const { children, class: className, ...rest } = props}
				<thead data-streamdown="table-header" {...rest} class={cn('bg-muted/80', className)}>
					{@render children?.()}
				</thead>
			{/snippet}
			{#snippet tbody(props)}
				{@const { children, class: className, ...rest } = props}
				<tbody
					data-streamdown="table-body"
					{...rest}
					class={cn('divide-y divide-border bg-muted/40', className)}
				>
					{@render children?.()}
				</tbody>
			{/snippet}
			{#snippet tr(props)}
				{@const { children, class: className, ...rest } = props}
				<tr data-streamdown="table-row" {...rest} class={cn('border-b border-border', className)}>
					{@render children?.()}
				</tr>
			{/snippet}
			{#snippet th(props)}
				{@const { children, class: className, ...rest } = props}
				<th
					data-streamdown="table-header-cell"
					{...rest}
					class={cn('px-4 py-2 text-left text-sm font-semibold whitespace-nowrap', className)}
				>
					{@render children?.()}
				</th>
			{/snippet}
			{#snippet td(props)}
				{@const { children, class: className, ...rest } = props}
				<td data-streamdown="table-cell" {...rest} class={cn('px-4 py-2 text-sm', className)}>
					{@render children?.()}
				</td>
			{/snippet}
			{#snippet blockquote(props)}
				{@const { children, class: className, ...rest } = props}
				<blockquote
					data-streamdown="blockquote"
					{...rest}
					class={cn(
						'my-4 border-l-4 border-muted-foreground/30 pl-4 text-muted-foreground italic',
						className
					)}
				>
					{@render children?.()}
				</blockquote>
			{/snippet}
			{#snippet code(props)}
				{@const { children, class: className, ...rest } = props}
				<span
					data-streamdown="inline-code"
					class={cn('rounded bg-muted px-1.5 py-0.5 font-mono text-sm', className)}
					{...rest}
				>
					{@render children?.()}
				</span>
			{/snippet}
			<!-- PRE as AstPre.svelte -->
			{#snippet sup(props)}
				{@const { children, class: className, ...rest } = props}
				<sup data-streamdown="superscript" class={cn('text-sm', className)} {...rest}>
					{@render children?.()}
				</sup>
			{/snippet}
			{#snippet sub(props)}
				{@const { children, class: className, ...rest } = props}
				<sub data-streamdown="subscript" class={cn('text-sm', className)} {...rest}>
					{@render children?.()}
				</sub>
			{/snippet}
		</Markdown>
	{/each}
</div>
