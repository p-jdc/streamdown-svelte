<script lang="ts">
	import { getAstNode } from 'svelte-exmarkdown';
	import { setContext } from 'svelte';
	import CodeBlock from './code/CodeBlock.svelte';
	import CodeBlockCopyButton from './code/CodeBlockCopyButton.svelte';
	import CodeBlockDownloadButton from './code/CodeBlockDownloadButton.svelte';
	import Mermaid from './Mermaid.svelte';
	import { cn } from '$lib/utils';
	import { bundledLanguages } from 'shiki';
	import type { BundledLanguage } from 'shiki';
	import { CODE_BLOCK_CONTEXT_KEY, type CodeBlockContextType } from './code/types';

	const astContext = getAstNode();

	// Extract both language and code content in a single pass
	const { language, code } = $derived.by(() => {
		const astNode = astContext.current as
			| {
					tagName?: string;
					children?: Array<{ tagName?: string; type?: string; value?: string }>;
					properties?: { class?: string };
			  }
			| null
			| undefined;

		if (astNode?.tagName !== 'pre' || !astNode.children?.length) {
			return { language: 'text', code: '' };
		}

		const codeElement = astNode.children.find(
			(child) => (child as { tagName?: string }).tagName === 'code'
		);
		if (!codeElement) {
			return { language: 'text', code: '' };
		}

		// Narrow the found element to a node shape we expect
		const codeElementNode = codeElement as {
			properties?: { class?: string };
			children?: Array<{ type?: string; value?: string }>;
		};

		// Extract language
		let extractedLanguage = 'text';
		if (codeElementNode.properties?.class && typeof codeElementNode.properties.class === 'string') {
			extractedLanguage = codeElementNode.properties.class.replace('language-', '') || 'text';
		}

		// Extract code content
		let extractedCode = '';
		if (codeElementNode.children) {
			for (const child of codeElementNode.children) {
				if (child.type === 'text' && child.value) {
					extractedCode += child.value;
				}
			}
		}

		return { language: extractedLanguage, code: extractedCode };
	});

	// Check if the language is a valid BundledLanguage
	const isValidBundledLanguage = $derived.by(() => {
		return language in bundledLanguages;
	});

	// Check if this is a Mermaid diagram
	const isMermaid = $derived.by(() => {
		return language === 'mermaid';
	});

	// Set up context for CodeBlockCopyButton
	const context: CodeBlockContextType = $state({ code: '' });
	setContext(CODE_BLOCK_CONTEXT_KEY, context);

	// Update context when code changes
	$effect(() => {
		context.code = code;
	});
</script>

{#if isMermaid}
	<div
		data-streamdown="mermaid-block"
		class={cn('group relative my-4 h-auto rounded-xl border p-4')}
	>
		<div class="flex items-center justify-end gap-2">
			<CodeBlockDownloadButton {code} language="mermaid" />
			<CodeBlockCopyButton />
		</div>
		<Mermaid chart={code} />
	</div>
{:else if isValidBundledLanguage}
	<CodeBlock
		data-streamdown="code-block"
		data-language={language}
		{code}
		language={language as BundledLanguage}
		preClass="overflow-x-auto font-mono text-xs p-4 bg-muted/40"
	>
		<CodeBlockDownloadButton language={language as BundledLanguage} />
		<CodeBlockCopyButton />
	</CodeBlock>
{:else}
	<pre
		data-streamdown="code-block"
		data-language={language}
		class={cn('my-4 h-auto overflow-x-auto rounded-xl border p-4')}><code>{code}</code></pre>
{/if}
