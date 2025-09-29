<script lang="ts">
	import Section from './section.svelte';

	let { isOriginal = true }: { isOriginal?: boolean } = $props();

	const markdown = `
Here are some links to potentially malicious sites (please don't actually click them):

- [Click here for a free iPhone](http://malicious-site.com)
- [Get rich quick!](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
- [Download suspicious file](http://dangerous-downloads.net)
- [Fake login page](http://fake-login.com)
`;
</script>

<Section
	{markdown}
	streamdownProps={{
		defaultOrigin: 'https://streamdown.vercel.app',
		allowedLinkPrefixes: ['https://streamdown.vercel.app']
	}}
	title="Built-in security hardening"
	{isOriginal}
>
	Streamdown ensures that untrusted markdown does not contain images from and links to unexpected
	origins which might have been
	<a
		class="font-medium text-blue-600 underline"
		href="https://vercel.com/blog/building-secure-ai-agents"
		rel="noreferrer"
		target="_blank"
	>
		subject to prompt injection
	</a>
	.
</Section>
