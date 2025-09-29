import { SvelteMap } from 'svelte/reactivity';
import {
	getCurrentTheme,
	createMermaidConfig,
	type MermaidThemeVariables
} from './mermaid-theme.js';
import { untrack } from 'svelte';
import type { Mermaid, MermaidConfig } from 'mermaid';

interface CachedResult {
	svg: string;
	theme: 'light' | 'dark';
}

interface MermaidRenderer {
	mermaid: Mermaid;
	theme: MermaidThemeVariables;
}

export class MermaidClass {
	// Reactive state
	private _chart = $state('');
	private _error = $state<string | null>(null);
	private _isLoading = $state(false);
	private _config = $state<MermaidConfig | undefined>(undefined);
	private _currentThemeMode = $state<'light' | 'dark' | null>(null);

	// Flattened SVG state for better reactivity
	private _currentSvg = $state('');
	private _lastValidSvg = $state('');

	// Chart cache to prevent re-rendering identical content for same theme
	private _chartCache = $state<Map<string, CachedResult>>(new SvelteMap());

	// Mermaid instance management
	private _mermaidInstance: Mermaid | null = null;

	// Constants
	private readonly MAX_CACHE_SIZE = 20; // Increased since we cache per theme

	// Derived reactive values as class fields
	processedChart = $derived(this._chart.trim() ? this._chart.trim() : null);
	displaySvg = $derived(this._currentSvg || this._lastValidSvg);
	hasContent = $derived(Boolean(this.displaySvg));
	hasNoValidSvg = $derived(!this._currentSvg && !this._lastValidSvg);
	constructor(initialChart: string = '', customConfig?: MermaidConfig) {
		this._chart = initialChart;
		this._config = customConfig;

		// Don't render immediately - wait for theme mode to be set
		// The initial render will happen when setThemeMode is called
	}

	// Public reactive getters and setters
	get chart(): string {
		return this._chart;
	}

	set chart(value: string) {
		this._chart = value;
		if (value.trim() && this._currentThemeMode) {
			// Only render if we have both a chart and a theme mode
			this._renderChart();
		} else {
			this._resetState();
		}
	}

	get error(): string | null {
		return this._error;
	}

	get isLoading(): boolean {
		return this._isLoading;
	}

	get config(): MermaidConfig | undefined {
		return this._config;
	}

	// Public method to set theme mode and trigger re-render
	public setThemeMode(isDark: boolean): void {
		const newThemeMode = isDark ? 'dark' : 'light';

		if (this._currentThemeMode === newThemeMode) {
			// Theme mode hasn't changed, no need to re-render
			return;
		}

		// Theme mode changed, trigger re-render
		this._currentThemeMode = newThemeMode;
		if (this.processedChart) {
			this._renderChart();
		}
	} // Cache management
	private _addToCache(key: string, value: CachedResult): void {
		// If cache is full, remove oldest entry (LRU-style)
		if (this._chartCache.size >= this.MAX_CACHE_SIZE) {
			const firstKey = this._chartCache.keys().next().value;
			if (firstKey) {
				this._chartCache.delete(firstKey);
			}
		}
		this._chartCache.set(key, value);
	}

	// Initialize Mermaid instance
	private async _initializeMermaid(themeVariables: MermaidThemeVariables): Promise<Mermaid> {
		if (!this._mermaidInstance) {
			const mermaidModule = await import('mermaid');
			this._mermaidInstance = mermaidModule.default;
		}

		const config = createMermaidConfig(themeVariables, this._config);
		this._mermaidInstance.initialize(config);

		return this._mermaidInstance;
	}

	// Get mermaid renderer for current theme
	private async _getMermaidRenderer(isDark: boolean): Promise<MermaidRenderer> {
		const theme = await getCurrentTheme(isDark);
		const mermaid = await this._initializeMermaid(theme);
		return { mermaid, theme };
	}

	// Reset state when chart is cleared
	private _resetState(): void {
		this._error = null;
		this._isLoading = false;
		this._currentSvg = '';
	}

	// Simple timeout protection helper
	private async _renderWithTimeout(
		mermaid: Mermaid,
		id: string,
		chart: string,
		timeoutMs: number = 5000
	): Promise<{ svg: string }> {
		return Promise.race([
			mermaid.render(id, chart),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Render timeout')), timeoutMs)
			)
		]);
	}

	// Main chart rendering method
	private async _renderChart(): Promise<void> {
		const processedChart = this.processedChart;
		const isDark = this._currentThemeMode === 'dark';

		// Generate cache key
		const cacheKey = processedChart ? `${processedChart}-${this._currentThemeMode}` : null;

		if (!processedChart || !cacheKey) {
			this._isLoading = false;
			return;
		}

		// Check if we have cached results for this chart content and theme
		const cachedResult = this._chartCache.get(cacheKey);
		if (cachedResult && cachedResult.theme === this._currentThemeMode) {
			// Use cached results instead of re-rendering
			this._currentSvg = cachedResult.svg;
			this._lastValidSvg = cachedResult.svg;
			this._isLoading = false;
			this._error = null;
			return;
		}

		try {
			this._error = null;
			this._isLoading = true;

			// Get renderer for current theme
			const renderer = await this._getMermaidRenderer(isDark);

			// Use a stable ID based on chart content hash and timestamp to ensure uniqueness
			const chartHash = untrack(() => this._chart)
				.split('')
				.reduce((acc, char) => {
					return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
				}, 0);
			const chartId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

			// Render chart with timeout protection
			const { svg } = await this._renderWithTimeout(renderer.mermaid, chartId, processedChart);

			// Cache the result for future use
			this._addToCache(cacheKey, {
				svg,
				theme: this._currentThemeMode! // We know it's not null at this point
			});

			// Update both current and last valid SVG
			this._currentSvg = svg;
			this._lastValidSvg = svg;
		} catch (err) {
			// Silently fail and keep the last valid SVG
			// Only set error if we don't have any valid SVG
			if (this.hasNoValidSvg) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to render Mermaid chart';
				this._error = errorMessage;
			}
		} finally {
			this._isLoading = false;
		}
	}

	// Public method to manually trigger re-render
	public async render(): Promise<void> {
		await this._renderChart();
	}

	// Public method to clear cache
	public clearCache(): void {
		this._chartCache.clear();
	}

	// Public method to get cache size
	public getCacheSize(): number {
		return this._chartCache.size;
	}

	// Public method to update config
	public setConfig(config: MermaidConfig | undefined): void {
		this._config = config;
		// Force re-initialization on next render by clearing current instance
		this._mermaidInstance = null;
		// Clear cache since config change might affect rendering
		this.clearCache();
		// Re-render if we have a chart
		if (this.processedChart) {
			this._renderChart();
		}
	}
}
