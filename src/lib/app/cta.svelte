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
		<div class="col-span-10 space-y-4 border-y px-4 py-16 text-center sm:px-8">
			<h1 class="text-xl leading-tight font-semibold tracking-tighter sm:text-2xl md:text-3xl">
				Upgrade your AI-powered streaming
			</h1>
			<p class="mx-auto max-w-2xl text-balance text-muted-foreground sm:text-lg md:text-xl">
				Try Streamdown today and take your AI-powered streaming to the next level.
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
