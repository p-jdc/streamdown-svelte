import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../Streamdown.svelte';
import type { MermaidConfig } from 'mermaid';

// Mock mermaid module
const mockMermaid = {
	initialize: vi.fn(),
	render: vi.fn()
};

vi.mock('mermaid', () => ({
	default: mockMermaid
}));

// Mock colorizr
vi.mock('colorizr', () => ({
	oklch2hex: vi.fn(() => '#000000')
}));

describe('Streamdown MermaidConfig Integration', () => {
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

	it('should pass custom mermaidConfig to mermaid renderer', async () => {
		const customConfig: MermaidConfig = {
			theme: 'dark',
			themeVariables: {
				primaryColor: '#ff0000',
				primaryTextColor: '#ffffff'
			},
			fontFamily: 'Arial, sans-serif'
		};

		const mermaidMarkdown = '```mermaid\ngraph TD\n    A --> B\n```';

		render(Streamdown, {
			content: mermaidMarkdown,
			mermaidConfig: customConfig
		});

		// Wait for async effects to complete
		await vi.waitFor(
			() => {
				expect(mockMermaid.initialize).toHaveBeenCalled();
			},
			{ timeout: 3000 }
		);

		// Check that initialize was called with the merged config
		const initializeCalls = mockMermaid.initialize.mock.calls;
		expect(initializeCalls.length).toBeGreaterThan(0);

		// Find a call that includes our custom config
		const customConfigCall = initializeCalls.find(
			(call) => call[0].theme === 'dark' && call[0].fontFamily === 'Arial, sans-serif'
		);

		expect(customConfigCall).toBeTruthy();
		if (customConfigCall) {
			expect(customConfigCall[0].themeVariables?.primaryColor).toBe('#ff0000');
			// Should maintain security settings from default config
			expect(customConfigCall[0].securityLevel).toBe('strict');
		}
	});

	it('should work without custom mermaidConfig', async () => {
		const mermaidMarkdown = '```mermaid\ngraph TD\n    A --> B\n```';

		render(Streamdown, {
			content: mermaidMarkdown
			// No mermaidConfig provided
		});

		// Wait for async effects to complete
		await vi.waitFor(
			() => {
				expect(mockMermaid.initialize).toHaveBeenCalled();
			},
			{ timeout: 3000 }
		);

		// Check that initialize was called with default config
		const initializeCalls = mockMermaid.initialize.mock.calls;
		expect(initializeCalls.length).toBeGreaterThan(0);

		// Should use base theme as default
		const baseThemeCall = initializeCalls.find((call) => call[0].theme === 'base');
		expect(baseThemeCall).toBeTruthy();
	});

	it('should handle mixed content with mermaidConfig', async () => {
		const customConfig: MermaidConfig = {
			theme: 'forest',
			flowchart: {
				htmlLabels: false
			}
		};

		const mixedMarkdown = `
# Test Document

Some text content.

\`\`\`mermaid
graph TD
    A --> B
    B --> C
\`\`\`

More text content.

\`\`\`javascript
console.log('Hello World');
\`\`\`

Another mermaid diagram:

\`\`\`mermaid
sequenceDiagram
    participant A
    participant B
    A->>B: Hello
\`\`\`
`;

		const { container } = render(Streamdown, {
			content: mixedMarkdown,
			mermaidConfig: customConfig
		});

		// Wait for content to render
		await vi.waitFor(
			() => {
				expect(container.textContent).toContain('Test Document');
			},
			{ timeout: 3000 }
		);

		// Should find mermaid blocks in the rendered output
		await vi.waitFor(
			() => {
				const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
				expect(mermaidBlocks.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 }
		);

		// Check that mermaid was initialized with custom config
		await vi.waitFor(
			() => {
				const forestCalls = mockMermaid.initialize.mock.calls.filter(
					(call) => call[0].theme === 'forest'
				);
				expect(forestCalls.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 }
		);
	});

	it('should preserve other Streamdown functionality with mermaidConfig', async () => {
		const customConfig: MermaidConfig = {
			theme: 'neutral'
		};

		const contentWithFeatures = `
# Header

**Bold text** and *italic text*

- List item 1
- List item 2

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`typescript
const x: number = 42;
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
`;

		const { container } = render(Streamdown, {
			content: contentWithFeatures,
			mermaidConfig: customConfig,
			shikiTheme: ['github-light', 'github-dark']
		});

		// Wait for content to render
		await vi.waitFor(
			() => {
				expect(container.textContent).toContain('Header');
				expect(container.textContent).toContain('Bold text');
				expect(container.textContent).toContain('List item 1');
			},
			{ timeout: 3000 }
		);

		// Should have rendered table
		await vi.waitFor(
			() => {
				const tables = container.querySelectorAll('table');
				expect(tables.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 }
		);

		// Should have mermaid blocks
		await vi.waitFor(
			() => {
				const mermaidBlocks = container.querySelectorAll('[data-streamdown="mermaid-block"]');
				expect(mermaidBlocks.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 }
		);
	});
});
