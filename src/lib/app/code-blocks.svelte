<script lang="ts">
	import Section from './section.svelte';

	let { isOriginal = true }: { isOriginal?: boolean } = $props();

	const markdown = `
\`\`\`ts
const copyToClipboard = async () => {
		if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
			onError?.(new Error('Clipboard API not available'));
			return;
		}

		try {
			await navigator.clipboard.writeText(context.code);
			isCopied = true;
			onCopy?.();
			setTimeout(() => {
				isCopied = false;
			}, timeout);
		} catch (error) {
			onError?.(error as Error);
		}
	};
\`\`\`
`;
</script>

<Section {markdown} title="Beautiful, interactive code blocks" {isOriginal}>
	Streamdown uses
	<a class="underline" href="https://shiki.style/" rel="noreferrer" target="_blank"> Shiki </a>
	to highlight code blocks, and comes with a copy button so you can easily copy the code.
	<span class="font-medium text-blue-600"> Hover to reveal the copy button! </span>
</Section>
