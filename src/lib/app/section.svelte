<script lang="ts">
	import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
	import { Streamdown as Streamdown_marked } from '$lib/streamdown_marked';
	import { Streamdown } from 'svelte-streamdown';
	import Markdown from 'svelte-exmarkdown';
	import { Button } from '$lib/components/ui/button';
	import { onDestroy } from 'svelte';
	import { IsInViewport } from 'runed';
	import type { Plugin } from 'svelte-exmarkdown';
	import type { Snippet } from 'svelte';

	const DEFAULT_SPEED = 100;

	interface StreamdownProps {
		defaultOrigin?: string;
		allowedLinkPrefixes?: string[];
		allowedImagePrefixes?: string[];
		parseIncompleteMarkdown?: boolean;
		class?: string;
		plugins?: Plugin[];
	}

	interface SectionProps {
		title: string;
		children?: Snippet;
		markdown: string;
		streamdownProps?: StreamdownProps;
		speed?: number;
		isOriginal?: boolean;
	}

	let {
		title,
		children,
		markdown,
		streamdownProps = {},
		speed = DEFAULT_SPEED,
		isOriginal = true
	}: SectionProps = $props();

	// State using Svelte 5 runes
	let content = $state('');
	let isAnimating = $state(false);
	let resetTrigger = $state(0);

	// Refs
	let sectionRef = $state<HTMLElement | null>(null);
	let intervalRef: NodeJS.Timeout | null = null;

	// Use runed's IsInViewport utility
	const inViewport = new IsInViewport(() => sectionRef, {
		rootMargin: '-100px',
		threshold: 0
	});

	// Derived state - split markdown into tokens
	const tokens = $derived(() => markdown.split(' ').map((token) => `${token} `));

	// Function to start animation
	function startAnimation() {
		// Clear any existing interval
		if (intervalRef) {
			clearInterval(intervalRef);
			intervalRef = null;
		}

		// Reset content and start animation
		content = '';
		isAnimating = true;
		let currentContent = '';
		let index = 0;
		const tokensArray = tokens();

		intervalRef = setInterval(() => {
			if (index < tokensArray.length) {
				currentContent += tokensArray[index];
				content = currentContent;
				index++;
			} else {
				if (intervalRef) {
					clearInterval(intervalRef);
					intervalRef = null;
				}
				isAnimating = false;
			}
		}, speed);
	}

	// Effect for handling animation start
	$effect(() => {
		// Always start animation if reset was triggered (resetTrigger > 0)
		// Or start if element comes into viewport for the first time
		if (resetTrigger > 0 || inViewport.current) {
			startAnimation();
		}
	});

	// Reset function
	function reset() {
		// Stop current animation if running
		if (intervalRef) {
			clearInterval(intervalRef);
			intervalRef = null;
		}
		// Trigger re-run of animation
		resetTrigger += 1;
	}

	// Cleanup on destroy
	onDestroy(() => {
		if (intervalRef) {
			clearInterval(intervalRef);
		}
	});
</script>

<section class="space-y-16 pt-16">
	<div class="mx-auto max-w-3xl space-y-4 px-4 text-center sm:px-8">
		<h2 class="text-2xl font-semibold tracking-tighter text-pretty sm:text-3xl md:text-4xl">
			{title}
		</h2>
		<p class="text-balance text-muted-foreground sm:text-lg md:text-xl">
			{#if children}
				{@render children()}
			{/if}
		</p>
	</div>
	<div class="relative">
		<div
			class="divide-y overflow-hidden border-t sm:grid md:grid-cols-2 md:divide-x md:divide-y-0"
			bind:this={sectionRef}
		>
			{#if isOriginal}
				<div class="divide-y">
					<div class="bg-dashed w-full p-4 text-center text-sm font-medium text-muted-foreground">
						With markdown
					</div>
					<div class="h-[400px] overflow-y-auto bg-background p-4">
						<Markdown md={content} />
					</div>
				</div>
			{:else}
				<div class="divide-y">
					<div class="bg-dashed w-full p-4 text-center text-sm font-medium text-muted-foreground">
						With Streamdown Svelte (marked)
					</div>
					<div class="h-[400px] overflow-y-auto bg-background p-4">
						<Streamdown_marked {content} {...streamdownProps} />
					</div>
				</div>
			{/if}
			<div class="divide-y">
				<div class="bg-dashed w-full p-4 text-center text-sm font-medium text-muted-foreground">
					With svelte-streamdown
				</div>
				<div class="h-[400px] overflow-y-auto bg-background p-4">
					<Streamdown {content} {...streamdownProps} />
				</div>
			</div>
		</div>
		{#if !isAnimating}
			<Button
				class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-pointer rounded-full disabled:opacity-80"
				disabled={isAnimating}
				onclick={reset}
			>
				<RefreshCcw class={`size-4 ${isAnimating ? 'animate-spin' : ''}`} />
				Reset
			</Button>
		{/if}
	</div>
</section>
