<script lang="ts">
	import { LightSwitch } from '$lib/app/light-switch';
	import CodeBlocks from '$lib/app/code-blocks.svelte';
	import CallToAction from '$lib/app/cta.svelte';
	import Footer from '$lib/app/footer.svelte';
	import GitHubFlavoredMarkdown from '$lib/app/gfm.svelte';
	import HardenedMarkdown from '$lib/app/hardened.svelte';
	import Header from '$lib/app/header.svelte';
	import Hero from '$lib/app/hero.svelte';
	import Implementation from '$lib/app/implementation.svelte';
	import Mathematics from '$lib/app/mathematics.svelte';
	import Mermaid from '$lib/app/mermaid.svelte';
	import Props from '$lib/app/props.svelte';
	import Styles from '$lib/app/styles.svelte';
	import TerminatorParser from '$lib/app/terminator-parser.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';
	import HomeIcon from '@lucide/svelte/icons/home';
	import { resolve } from '$app/paths';

	let isOriginal = $state(true);

	function navigateHome() {
		goto(resolve('/'));
	}
</script>

<div class="fixed top-3 left-3 z-50 flex items-center space-x-2">
	<Button variant="ghost" size="icon" onclick={navigateHome} aria-label="Navigate to home">
		<HomeIcon class="size-4" />
	</Button>
	<LightSwitch variant="ghost" />
	<Switch id="next-mode" bind:checked={isOriginal} />
	<Label for="next-mode">Original</Label>
</div>
<div class="container mx-auto max-w-5xl divide-y px-0 sm:border-x">
	<Header />
	<Hero />
	<Implementation />
	<Styles {isOriginal} />
	<GitHubFlavoredMarkdown {isOriginal} />
	<CodeBlocks {isOriginal} />
	<Mathematics {isOriginal} />
	<Mermaid {isOriginal} />
	<TerminatorParser {isOriginal} />
	<HardenedMarkdown {isOriginal} />
	<Props />
	<CallToAction />
	<Footer />
</div>
