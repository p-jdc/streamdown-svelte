import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import Harness from './TableTestHarness.svelte';

// Helper to get a typed clipboard mock for assertions
const getClipboardMock = () =>
	navigator.clipboard as unknown as Clipboard & { write: ReturnType<typeof vi.fn> };

describe('Table components', () => {
	const originalClipboard = navigator.clipboard;

	beforeEach(() => {
		// mock clipboard API by default as writable (use write for ClipboardItem support)
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				write: vi.fn().mockResolvedValue(undefined)
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

	describe('Rendering', () => {
		it('should render table with headers and data', async () => {
			const headers = ['Name', 'Age', 'City'];
			const rows = [
				['John', '25', 'New York'],
				['Jane', '30', 'Boston']
			];

			render(Harness, { headers, rows });

			// Should find table headers
			const nameHeader = page.getByText('Name');
			const ageHeader = page.getByText('Age');
			await expect.element(nameHeader).toBeInTheDocument();
			await expect.element(ageHeader).toBeInTheDocument();

			// Should find table data
			const johnCell = page.getByText('John');
			const ageCell = page.getByText('25');
			await expect.element(johnCell).toBeInTheDocument();
			await expect.element(ageCell).toBeInTheDocument();

			// Should find copy button by default
			const copyButton = page.getByRole('button');
			await expect.element(copyButton).toBeInTheDocument();
		});

		it('should render empty table', async () => {
			const { container } = render(Harness, { headers: [], rows: [] });

			// Should find table element in DOM
			const table = container.querySelector('[data-streamdown="table"]');
			expect(table).toBeTruthy();
		});

		it('should render without copy button when disabled', async () => {
			const headers = ['Name'];
			const rows = [['John']];

			render(Harness, {
				headers,
				rows,
				includeCopy: false,
				includeDownload: false,
				includeDownloadDropdown: false
			});

			// Should find table content
			const nameHeader = page.getByText('Name');
			await expect.element(nameHeader).toBeInTheDocument();

			// Should not find any buttons
			const buttons = page.getByRole('button');
			await expect.element(buttons).not.toBeInTheDocument();
		});
	});

	describe('Copy functionality', () => {
		it('should copy table as markdown by default', async () => {
			const headers = ['Name', 'Age'];
			const rows = [
				['John', '25'],
				['Jane', '30']
			];
			const onCopy = vi.fn();

			render(Harness, { headers, rows, onCopy });

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// Verify clipboard.write was called with an array (ClipboardItem)
			const expectedMarkdown = '| Name | Age |\n| --- | --- |\n| John | 25 |\n| Jane | 30 |';
			expect(getClipboardMock().write).toHaveBeenCalled();
			// first argument should be an array (ClipboardItem list)
			expect(Array.isArray(getClipboardMock().write.mock.calls[0][0])).toBe(true);
			// Read the ClipboardItem that was written and assert its text/plain content
			const clipboardArray = getClipboardMock().write.mock.calls[0][0];
			const clipboardItem = clipboardArray[0];
			if (clipboardItem && typeof clipboardItem.getType === 'function') {
				const blob = await clipboardItem.getType('text/plain');
				const text = await blob.text();
				expect(text).toBe(expectedMarkdown);
			}
			expect(onCopy).toHaveBeenCalled();
		});

		it('should copy table as CSV format', async () => {
			const headers = ['Name', 'Age'];
			const rows = [['John', '25']];
			const onCopy = vi.fn();

			render(Harness, {
				headers,
				rows,
				onCopy,
				copyFormat: 'csv'
			});

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// Verify clipboard.write was called with an array (ClipboardItem)
			const expectedCSV = 'Name,Age\nJohn,25';
			expect(getClipboardMock().write).toHaveBeenCalled();
			expect(Array.isArray(getClipboardMock().write.mock.calls[0][0])).toBe(true);
			const clipboardArray = getClipboardMock().write.mock.calls[0][0];
			const clipboardItem = clipboardArray[0];
			if (clipboardItem && typeof clipboardItem.getType === 'function') {
				const blob = await clipboardItem.getType('text/plain');
				const text = await blob.text();
				expect(text).toBe(expectedCSV);
			}
			expect(onCopy).toHaveBeenCalled();
		});

		it('should handle clipboard API not available', async () => {
			const headers = ['Name'];
			const rows = [['John']];
			const onError = vi.fn();

			// Mock clipboard API as not available
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					write: undefined
				},
				writable: true,
				configurable: true
			});

			render(Harness, { headers, rows, onError });

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// onError should be called because clipboard is unavailable
			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Clipboard API not available'
				})
			);
		});

		it('should handle CSV special characters correctly', async () => {
			const headers = ['Name', 'Description'];
			const rows = [['John & Jane', 'A "special" person']];
			const onCopy = vi.fn();

			render(Harness, { headers, rows, onCopy, copyFormat: 'csv' });

			const copyButton = page.getByRole('button');
			await copyButton.click();

			// Should properly escape CSV special characters - ClipboardItem written
			const expectedCSV = 'Name,Description\nJohn & Jane,"A ""special"" person"';
			expect(getClipboardMock().write).toHaveBeenCalled();
			expect(Array.isArray(getClipboardMock().write.mock.calls[0][0])).toBe(true);
			const clipboardArray = getClipboardMock().write.mock.calls[0][0];
			const clipboardItem = clipboardArray[0];
			if (clipboardItem && typeof clipboardItem.getType === 'function') {
				const blob = await clipboardItem.getType('text/plain');
				const text = await blob.text();
				expect(text).toBe(expectedCSV);
			}
		});
	});

	describe('Data Attributes and Structure', () => {
		it('should have correct data attributes on table elements', async () => {
			const headers = ['Name', 'Age'];
			const rows = [['John', '25']];

			const { container } = render(Harness, { headers, rows });

			// Check table wrapper
			const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
			expect(tableWrapper).toBeTruthy();

			// Check table element
			const table = container.querySelector('[data-streamdown="table"]');
			expect(table).toBeTruthy();

			// Check table header
			const tableHeader = container.querySelector('[data-streamdown="table-header"]');
			expect(tableHeader).toBeTruthy();

			// Check table body
			const tableBody = container.querySelector('[data-streamdown="table-body"]');
			expect(tableBody).toBeTruthy();

			// Check table rows
			const tableRows = container.querySelectorAll('[data-streamdown="table-row"]');
			expect(tableRows.length).toBeGreaterThan(0);

			// Check header cells
			const headerCells = container.querySelectorAll('[data-streamdown="table-header-cell"]');
			expect(headerCells.length).toBe(2);

			// Check data cells
			const dataCells = container.querySelectorAll('[data-streamdown="table-cell"]');
			expect(dataCells.length).toBe(2);
		});

		it('should maintain correct structure with different data', async () => {
			const headers = ['Product', 'Price', 'Category'];
			const rows = [
				['Laptop', '$999', 'Electronics'],
				['Book', '$19.99', 'Education'],
				['Coffee', '$4.50', 'Food']
			];

			const { container } = render(Harness, { headers, rows });

			// Should have 3 header cells
			const headerCells = container.querySelectorAll('[data-streamdown="table-header-cell"]');
			expect(headerCells.length).toBe(3);

			// Should have 9 data cells (3 rows × 3 columns)
			const dataCells = container.querySelectorAll('[data-streamdown="table-cell"]');
			expect(dataCells.length).toBe(9);

			// Should have 4 total rows (1 header + 3 data)
			const tableRows = container.querySelectorAll('[data-streamdown="table-row"]');
			expect(tableRows.length).toBe(4);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty cells', async () => {
			const headers = ['Name', 'Age'];
			const rows = [
				['John', ''],
				['', '30']
			];

			render(Harness, { headers, rows });

			const nameHeader = page.getByText('Name');
			const johnCell = page.getByText('John');
			await expect.element(nameHeader).toBeInTheDocument();
			await expect.element(johnCell).toBeInTheDocument();
		});

		it('should handle rows with fewer columns than headers', async () => {
			const headers = ['Name', 'Age', 'City'];
			const rows = [['John'], ['Jane', '30']];

			const { container } = render(Harness, { headers, rows });

			// Should still have 3 header cells
			const headerCells = container.querySelectorAll('[data-streamdown="table-header-cell"]');
			expect(headerCells.length).toBe(3);

			// Should pad rows with empty cells - 6 total cells (3 + 3)
			const dataCells = container.querySelectorAll('[data-streamdown="table-cell"]');
			expect(dataCells.length).toBe(6);
		});

		it('should handle single column table', async () => {
			const headers = ['Items'];
			const rows = [['Apple'], ['Banana'], ['Cherry']];

			render(Harness, { headers, rows });

			const itemsHeader = page.getByText('Items');
			const appleCell = page.getByText('Apple');
			const bananaCell = page.getByText('Banana');

			await expect.element(itemsHeader).toBeInTheDocument();
			await expect.element(appleCell).toBeInTheDocument();
			await expect.element(bananaCell).toBeInTheDocument();
		});

		it('should handle table with no headers but with rows', async () => {
			const headers: string[] = [];
			const rows = [
				['John', '25'],
				['Jane', '30']
			];

			const { container } = render(Harness, { headers, rows });

			// Should not have thead when no headers
			const tableHeader = container.querySelector('[data-streamdown="table-header"]');
			expect(tableHeader).toBeFalsy();

			// Should still have tbody with rows
			const tableBody = container.querySelector('[data-streamdown="table-body"]');
			expect(tableBody).toBeTruthy();

			// Should have data cells
			const dataCells = container.querySelectorAll('[data-streamdown="table-cell"]');
			expect(dataCells.length).toBe(4);
		});
	});
});
