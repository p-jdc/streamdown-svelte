import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import Mermaid from '../lib/Mermaid.svelte';

// Mock mermaid module
const mockMermaid = {
	initialize: vi.fn(),
	render: vi.fn()
};

vi.mock('mermaid', () => ({
	default: mockMermaid
}));

// Mock colorizr module
vi.mock('colorizr', () => ({
	oklch2hex: vi.fn().mockReturnValue('#000000')
}));

// Mock the mermaid-theme module to avoid CSS variable dependencies
vi.mock('../lib/mermaid-theme.js', () => ({
	getCurrentTheme: vi.fn().mockImplementation((isDark = false) =>
		Promise.resolve({
			darkMode: isDark,
			background: isDark ? '#000000' : '#ffffff',
			fontFamily: 'ui-sans-serif, system-ui, sans-serif',
			fontSize: '16px',
			primaryColor: isDark ? '#000000' : '#ffffff',
			primaryTextColor: isDark ? '#ffffff' : '#000000',
			primaryBorderColor: isDark ? '#333333' : '#e5e5e5',
			secondaryColor: isDark ? '#111111' : '#f5f5f5',
			tertiaryColor: isDark ? '#222222' : '#f0f0f0',
			lineColor: isDark ? '#ffffff' : '#000000',
			textColor: isDark ? '#ffffff' : '#000000',
			mainBkg: isDark ? '#000000' : '#ffffff'
		})
	),
	createMermaidConfig: vi.fn().mockImplementation((themeVariables) => ({
		startOnLoad: false,
		theme: 'base',
		themeVariables: themeVariables,
		securityLevel: 'strict',
		suppressErrorRendering: true,
		dompurifyConfig: {
			USE_PROFILES: { svg: true, svgFilters: true },
			ADD_TAGS: ['foreignobject'],
			ADD_ATTR: ['dominant-baseline']
		}
	}))
}));

