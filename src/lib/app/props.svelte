<script lang="ts">
	const props = [
		{
			name: 'content',
			type: 'string',
			description: 'The markdown content to render. Should be a string of markdown.'
		},
		{
			name: 'parseIncompleteMarkdown',
			type: 'boolean',
			default: 'true',
			description:
				'Whether to parse and fix incomplete markdown syntax (e.g., unclosed code blocks or lists).'
		},
		{
			name: 'class',
			type: 'string',
			description: 'CSS class names to apply to the wrapper div element.'
		},
		{
			name: 'allowedImagePrefixes',
			type: 'string[]',
			default: '["*"]',
			description: 'Array of allowed URL prefixes for images. Use ["*"] to allow all images.'
		},
		{
			name: 'allowedLinkPrefixes',
			type: 'string[]',
			default: '["*"]',
			description: 'Array of allowed URL prefixes for links. Use ["*"] to allow all links.'
		},
		{
			name: 'defaultOrigin',
			type: 'string',
			description: 'Default origin to use for relative URLs in links and images.'
		}
	];
</script>

<div class="divide-y sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
	<div class="space-y-2 p-4 sm:p-8">
		<h2 class="text-2xl font-semibold tracking-tight">Props</h2>
		<p class="text-muted-foreground">
			StreamdownProps with component props and additional properties for streaming and security
			features.
		</p>
		<p class="text-muted-foreground">
			All props are optional and have sensible defaults for typical use cases.
		</p>
	</div>
	<div class="divide-y sm:col-span-2">
		{#each props as prop (prop.name)}
			<div class="space-y-2 p-4 sm:p-8">
				<div class="flex items-center gap-2">
					<code class="text-sm font-semibold tracking-tight text-primary">
						{prop.name}
					</code>
					<code class="text-xs text-muted-foreground">{prop.type}</code>
				</div>
				<p class="text-sm text-muted-foreground">{prop.description}</p>
				{#if prop.default}
					<p class="text-xs text-muted-foreground">
						Default: <code class="rounded bg-muted px-1">{prop.default}</code>
					</p>
				{/if}
			</div>
		{/each}
	</div>
</div>
