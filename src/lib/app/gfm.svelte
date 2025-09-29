<script lang="ts">
	import Section from './section.svelte';

	let { isOriginal = true }: { isOriginal?: boolean } = $props();

	const markdown = `# GitHub Flavored Markdown Features

GFM extends standard Markdown with powerful features. Here's a comprehensive demo:

## Tables

| Feature | Standard MD | GFM |
|---------|------------|-----|
| Tables | ❌ | ✅ |
| Task Lists | ❌ | ✅ |
| Strikethrough | ❌ | ✅ |

## Task Lists

- [x] Implement authentication
- [x] Add database models
- [ ] Write unit tests
- [ ] Deploy to production

## Strikethrough

~~Old approach~~ → New approach with AI models
`;
</script>

<Section {markdown} title="GitHub Flavored Markdown" {isOriginal}>
	Streamdown supports GitHub Flavored Markdown (GFM) out of the box, so you get things like task
	lists, tables, and more.
</Section>
