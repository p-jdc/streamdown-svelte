<!-- CodeBlockCopyButton.svelte - Copy button for code blocks -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { cn } from '../utils';
	import type { HTMLAttributes } from 'svelte/elements';

	interface CodeBlockCopyButtonProps extends HTMLAttributes<HTMLButtonElement> {
		onCopy?: () => void;
		onError?: (error: Error) => void;
		timeout?: number;
		code: string; // Allow overriding the context code
	}

	let {
		onCopy,
		onError,
		timeout = 2000,
		code: propCode,
		children,
		class: className = '',
		...restProps
	}: CodeBlockCopyButtonProps = $props();

	// Use prop code if provided, otherwise fall back to context
	const codeToUse = $derived(propCode ?? '');

	// Reactive state for copy status
	let isCopied = $state(false);

	// Timeout id for clearing the "copied" state
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	// Copy function
	const copyToClipboard = async () => {
		if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
			onError?.(new Error('Clipboard API not available'));
			return;
		}

		try {
			if (!isCopied) {
				await navigator.clipboard.writeText(codeToUse);
				isCopied = true;
				onCopy?.();
				// clear any previous timeout
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				timeoutId = setTimeout(() => {
					isCopied = false;
					timeoutId = null;
				}, timeout);
			}
		} catch (error) {
			onError?.(error as Error);
		}
	};

	// Clean up timeout on destroy to avoid updating state after unmount
	onDestroy(() => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	});
</script>

<button
	class={cn(
		'cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground',
		className
	)}
	onclick={copyToClipboard}
	type="button"
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else if isCopied}
		<Check size={14} />
	{:else}
		<Copy size={14} />
	{/if}
</button>
