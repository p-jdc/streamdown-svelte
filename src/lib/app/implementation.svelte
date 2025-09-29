<script lang="ts">
	import { CodeBlock, CodeBlockCopyButton } from '$lib/components/elements/code-block';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';

	const elementsCode = `<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import { Response } from '$lib/components/ai-elements/response';

	let input = '';
	const chat = new Chat({});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		chat.sendMessage({ text: input });
		input = '';
	}
${'</scr' + 'ipt>'}

<main>
	<ul>
		{#each chat.messages as message, messageIndex (messageIndex)}
			<li>
				<div>{message.role}</div>
				<div>
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === 'text'}
							<Response content={part.text} />
						{/if}
					{/each}
				</div>
			</li>
		{/each}
	</ul>
	<form onsubmit={handleSubmit}>
		<input bind:value={input} />
		<button type="submit">Send</button>
	</form>
</main>
`;

	const streamdownCode = `<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import Streamdown from '$lib/streamdown/Streamdown.svelte';

	let input = '';
	const chat = new Chat({});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		chat.sendMessage({ text: input });
		input = '';
	}
${'</scr' + 'ipt>'}

<main>
	<ul>
		{#each chat.messages as message, messageIndex (messageIndex)}
			<li>
				<div>{message.role}</div>
				<div>
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === 'text'}
							<Streamdown content={part.text} />
						{/if}
					{/each}
				</div>
			</li>
		{/each}
	</ul>
	<form onsubmit={handleSubmit}>
		<input bind:value={input} />
		<button type="submit">Send</button>
	</form>
</main>
`;

	let tabValue = $state('elements');
</script>

<div class="divide-y sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
	<div class="space-y-2 px-4 pt-8 pb-16 sm:p-8!">
		<h2 class="text-2xl font-semibold tracking-tight">Overview</h2>
		<p class="text-muted-foreground">
			Formatting Markdown is easy, but when you tokenize and stream it, new challenges arise.
		</p>
		<p class="text-muted-foreground">
			So this is Streamdown-Svelte, a svelte version of the <a
				class="font-medium text-blue-600 underline"
				href="https://streamdown.ai/"
				rel="noopener noreferrer"
				target="_blank"
			>
				streamdown
			</a>
			library, designed for AI-powered streaming.
		</p>
	</div>
	<div class="relative bg-background sm:col-span-2">
		<Tabs value={tabValue} onValueChange={(v) => (tabValue = v)}>
			<div class="dark">
				<TabsList
					class="absolute top-0 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full"
				>
					<TabsTrigger class="rounded-full" value="elements">AI Elements</TabsTrigger>
					<TabsTrigger class="rounded-full" value="streamdown">Streamdown</TabsTrigger>
				</TabsList>
			</div>
			<TabsContent class="overflow-x-hidden" value="elements">
				<CodeBlock class="p-8" code={elementsCode} language="svelte">
					<CodeBlockCopyButton />
				</CodeBlock>
			</TabsContent>
			<TabsContent class="overflow-x-hidden" value="streamdown">
				<CodeBlock class="p-8" code={streamdownCode} language="svelte">
					<CodeBlockCopyButton />
				</CodeBlock>
			</TabsContent>
		</Tabs>
	</div>
</div>
