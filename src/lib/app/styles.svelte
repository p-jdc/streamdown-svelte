<script lang="ts">
	import Section from './section.svelte';

	let { isOriginal = true }: { isOriginal?: boolean } = $props();

	const markdown = `# AI Models Overview

Modern AI models have revolutionized how we interact with technology. From **language models** to _computer vision_, these systems demonstrate remarkable capabilities.

## Key Features

### Benefits
- Natural language understanding
- Multi-modal processing
- Real-time inference

### Requirements
1. GPU acceleration
2. Model weights
3. API access

## Architecture

![Model Architecture](https://placehold.co/600x400)

## Insights

> "The development of full artificial intelligence could spell the end of the human race." — Stephen Hawking

Learn more about [AI safety](https://example.com) and \`transformer\` architectures.
`;
</script>

<Section {markdown} title="Built-in typography styles" {isOriginal}>
	Streamdown comes with built-in Tailwind classes for common Markdown components — headings, lists,
	code blocks, and more."
</Section>
