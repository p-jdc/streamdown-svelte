import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import Harness from './CodeBlockTestHarness.svelte';
import type { BundledLanguage } from 'shiki';

// Helper to get a typed clipboard mock for assertions
const getClipboardMock = () =>
	navigator.clipboard as unknown as Clipboard & { writeText: ReturnType<typeof vi.fn> };

describe('CodeBlock and children', () => {
	const originalClipboard = navigator.clipboard;

	beforeEach(() => {
		// mock clipboard API by default as writable
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: vi.fn().mockResolvedValue(undefined)
			},
			writable: true,
			configurable: true
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		Object.defineProperty(navigator, 'clipboard', {
			value: originalClipboard,
			writable: true,
			configurable: true
		});
	});

	describe('Initial Rendering', () => {
		it('should render code block with default props', async () => {
			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage
			});

			// Should find language label (this proves the component rendered)
			const languageLabel = page.getByText('javascript');
			await expect.element(languageLabel).toBeInTheDocument();

			// Should find copy button by default
			const copyButton = page.getByRole('button');
			await expect.element(copyButton).toBeInTheDocument();

			// Should find the code block content (use .first() for strict mode)
			const codeContent = page.getByText('const').first();
			await expect.element(codeContent).toBeInTheDocument();
		});

		it('should render without copy button when includeCopy is false', async () => {
			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Should find language label
			const languageLabel = page.getByText('javascript');
			await expect.element(languageLabel).toBeInTheDocument();

			// Should not find any buttons
			const buttons = page.getByRole('button');
			await expect.element(buttons).not.toBeInTheDocument();
		});

		it('should render download button when includeDownload is true', async () => {
			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false,
				includeDownload: true
			});

			const downloadButton = page.getByRole('button');
			await expect.element(downloadButton).toBeInTheDocument();
		});
	});

	describe('Copy Functionality', () => {
		it('should copy code to clipboard on click and call onCopy', async () => {
			const onCopy = vi.fn();

			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				onCopy
			});

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// Verify clipboard was called with correct text
			expect(getClipboardMock().writeText).toHaveBeenCalledWith('const x = 1;');
			expect(onCopy).toHaveBeenCalled();
		});

		it('should show check icon after copying', async () => {
			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage
			});

			const copyButton = page.getByRole('button');

			// Initially should have copy icon (lucide copy icon)
			await expect.element(copyButton).toBeInTheDocument();

			await copyButton.click();

			// After clicking, should show success state
			// The button content changes to Check icon, but we can verify clipboard was called
			expect(getClipboardMock().writeText).toHaveBeenCalledWith('const x = 1;');
		});

		it('should handle clipboard API not available', async () => {
			const onError = vi.fn();

			// Mock clipboard API as not available
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: undefined
				},
				writable: true,
				configurable: true
			});

			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				onError
			});

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// onError should be called because clipboard is unavailable
			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Clipboard API not available'
				})
			);
		});

		it('should handle clipboard write failure and call onError', async () => {
			const onError = vi.fn();
			const error = new Error('Clipboard write failed');

			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: vi.fn().mockRejectedValue(error)
				},
				writable: true,
				configurable: true
			});

			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				onError
			});

			const copyButton = page.getByRole('button');
			await copyButton.click();

			expect(onError).toHaveBeenCalledWith(error);
		});

		it('should reset icon after timeout', async () => {
			vi.useFakeTimers();

			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				timeout: 1000
			});

			const copyButton = page.getByRole('button');
			await copyButton.click();

			expect(getClipboardMock().writeText).toHaveBeenCalledWith('const x = 1;');

			// advance timers to let the copied icon reset
			vi.advanceTimersByTime(1000);

			// After timeout, the button should still be present
			await expect.element(copyButton).toBeInTheDocument();
		});
	});

	describe('Multiple Code Blocks', () => {
		it('should render multiple code blocks with different languages simultaneously', async () => {
			const pythonCode = "print('hello world!')";
			const jsCode = "console.log('hello world!');";

			// Since we can't render multiple components in a single call with our harness,
			// we'll test by re-rendering and verifying both languages work correctly
			const { container: pythonContainer } = render(Harness, {
				code: pythonCode,
				language: 'python' as unknown as BundledLanguage,
				includeCopy: false
			});

			const { container: jsContainer } = render(Harness, {
				code: jsCode,
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Verify both languages are rendered correctly
			const pythonLabel = page.getByText('python');
			const jsLabel = page.getByText('javascript');
			await expect.element(pythonLabel).toBeInTheDocument();
			await expect.element(jsLabel).toBeInTheDocument();

			// Verify code content for both
			const printText = page.getByText('print').first();
			const consoleText = page.getByText('console').first();
			await expect.element(printText).toBeInTheDocument();
			await expect.element(consoleText).toBeInTheDocument();

			// Verify data attributes for both
			const pythonContainerEl = pythonContainer.querySelector('[data-code-block-container]');
			const jsContainerEl = jsContainer.querySelector('[data-code-block-container]');
			expect(pythonContainerEl?.getAttribute('data-language')).toBe('python');
			expect(jsContainerEl?.getAttribute('data-language')).toBe('javascript');
		});

		it('should handle multiple instances of the same language', async () => {
			const code1 = 'const x = 1;';
			const code2 = 'const y = 2;';

			// Render first JavaScript block
			const { container: container1 } = render(Harness, {
				code: code1,
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Render second JavaScript block
			const { container: container2 } = render(Harness, {
				code: code2,
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Both should show JavaScript language
			const jsLabels = page.getByText('javascript');
			await expect.element(jsLabels.first()).toBeInTheDocument();

			// Verify different code content
			const firstCode = page.getByText('const x').first();
			const secondCode = page.getByText('const y').first();
			await expect.element(firstCode).toBeInTheDocument();
			await expect.element(secondCode).toBeInTheDocument();

			// Both should have correct data attributes
			const container1El = container1.querySelector('[data-code-block-container]');
			const container2El = container2.querySelector('[data-code-block-container]');
			expect(container1El?.getAttribute('data-language')).toBe('javascript');
			expect(container2El?.getAttribute('data-language')).toBe('javascript');
		});

		it('should handle rapid sequential rendering of different languages', async () => {
			const languages = [
				{ code: "print('Python')", lang: 'python' as unknown as BundledLanguage },
				{ code: "console.log('JS')", lang: 'javascript' as unknown as BundledLanguage },
				{ code: "const x: string = 'TS'", lang: 'typescript' as unknown as BundledLanguage }
			];

			const containers: Element[] = [];

			// Render all languages rapidly
			for (const item of languages) {
				const { container } = render(Harness, {
					code: item.code,
					language: item.lang,
					includeCopy: false
				});
				containers.push(container);
			}

			// Verify all languages are displayed
			const pythonLabel = page.getByText('python');
			const jsLabel = page.getByText('javascript');
			const tsLabel = page.getByText('typescript');

			await expect.element(pythonLabel).toBeInTheDocument();
			await expect.element(jsLabel).toBeInTheDocument();
			await expect.element(tsLabel).toBeInTheDocument();

			// Verify data attributes for all
			expect(
				containers[0].querySelector('[data-code-block-container]')?.getAttribute('data-language')
			).toBe('python');
			expect(
				containers[1].querySelector('[data-code-block-container]')?.getAttribute('data-language')
			).toBe('javascript');
			expect(
				containers[2].querySelector('[data-code-block-container]')?.getAttribute('data-language')
			).toBe('typescript');
		});
	});

	describe('Visual State Changes', () => {
		it('should show visual changes after copying (icon state)', async () => {
			const { container } = render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: true
			});

			const copyButton = page.getByRole('button');
			await expect.element(copyButton).toBeInTheDocument();

			// Click the copy button
			await copyButton.click();

			// Verify clipboard was called
			expect(getClipboardMock().writeText).toHaveBeenCalledWith('const x = 1;');

			// Check for SVG element in button (indicates icon is rendered)
			const button = container.querySelector('button');
			const svg = button?.querySelector('svg');
			expect(svg).toBeTruthy();
		});

		it('should maintain correct structure after icon state changes', async () => {
			vi.useFakeTimers();

			const { container } = render(Harness, {
				code: 'const test = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: true,
				timeout: 1000
			});

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// Should still have correct structure after copying
			const containerEl = container.querySelector('[data-code-block-container]');
			expect(containerEl?.getAttribute('data-language')).toBe('javascript');

			// Advance timers to reset icon
			vi.advanceTimersByTime(1000);

			// Should still have SVG (icon should be present whether copy or reset state)
			const button = container.querySelector('button');
			const svg = button?.querySelector('svg');
			expect(svg).toBeTruthy();

			vi.useRealTimers();
		});
	});

	describe('Download Functionality', () => {
		it('should trigger download without throwing', async () => {
			// save function used by download button lives in utils; we can't easily intercept it here,
			// but calling the button should not throw
			render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false,
				includeDownload: true
			});

			const downloadButton = page.getByRole('button');
			await expect.element(downloadButton).toBeInTheDocument();

			// Should not throw when clicked
			await downloadButton.click();
		});
	});

	describe('Data Attributes', () => {
		it('should have correct data attributes on container, header, and code block elements', async () => {
			const { container } = render(Harness, {
				code: 'const x = 1;',
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Check that the component rendered with correct structure
			const languageLabel = page.getByText('javascript');
			await expect.element(languageLabel).toBeInTheDocument();

			// Verify code content is rendered
			const codeContent = page.getByText('const').first();
			await expect.element(codeContent).toBeInTheDocument();

			// Since we can access the container from render, let's test data attributes directly
			const codeBlockContainer = container.querySelector('[data-code-block-container]');
			expect(codeBlockContainer).toBeTruthy();
			expect(codeBlockContainer?.getAttribute('data-language')).toBe('javascript');

			const codeBlockHeader = container.querySelector('[data-code-block-header]');
			expect(codeBlockHeader).toBeTruthy();
			expect(codeBlockHeader?.getAttribute('data-language')).toBe('javascript');

			const codeBlocks = container.querySelectorAll('[data-code-block]');
			expect(codeBlocks.length).toBeGreaterThan(0);
			// Check that at least one code block has the correct language
			const hasCorrectLanguage = Array.from(codeBlocks).some(
				(block) => block.getAttribute('data-language') === 'javascript'
			);
			expect(hasCorrectLanguage).toBe(true);
		});

		it('should render correctly for different languages', async () => {
			const { container } = render(Harness, {
				code: 'print("hello world")',
				language: 'python' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Verify the language is correctly displayed
			const languageLabel = page.getByText('python');
			await expect.element(languageLabel).toBeInTheDocument();

			// Test data attributes for Python
			const codeBlockContainer = container.querySelector('[data-code-block-container]');
			expect(codeBlockContainer?.getAttribute('data-language')).toBe('python');

			const codeBlockHeader = container.querySelector('[data-code-block-header]');
			expect(codeBlockHeader?.getAttribute('data-language')).toBe('python');

			// Verify the code content is rendered
			const printText = page.getByText('print').first();
			await expect.element(printText).toBeInTheDocument();
		});

		it('should maintain correct language display with copy button enabled', async () => {
			const { container } = render(Harness, {
				code: 'const test = "data attributes";',
				language: 'typescript' as unknown as BundledLanguage,
				includeCopy: true
			});

			// Verify the language is displayed correctly
			const languageLabel = page.getByText('typescript');
			await expect.element(languageLabel).toBeInTheDocument();

			// Test data attributes for TypeScript
			const codeBlockContainer = container.querySelector('[data-code-block-container]');
			expect(codeBlockContainer?.getAttribute('data-language')).toBe('typescript');

			const codeBlockHeader = container.querySelector('[data-code-block-header]');
			expect(codeBlockHeader?.getAttribute('data-language')).toBe('typescript');

			// Ensure copy button is also present
			const copyButton = page.getByRole('button');
			await expect.element(copyButton).toBeInTheDocument();

			// Verify code content is rendered
			const codeContent = page.getByText('const').first();
			await expect.element(codeContent).toBeInTheDocument();
		});

		it('should handle multiple language changes correctly', async () => {
			// Test that the component correctly updates when language changes
			const { rerender, container } = render(Harness, {
				code: 'console.log("js");',
				language: 'javascript' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Initially should show JavaScript
			const jsLabel = page.getByText('javascript');
			await expect.element(jsLabel).toBeInTheDocument();

			// Check initial data attributes
			let codeBlockContainer = container.querySelector('[data-code-block-container]');
			expect(codeBlockContainer?.getAttribute('data-language')).toBe('javascript');

			// Re-render with Python
			rerender({
				code: 'print("python")',
				language: 'python' as unknown as BundledLanguage,
				includeCopy: false
			});

			// Should now show Python
			const pythonLabel = page.getByText('python');
			await expect.element(pythonLabel).toBeInTheDocument();

			// Check updated data attributes
			codeBlockContainer = container.querySelector('[data-code-block-container]');
			expect(codeBlockContainer?.getAttribute('data-language')).toBe('python');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty code', async () => {
			render(Harness, {
				code: '',
				language: 'javascript' as unknown as BundledLanguage
			});

			// Should find language label even with empty code
			const languageLabel = page.getByText('javascript');
			await expect.element(languageLabel).toBeInTheDocument();

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// Should copy empty string
			expect(getClipboardMock().writeText).toHaveBeenCalledWith('');
		});

		it('should handle special characters in code', async () => {
			const specialCode = 'const str = "Hello & <world>!";';

			render(Harness, {
				code: specialCode,
				language: 'javascript' as unknown as BundledLanguage
			});

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// Should copy the exact string including special characters
			expect(getClipboardMock().writeText).toHaveBeenCalledWith(specialCode);
		});
	});
});