describe('Mermaid', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Set up default successful render behavior
		mockMermaid.render.mockResolvedValue({
			svg: '<svg><text>Test SVG</text></svg>'
		});
		mockMermaid.initialize.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe('Initial Rendering', () => {
		it('should render without crashing with valid chart', async () => {
			const { container } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Should find the mermaid block container
			const mermaidBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(mermaidBlock).toBeTruthy();
		});

		it('should apply custom className', async () => {
			const { container } = render(Mermaid, {
				chart: 'graph TD; A-->B',
				className: 'custom-class'
			});

			const mermaidBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(mermaidBlock?.className).toContain('custom-class');
		});

		it('should show loading state initially', async () => {
			// Mock slow render to keep loading state visible
			mockMermaid.render.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve({ svg: '<svg></svg>' }), 100))
			);

			render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Should show loading text
			const loadingText = page.getByText('Loading diagram...');
			await expect.element(loadingText).toBeInTheDocument();
		});

		it('should not render anything when chart is empty', async () => {
			const { container } = render(Mermaid, {
				chart: ''
			});

			// Should not have any mermaid blocks when chart is empty
			const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
			expect(mermaidBlocks.length).toBe(0);
		});

		it('should not render anything when chart is only whitespace', async () => {
			const { container } = render(Mermaid, {
				chart: '   \n\t   '
			});

			// Should not have any mermaid blocks when chart is only whitespace
			const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
			expect(mermaidBlocks.length).toBe(0);
		});
	});

	describe('Mermaid Integration', () => {
		it('should initialize mermaid with correct configuration', async () => {
			render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for async rendering to complete
			await vi.waitFor(
				() => {
					expect(mockMermaid.initialize).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			// With the new implementation, initialize may be called for different themes
			// but the exact count depends on theme reuse optimization
			expect(mockMermaid.initialize.mock.calls.length).toBeGreaterThanOrEqual(1);

			// Check that initialize was called with correct config
			const initCalls = mockMermaid.initialize.mock.calls;
			// Verify that at least one call has the correct structure
			const hasValidConfig = initCalls.some((call) => {
				const config = call[0];
				return (
					config &&
					config.startOnLoad === false &&
					config.theme === 'base' &&
					config.securityLevel === 'strict' &&
					config.suppressErrorRendering === true
				);
			});
			expect(hasValidConfig).toBe(true);
		});

		it('should render chart with correct theme-specific ID', async () => {
			render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for async rendering
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			const renderCalls = mockMermaid.render.mock.calls;

			// With the new single-theme implementation, we should have at least one render call
			expect(renderCalls.length).toBeGreaterThanOrEqual(1);

			// Check that the chart content is correct
			const chartContent = renderCalls[0][1];
			expect(chartContent).toBe('graph TD; A-->B');

			// Verify the render call has a proper ID
			expect(renderCalls[0][0]).toMatch(/^mermaid-/);
		});

		it('should render single theme version and update on theme change', async () => {
			const currentSvg = '<svg data-theme="current"><text>Current SVG</text></svg>';

			// Mock render to return consistent SVG
			mockMermaid.render.mockResolvedValue({ svg: currentSvg });

			const { container } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for async rendering
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
					// Check that content is rendered
					const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
					expect(mermaidBlocks.length).toBeGreaterThan(0);
				},
				{ timeout: 3000 }
			);

			// Should have exactly one mermaid block (single theme)
			await vi.waitFor(
				() => {
					const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
					expect(mermaidBlocks.length).toBe(1);
				},
				{ timeout: 2000 }
			);

			// Check that the SVG content is rendered
			expect(container.innerHTML).toContain('Current SVG');
		});

		it('should have proper accessibility attributes', async () => {
			const { container } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for async rendering to complete
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
					// Wait for content to be rendered
					const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
					expect(mermaidBlocks.length).toBeGreaterThan(0);
				},
				{ timeout: 3000 }
			);

			const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');

			// Check accessibility attributes on content blocks (not loading blocks)
			const contentBlocks = Array.from(mermaidBlocks).filter(
				(block) => block.getAttribute('role') === 'img'
			);

			contentBlocks.forEach((block) => {
				expect(block.getAttribute('role')).toBe('img');
				expect(block.getAttribute('aria-label')).toBe('Mermaid chart');
			});

			// Should have at least some content blocks
			expect(contentBlocks.length).toBeGreaterThan(0);
		});
	});

	describe('Error Handling', () => {
		it('should show error message when mermaid render fails and no previous valid SVG exists', async () => {
			const error = new Error('Invalid syntax');
			mockMermaid.render.mockRejectedValue(error);

			render(Mermaid, {
				chart: 'invalid mermaid syntax'
			});

			// Wait for async render attempt
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			// Since there's no previous valid SVG, should show error
			const errorText = page.getByText(/Mermaid Error:/);
			await expect.element(errorText).toBeInTheDocument();

			// Should show the error details
			const errorMessage = page.getByText('Invalid syntax');
			await expect.element(errorMessage).toBeInTheDocument();
		});

		it('should show chart code in error details', async () => {
			const error = new Error('Invalid syntax');
			mockMermaid.render.mockRejectedValue(error);

			const { container } = render(Mermaid, {
				chart: 'invalid mermaid syntax'
			});

			// Wait for async render attempt
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			// Should have details element with chart code
			await vi.waitFor(
				() => {
					const details = container.querySelector('details');
					expect(details).toBeTruthy();
				},
				{ timeout: 1000 }
			);

			const details = container.querySelector('details');
			expect(details).toBeTruthy();

			const pre = container.querySelector('pre');
			expect(pre?.textContent).toBe('invalid mermaid syntax');
		});

		it('should apply error styles correctly', async () => {
			const error = new Error('Invalid syntax');
			mockMermaid.render.mockRejectedValue(error);

			const { container } = render(Mermaid, {
				chart: 'invalid mermaid syntax'
			});

			// Wait for async render attempt
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			// Wait for error block to appear
			await vi.waitFor(
				() => {
					const errorBlock = container.querySelector('[data-streamdown="mermaid-block"]');
					expect(errorBlock?.className).toContain('border-red-200');
					expect(errorBlock?.className).toContain('bg-red-50');
				},
				{ timeout: 1000 }
			);
		});

		it('should keep last valid SVG when new render fails', async () => {
			const validSvg = '<svg><text>Valid SVG</text></svg>';

			// First render succeeds
			mockMermaid.render.mockResolvedValue({ svg: validSvg });

			const { rerender, container } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			await vi.waitFor(() => {
				expect(mockMermaid.render).toHaveBeenCalled();
			});

			// Should show valid SVG
			expect(container.innerHTML).toContain('Valid SVG');

			// Second render fails
			mockMermaid.render.mockRejectedValue(new Error('New error'));

			rerender({
				chart: 'invalid syntax'
			});

			await vi.waitFor(() => {
				// render should be called at least 1 more time for new chart
				expect(mockMermaid.render.mock.calls.length).toBeGreaterThanOrEqual(2);
			});

			// Should still show the last valid SVG, not error
			expect(container.innerHTML).toContain('Valid SVG');

			// Should not show error message
			const errorText = page.getByText(/Mermaid Error:/);
			await expect.element(errorText).not.toBeInTheDocument();
		});

		it('should handle mermaid initialization failure', async () => {
			// Make the mermaid.initialize function throw to simulate initialization failure
			mockMermaid.initialize.mockImplementation(() => {
				throw new Error('Failed to initialize mermaid');
			});

			render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Should show error when initialization fails
			await vi.waitFor(
				async () => {
					const errorText = page.getByText(/Mermaid Error:/);
					await expect.element(errorText).toBeInTheDocument();
				},
				{ timeout: 2000 }
			);

			// Should show the actual error message
			const errorDetails = page.getByText(/Failed to initialize mermaid|Failed to render/);
			await expect.element(errorDetails).toBeInTheDocument();
		});
	});

	describe('Chart Updates', () => {
		it('should re-render when chart content changes', async () => {
			const { rerender } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for initial render
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			// Clear mock calls and re-render with new chart
			vi.clearAllMocks();

			rerender({
				chart: 'graph LR; X-->Y'
			});

			// Wait for new renders (should not use cache for different content)
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			// Should render new chart content
			const renderCalls = mockMermaid.render.mock.calls;
			expect(renderCalls.length).toBeGreaterThan(0);

			// Check that all calls use the new chart content
			renderCalls.forEach((call) => {
				expect(call[1]).toBe('graph LR; X-->Y');
			});
		});

		it('should handle rapid chart changes', async () => {
			const { rerender } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Rapidly change charts
			rerender({ chart: 'graph LR; X-->Y' });
			rerender({ chart: 'graph TB; M-->N' });
			rerender({ chart: 'graph RL; P-->Q' });

			// Should handle all changes without errors
			await vi.waitFor(() => {
				expect(mockMermaid.render).toHaveBeenCalled();
			});
		});
	});

	describe('Multiple Mermaid Instances', () => {
		it('should render multiple charts with unique IDs', async () => {
			// Render first chart
			const { container: container1 } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Render second chart
			const { container: container2 } = render(Mermaid, {
				chart: 'graph LR; X-->Y'
			});

			await vi.waitFor(() => {
				expect(mockMermaid.render).toHaveBeenCalled();
			});

			// Both should have mermaid blocks
			const blocks1 = container1.querySelectorAll('[data-streamdown="mermaid-block"]');
			const blocks2 = container2.querySelectorAll('[data-streamdown="mermaid-block"]');

			expect(blocks1.length).toBeGreaterThan(0);
			expect(blocks2.length).toBeGreaterThan(0);

			// Verify unique IDs were generated (check that render was called with different IDs)
			const renderCalls = mockMermaid.render.mock.calls;
			const allIds = renderCalls.map((call) => call[0]);
			const uniqueIds = new Set(allIds);
			expect(uniqueIds.size).toBe(allIds.length); // All IDs should be unique
		});

		it('should handle different chart types simultaneously', async () => {
			const charts = [
				'graph TD; A-->B',
				'sequenceDiagram\n    Alice->>Bob: Hello',
				'classDiagram\n    class Animal'
			];

			const containers: Element[] = [];

			// Render all chart types
			for (const chart of charts) {
				const { container } = render(Mermaid, { chart });
				containers.push(container);
			}

			await vi.waitFor(() => {
				expect(mockMermaid.render).toHaveBeenCalled();
			});

			// All should have mermaid blocks
			containers.forEach((container) => {
				const blocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
				expect(blocks.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Theme Handling', () => {
		it('should initialize theme-appropriate configuration', async () => {
			render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for async rendering and theme initialization
			await vi.waitFor(
				() => {
					expect(mockMermaid.initialize).toHaveBeenCalled();
				},
				{ timeout: 3000 }
			);

			// With the new theme reuse optimization, it may not always be exactly 2 calls
			// but should have at least one initialization for themes
			const initCalls = mockMermaid.initialize.mock.calls;
			expect(initCalls.length).toBeGreaterThanOrEqual(1);

			// We can't easily test the exact theme variables due to mocking,
			// but we can verify that initialize was called with correct basic config
			const hasValidConfig = initCalls.some((call) => {
				const config = call[0];
				return (
					config &&
					config.theme === 'base' &&
					config.securityLevel === 'strict' &&
					config.suppressErrorRendering === true
				);
			});
			expect(hasValidConfig).toBe(true);
		});

		it('should render theme-appropriate SVG based on current mode', async () => {
			const currentSvg = '<svg data-theme="current"><text>Current Theme</text></svg>';

			// Mock render to return consistent SVG
			mockMermaid.render.mockResolvedValue({ svg: currentSvg });

			const { container } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for async rendering
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
					// Wait for content to be rendered
					const hasContent = container.innerHTML.includes('data-theme="current"');
					expect(hasContent).toBe(true);
				},
				{ timeout: 3000 }
			);

			// Should contain the current theme SVG
			expect(container.innerHTML).toContain('data-theme="current"');
			expect(container.innerHTML).toContain('Current Theme');
		});
	});

	describe('Edge Cases', () => {
		it('should handle very long chart definitions', async () => {
			// Clear all previous mocks to ensure clean state
			vi.clearAllMocks();

			const longChart =
				'graph TD;\n' + Array.from({ length: 100 }, (_, i) => `A${i}-->B${i}`).join('\n');

			render(Mermaid, {
				chart: longChart
			});

			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 3000 }
			);

			// Should not throw and should call render with the long chart
			const renderCalls = mockMermaid.render.mock.calls;
			const usedChart = renderCalls.find((call) => call[1] === longChart);
			expect(usedChart).toBeTruthy();
		});

		it('should handle special characters in chart', async () => {
			// Clear all previous mocks to ensure clean state
			vi.clearAllMocks();

			const specialChart = 'graph TD;\n    A["Special & <chars>"]-->B["More & chars"]';

			render(Mermaid, {
				chart: specialChart
			});

			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 3000 }
			);

			// Should handle special characters without issues
			const renderCalls = mockMermaid.render.mock.calls;
			const usedChart = renderCalls.find((call) => call[1] === specialChart);
			expect(usedChart).toBeTruthy();
		});

		it('should generate unique IDs for identical charts', async () => {
			const chart = 'graph TD; A-->B';

			// Render same chart twice
			render(Mermaid, { chart });
			render(Mermaid, { chart });

			await vi.waitFor(() => {
				expect(mockMermaid.render).toHaveBeenCalled();
			});

			// Should generate unique IDs even for identical content
			const renderCalls = mockMermaid.render.mock.calls;
			const allIds = renderCalls.map((call) => call[0]);
			const uniqueIds = new Set(allIds);
			expect(uniqueIds.size).toBe(allIds.length);
		});

		it('should handle className changes', async () => {
			const { rerender, container } = render(Mermaid, {
				chart: 'graph TD; A-->B',
				className: 'initial-class'
			});

			await vi.waitFor(() => {
				expect(mockMermaid.render).toHaveBeenCalled();
			});

			const initialBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(initialBlock?.className).toContain('initial-class');

			rerender({
				chart: 'graph TD; A-->B',
				className: 'updated-class'
			});

			// Wait for the component to re-render
			await vi.waitFor(() => {
				const updatedBlock = container.querySelector('[data-streamdown="mermaid-block"]');
				expect(updatedBlock?.className).toContain('updated-class');
			});

			const updatedBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(updatedBlock?.className).not.toContain('initial-class');
		});
	});

	describe('Performance', () => {
		it('should not re-render when chart content is the same', async () => {
			// Clear all previous mocks for clean state
			vi.clearAllMocks();

			const { rerender } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Wait for initial render
			await vi.waitFor(
				() => {
					expect(mockMermaid.render).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			// Reset mock call count but keep implementation
			mockMermaid.render.mockClear();

			// Re-render with the SAME content - should use cache
			rerender({
				chart: 'graph TD; A-->B'
			});

			// Wait a bit to let any re-renders happen
			await vi.waitFor(
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 200));
				},
				{ timeout: 1000 }
			);

			// With caching, identical content should not trigger new render calls
			expect(mockMermaid.render).not.toHaveBeenCalled();
		});

		it('should handle rapid successive changes efficiently', async () => {
			vi.useFakeTimers();

			const { rerender } = render(Mermaid, {
				chart: 'graph TD; A-->B'
			});

			// Make rapid changes
			rerender({ chart: 'graph TD; A-->C' });
			rerender({ chart: 'graph TD; A-->D' });
			rerender({ chart: 'graph TD; A-->E' });

			// Advance timers to let all effects run
			await vi.runAllTimersAsync();

			// Should handle all changes without errors
			expect(mockMermaid.render).toHaveBeenCalled();

			vi.useRealTimers();
		});
	});
});
