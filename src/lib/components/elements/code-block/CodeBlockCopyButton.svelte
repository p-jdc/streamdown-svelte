<script lang="ts">
	import { getContext } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { Button, type ButtonProps } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	interface Props extends ButtonProps {
		onCopy?: () => void;
		onError?: (error: Error) => void;
		timeout?: number;
	}

	let { onCopy, onError, timeout = 2000, children, class: className, ...props }: Props = $props();

	// Get the code from context
	const codeContextKey = 'code-context';
	const codeContext = getContext<{ code: string }>(codeContextKey);

	if (!codeContext) {
		throw new Error('CodeBlockCopyButton must be used within a CodeBlock component');
	}

	// State for copy button
	let isCopied = $state(false);

	async function copyToClipboard() {
		if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
			onError?.(new Error('Clipboard API not available'));
			return;
		}

		try {
			await navigator.clipboard.writeText(codeContext.code);
			isCopied = true;
			onCopy?.();

			// Reset after timeout
			setTimeout(() => {
				isCopied = false;
			}, timeout);
		} catch (error) {
			onError?.(error as Error);
		}
	}
</script>

<Button
	{...props}
	class={cn('shrink-0', className)}
	onclick={copyToClipboard}
	size="icon"
	variant="ghost"
>
	{#if children}
		{@render children()}
	{:else if isCopied}
		<CheckIcon size={14} />
	{:else}
		<CopyIcon size={14} />
	{/if}
</Button>
