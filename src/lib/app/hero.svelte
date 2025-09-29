<script lang="ts">
	import { cn } from '$lib/utils';

	const COLUMNS = 12;
	const LAST_COLUMN = COLUMNS - 1;
</script>

<section>
	<div class="hidden grid-cols-12 divide-x sm:grid">
		{#each Array.from({ length: COLUMNS }, (_, i) => i) as index (index)}
			<div class={cn('aspect-square', index === LAST_COLUMN && 'border-r-0')}></div>
		{/each}
	</div>
	<div class="sm:grid sm:grid-cols-12 sm:divide-x">
		<div></div>
		<div class="col-span-10 space-y-4 px-4 py-16 text-center sm:border-y sm:px-8">
			<h1
				class="text-4xl leading-tight font-semibold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
			>
				Svelte-Streamdown
			</h1>
			<p class="mx-auto max-w-2xl text-lg text-balance text-muted-foreground md:text-2xl">
				A svelte version of the <a
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
		<div class="border-r-0"></div>
	</div>
	<div class="hidden grid-cols-12 divide-x sm:grid">
		{#each Array.from({ length: COLUMNS }, (_, i) => i) as index (index)}
			<div class={cn('aspect-square', index === LAST_COLUMN && 'border-l-0')}></div>
		{/each}
	</div>
</section>
