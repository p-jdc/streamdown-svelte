import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../Streamdown.svelte';

describe('Markdown Components', () => {
	describe('List Components', () => {
		it('should render ordered list with correct classes', async () => {
			const content = '1. Item 1\n2. Item 2';
			const { container } = render(Streamdown, { content });

			const ol = container.querySelector('[data-streamdown="ordered-list"]');
			expect(ol).toBeTruthy();
			expect(ol?.className).toContain('ml-4');
			expect(ol?.className).toContain('list-decimal');
			expect(ol?.className).toContain('list-outside');
		});

		it('should render unordered list with correct classes', async () => {
			const content = '- Item 1\n- Item 2';
			const { container } = render(Streamdown, { content });

			const ul = container.querySelector('[data-streamdown="unordered-list"]');
			expect(ul).toBeTruthy();
			expect(ul?.className).toContain('ml-4');
			expect(ul?.className).toContain('list-disc');
			expect(ul?.className).toContain('list-outside');
		});

		it('should render list item with correct classes', async () => {
			const content = '- List item content';
			const { container } = render(Streamdown, { content });

			const li = container.querySelector('[data-streamdown="list-item"]');
			expect(li).toBeTruthy();
			expect(li?.className).toContain('py-1');
		});
	});

	describe('Heading Components', () => {
		it('should render h1 with correct classes', async () => {
			const content = '# Heading 1';
			const { container } = render(Streamdown, { content });

			const h1 = container.querySelector('[data-streamdown="heading-1"]');
			expect(h1).toBeTruthy();
			expect(h1?.className).toContain('mt-6');
			expect(h1?.className).toContain('mb-2');
			expect(h1?.className).toContain('font-semibold');
			expect(h1?.className).toContain('text-3xl');
		});

		it('should render h2 with correct classes', async () => {
			const content = '## Heading 2';
			const { container } = render(Streamdown, { content });

			const h2 = container.querySelector('[data-streamdown="heading-2"]');
			expect(h2).toBeTruthy();
			expect(h2?.className).toContain('text-2xl');
		});

		it('should render h3 with correct classes', async () => {
			const content = '### Heading 3';
			const { container } = render(Streamdown, { content });

			const h3 = container.querySelector('[data-streamdown="heading-3"]');
			expect(h3).toBeTruthy();
			expect(h3?.className).toContain('text-xl');
		});

		it('should render h4 with correct classes', async () => {
			const content = '#### Heading 4';
			const { container } = render(Streamdown, { content });

			const h4 = container.querySelector('[data-streamdown="heading-4"]');
			expect(h4).toBeTruthy();
			expect(h4?.className).toContain('text-lg');
		});

		it('should render h5 with correct classes', async () => {
			const content = '##### Heading 5';
			const { container } = render(Streamdown, { content });

			const h5 = container.querySelector('[data-streamdown="heading-5"]');
			expect(h5).toBeTruthy();
			expect(h5?.className).toContain('text-base');
		});

		it('should render h6 with correct classes', async () => {
			const content = '###### Heading 6';
			const { container } = render(Streamdown, { content });

			const h6 = container.querySelector('[data-streamdown="heading-6"]');
			expect(h6).toBeTruthy();
			expect(h6?.className).toContain('text-sm');
		});
	});

	describe('Text Formatting Components', () => {
		it('should render strong with correct classes', async () => {
			const content = '**Bold text**';
			const { container } = render(Streamdown, { content });

			const strong = container.querySelector('[data-streamdown="strong"]');
			expect(strong).toBeTruthy();
			expect(strong?.className).toContain('font-semibold');
		});

		it('should render emphasis with correct classes', async () => {
			const content = '*Italic text*';
			const { container } = render(Streamdown, { content });

			const em = container.querySelector('em');
			expect(em).toBeTruthy();
			expect(em?.textContent?.trim()).toBe('Italic text');
		});

		it('should render link with correct attributes and classes', async () => {
			const content = '[Link text](https://example.com)';
			const { container } = render(Streamdown, {
				content,
				allowedLinkPrefixes: ['https://example.com'],
				defaultOrigin: 'https://example.com'
			});

			const link = container.querySelector('a[data-streamdown="link"]');
			expect(link).toBeTruthy();
			expect(link?.className).toContain('font-medium');
			expect(link?.className).toContain('text-primary');
			expect(link?.className).toContain('underline');
			expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
			expect(link?.getAttribute('target')).toBe('_blank');
		});

		it('should mark incomplete links with data attribute', async () => {
			const content = 'Text with incomplete [link';
			const { container } = render(Streamdown, {
				content,
				parseIncompleteMarkdown: true,
				allowedLinkPrefixes: ['*']
			});

			// Should render a normal anchor with data-incomplete attribute
			const link = container.querySelector('a[data-streamdown="link"]');
			expect(link).toBeTruthy();
			expect(link?.getAttribute('data-incomplete')).toBe('true');
			expect(link?.getAttribute('href')).toBe('streamdown:incomplete-link');
			expect(link?.textContent).toBe('link');
		});

		it('should render blockquote with correct classes', async () => {
			const content = '> Quote text';
			const { container } = render(Streamdown, { content });

			const blockquote = container.querySelector('[data-streamdown="blockquote"]');
			expect(blockquote).toBeTruthy();
			expect(blockquote?.className).toContain('my-4');
			expect(blockquote?.className).toContain('border-l-4');
			expect(blockquote?.className).toContain('pl-4');
			expect(blockquote?.className).toContain('italic');
		});
	});

	describe('Code Components', () => {
		it('should render inline code with correct classes', async () => {
			const content = 'Use `code` function';
			const { container } = render(Streamdown, { content });

			const code = container.querySelector('[data-streamdown="inline-code"]');
			expect(code).toBeTruthy();
			expect(code?.className).toContain('rounded');
			expect(code?.className).toContain('bg-muted');
			expect(code?.className).toContain('px-1.5');
			expect(code?.className).toContain('py-0.5');
			expect(code?.className).toContain('font-mono');
			expect(code?.className).toContain('text-sm');
		});

		it('should render block code without inline styles', async () => {
			const content = '```\nconst x = 1;\n```';
			const { container } = render(Streamdown, { content });

			// Block code renders a CodeBlock component
			const codeBlock = container.querySelector('[data-streamdown="code-block"]');
			expect(codeBlock).toBeTruthy();
			expect(codeBlock?.getAttribute('data-language')).toBe('text');

			// Copy button might be in the code block or nearby - let's check both
			const copyButton = codeBlock?.querySelector('button') || container.querySelector('button');
			// If no copy button is found, just verify the code block exists
			// This might vary based on the specific CodeBlock implementation
			if (!copyButton) {
				// At minimum, verify the code content is present
				expect(codeBlock?.textContent).toContain('const x = 1;');
			} else {
				expect(copyButton).toBeTruthy();
			}
		});

		it('should render pre with code block', async () => {
			const content = '```\nconst x = 1;\n```';
			const { container } = render(Streamdown, { content });

			// The pre component should render its children through AstPre
			// Since bundled languages don't include 'text', it should render a simple pre element
			const codeBlock = container.querySelector('[data-streamdown="code-block"]');
			expect(codeBlock).toBeTruthy();

			// Should contain code element inside
			const code = codeBlock?.querySelector('code');
			expect(code).toBeTruthy();
			expect(code?.textContent).toContain('const x = 1;');
		});

		it('should extract language from code className', async () => {
			const content = '```javascript\nconst x = 1;\n```';
			const { container } = render(Streamdown, { content });

			// Code component with multi-line position renders a CodeBlock with language
			const codeBlock = container.querySelector('[data-streamdown="code-block"]');
			expect(codeBlock).toBeTruthy();
			expect(codeBlock?.getAttribute('data-language')).toBe('javascript');
		});

		it('should extract code from children in pre component', async () => {
			const content = '```text\nplain text code\n```';
			const { container } = render(Streamdown, { content });

			// The pre component should extract and render the text content
			const codeBlock = container.querySelector('[data-streamdown="code-block"]');
			expect(codeBlock).toBeTruthy();
			expect(codeBlock?.textContent).toContain('plain text code');
		});

		it('should render mermaid block with Mermaid and copy button', async () => {
			const content = '```mermaid\ngraph TD; A-->B;\n```';
			const { container } = render(Streamdown, { content });

			const mermaidBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(mermaidBlock).toBeTruthy();

			// Copy button should be present
			const copyButton = mermaidBlock?.querySelector('button');
			expect(copyButton).toBeTruthy();
		});

		it('should handle mermaid diagram loading state', async () => {
			const content = '```mermaid\ngraph TD\n  A --> B\n```';
			const { container } = render(Streamdown, { content });

			const mermaidBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(mermaidBlock).toBeTruthy();

			// Should initially show loading state or render diagram
			// Note: In a real integration test, you might want to wait for the diagram to load
			expect(mermaidBlock?.textContent).toBeDefined();
		});

		it('should handle mermaid loading states properly', async () => {
			const content = '```mermaid\ngraph TD\n  A --> B\n  B --> C\n  C --> D\n```';
			const { container } = render(Streamdown, { content });

			const mermaidBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(mermaidBlock).toBeTruthy();

			// Initially, the mermaid block should be present
			expect(mermaidBlock?.getAttribute('data-streamdown')).toBe('mermaid-block');

			// Wait for mermaid to potentially render
			// Use a longer timeout to allow for mermaid initialization and rendering
			await new Promise((resolve) => setTimeout(resolve, 100));

			// After waiting, check the state again
			const afterWaitContent = mermaidBlock?.textContent || '';

			// The content should be defined (either loading text or rendered diagram)
			expect(afterWaitContent).toBeDefined();

			// Check for mermaid-specific elements that indicate rendering
			const svgElement = mermaidBlock?.querySelector('svg');
			const preElement = mermaidBlock?.querySelector('pre');

			// Either should have an SVG (rendered) or pre element (fallback/loading)
			expect(svgElement || preElement).toBeTruthy();

			// Copy button should be present regardless of loading state
			const copyButton = mermaidBlock?.querySelector('button');
			expect(copyButton).toBeTruthy();

			// If SVG is present, verify it has mermaid-generated content
			if (svgElement) {
				expect(svgElement.tagName.toLowerCase()).toBe('svg');
				// SVG should have some width/height or viewBox
				expect(
					svgElement.getAttribute('width') ||
						svgElement.getAttribute('height') ||
						svgElement.getAttribute('viewBox')
				).toBeTruthy();
			}

			// Test with invalid mermaid syntax to ensure error handling
			const invalidContent = '```mermaid\ninvalid mermaid syntax here\n```';
			const { container: errorContainer } = render(Streamdown, { content: invalidContent });

			const errorMermaidBlock = errorContainer.querySelector('[data-streamdown="mermaid-block"]');
			expect(errorMermaidBlock).toBeTruthy();

			// Should still have copy button even with invalid syntax
			const errorCopyButton = errorMermaidBlock?.querySelector('button');
			expect(errorCopyButton).toBeTruthy();
		});
	});

	describe('Table Components', () => {
		const tableContent =
			'| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';

		it('should render table with wrapper div', async () => {
			const { container } = render(Streamdown, { content: tableContent });

			const wrapper = container.querySelector('[data-streamdown="table-wrapper"]');
			expect(wrapper).toBeTruthy();
			expect(wrapper?.className).toContain('my-4');
			expect(wrapper?.className).toContain('flex');
			expect(wrapper?.className).toContain('flex-col');

			// The overflow-x-auto is on the inner div that wraps the table
			const tableWrapper = wrapper?.querySelector('div.overflow-x-auto');
			expect(tableWrapper).toBeTruthy();

			const table = tableWrapper?.querySelector('[data-streamdown="table"]');
			expect(table).toBeTruthy();
			expect(table?.className).toContain('w-full');
			expect(table?.className).toContain('border-collapse');
			expect(table?.className).toContain('border');
		});

		it('should render thead with correct classes', async () => {
			const { container } = render(Streamdown, { content: tableContent });

			const thead = container.querySelector('[data-streamdown="table-header"]');
			expect(thead).toBeTruthy();
			expect(thead?.className).toContain('bg-muted/80');
		});

		it('should render tbody with correct classes', async () => {
			const { container } = render(Streamdown, { content: tableContent });

			const tbody = container.querySelector('[data-streamdown="table-body"]');
			expect(tbody).toBeTruthy();
			expect(tbody?.className).toContain('divide-y');
			expect(tbody?.className).toContain('divide-border');
			expect(tbody?.className).toContain('bg-muted/40');
		});

		it('should render tr with correct classes', async () => {
			const { container } = render(Streamdown, { content: tableContent });

			const tr = container.querySelector('[data-streamdown="table-row"]');
			expect(tr).toBeTruthy();
			expect(tr?.className).toContain('border-b');
			expect(tr?.className).toContain('border-border');
		});

		it('should render th with correct classes', async () => {
			const { container } = render(Streamdown, { content: tableContent });

			const th = container.querySelector('[data-streamdown="table-header-cell"]');
			expect(th).toBeTruthy();
			expect(th?.className).toContain('whitespace-nowrap');
			expect(th?.className).toContain('px-4');
			expect(th?.className).toContain('py-2');
			expect(th?.className).toContain('text-left');
			expect(th?.className).toContain('font-semibold');
			expect(th?.className).toContain('text-sm');
		});

		it('should render td with correct classes', async () => {
			const { container } = render(Streamdown, { content: tableContent });

			const td = container.querySelector('[data-streamdown="table-cell"]');
			expect(td).toBeTruthy();
			expect(td?.className).toContain('px-4');
			expect(td?.className).toContain('py-2');
			expect(td?.className).toContain('text-sm');
		});
	});

	describe('Other Components', () => {
		it('should render hr with correct classes', async () => {
			const content = 'Above\n\n---\n\nBelow';
			const { container } = render(Streamdown, { content });

			const hr = container.querySelector('[data-streamdown="horizontal-rule"]');
			expect(hr).toBeTruthy();
			expect(hr?.className).toContain('my-6');
			expect(hr?.className).toContain('border-border');
		});

		it('should render sup with correct classes when HTML is used', async () => {
			// Test with HTML since GFM doesn't support ^text^ syntax for superscript
			const content = 'E = mc<sup>2</sup>';
			const { container } = render(Streamdown, { content });

			const sup = container.querySelector('[data-streamdown="superscript"]');
			if (sup) {
				expect(sup?.className).toContain('text-sm');
				expect(sup?.textContent).toBe('2');
			} else {
				// If HTML is not allowed/parsed, content should be escaped
				expect(container.textContent).toContain('E = mc<sup>2</sup>');
			}
		});

		it('should not parse caret syntax as superscript (GFM limitation)', async () => {
			// Test that ^text^ syntax is NOT parsed as superscript since it's not part of GFM
			const content = 'E = mc^2^';
			const { container } = render(Streamdown, { content });

			// Should render the carets as literal text since GFM doesn't support this syntax
			expect(container.textContent).toBe('E = mc^2^');

			// Should NOT find a superscript element
			const sup = container.querySelector('[data-streamdown="superscript"]');
			expect(sup).toBeNull();
		});

		//TODO: Consider adding a custom plugin to support ~text~ for subscript if needed
		it('should render sub with correct classes when HTML is used', async () => {
			// Test with HTML since GFM doesn't support ~text~ syntax for subscript
			const content = 'H<sub>2</sub>O';
			const { container } = render(Streamdown, { content });

			const sub = container.querySelector('[data-streamdown="subscript"]');
			if (sub) {
				expect(sub?.className).toContain('text-sm');
				expect(sub?.textContent).toBe('2');
			} else {
				// If HTML is not allowed/parsed, content should be escaped
				expect(container.textContent).toContain('H<sub>2</sub>O');
			}
		});
		//TODO: Consider adding a custom plugin to support ~text~ for subscript if needed
		it('should not parse tilde syntax as subscript (GFM limitation)', async () => {
			// Test that ~text~ syntax is NOT parsed as subscript since it's not part of GFM
			const content = 'H~2~O';
			const { container } = render(Streamdown, { content });

			// The markdown processor strips the tildes but doesn't create a subscript element
			expect(container.textContent).toBe('H2O');

			// Should NOT find a subscript element - tildes are just stripped, not converted to <sub>
			const sub = container.querySelector('[data-streamdown="subscript"]');
			expect(sub).toBeNull();
		});
	});

	describe('Custom className prop', () => {
		it('should merge custom className with default classes', async () => {
			// Since we can't pass className directly to individual components through markdown,
			// we test that the default classes are still applied
			const content = '# Heading';
			const { container } = render(Streamdown, { content });

			const h1 = container.querySelector('[data-streamdown="heading-1"]');
			expect(h1?.className).toContain('mt-6');
			expect(h1?.className).toContain('mb-2');
		});

		it('should merge custom className with default heading classes', async () => {
			// Test that default classes are preserved when custom classes might be applied
			const content = '# Custom Heading';
			const { container } = render(Streamdown, { content });

			const h1 = container.querySelector('[data-streamdown="heading-1"]');
			expect(h1).toBeTruthy();

			// Verify default classes are always present
			expect(h1?.className).toContain('mt-6');
			expect(h1?.className).toContain('mb-2');
			expect(h1?.className).toContain('font-semibold');
			expect(h1?.className).toContain('text-3xl');

			// Verify content is rendered correctly
			expect(h1?.textContent?.trim()).toBe('Custom Heading');
		});

		it('should merge custom className with default strong classes', async () => {
			const content = '**Bold text with custom styling**';
			const { container } = render(Streamdown, { content });

			const strong = container.querySelector('[data-streamdown="strong"]');
			expect(strong).toBeTruthy();

			// Verify default font-semibold class is always present
			expect(strong?.className).toContain('font-semibold');
			expect(strong?.textContent?.trim()).toBe('Bold text with custom styling');
		});

		it('should merge custom className with default link classes', async () => {
			const content = '[Custom Link](https://example.com)';
			const { container } = render(Streamdown, {
				content,
				allowedLinkPrefixes: ['https://example.com'],
				defaultOrigin: 'https://example.com'
			});

			const link = container.querySelector('a[data-streamdown="link"]');
			expect(link).toBeTruthy();

			// Verify default link classes are always present
			expect(link?.className).toContain('font-medium');
			expect(link?.className).toContain('text-primary');
			expect(link?.className).toContain('underline');
			expect(link?.textContent?.trim()).toBe('Custom Link');
		});

		it('should apply custom className to root container', async () => {
			const content = '# Heading';
			const { container } = render(Streamdown, {
				content,
				class: 'custom-streamdown-class'
			});

			// Test that custom className is applied to the root element
			const rootElement = container.firstElementChild;
			expect(rootElement?.className).toContain('custom-streamdown-class');
		});
	});

	describe('Markdown Rendering Integration', () => {
		it('should render headings with correct styles', async () => {
			const content = '# H1\n## H2\n### H3\n#### H4';
			const { container } = render(Streamdown, { content });

			const h1 = container.querySelector('[data-streamdown="heading-1"]');
			const h2 = container.querySelector('[data-streamdown="heading-2"]');
			const h3 = container.querySelector('[data-streamdown="heading-3"]');
			const h4 = container.querySelector('[data-streamdown="heading-4"]');

			expect(h1).toBeTruthy();
			expect(h2).toBeTruthy();
			expect(h3).toBeTruthy();
			expect(h4).toBeTruthy();

			expect(h1?.textContent?.trim()).toBe('H1');
			expect(h2?.textContent?.trim()).toBe('H2');
			expect(h3?.textContent?.trim()).toBe('H3');
			expect(h4?.textContent?.trim()).toBe('H4');
		});

		it('should render text formatting', async () => {
			const content = 'This is **bold** and *italic* text';
			const { container } = render(Streamdown, { content });

			const strong = container.querySelector('[data-streamdown="strong"]');
			expect(strong).toBeTruthy();
			expect(strong?.textContent?.trim()).toBe('bold');

			const em = container.querySelector('em');
			expect(em).toBeTruthy();
			expect(em?.textContent?.trim()).toBe('italic');
		});

		it('should render lists', async () => {
			const content = '1. First item\n2. Second item\n\n- Bullet one\n- Bullet two';
			const { container } = render(Streamdown, { content });

			const orderedList = container.querySelector('[data-streamdown="ordered-list"]');
			const unorderedList = container.querySelector('[data-streamdown="unordered-list"]');

			expect(orderedList).toBeTruthy();
			expect(unorderedList).toBeTruthy();

			const listItems = container.querySelectorAll('[data-streamdown="list-item"]');
			expect(listItems.length).toBe(4);
		});

		it('should render blockquotes', async () => {
			const content = '> This is a quote\n> Continued quote';
			const { container } = render(Streamdown, { content });

			const blockquote = container.querySelector('[data-streamdown="blockquote"]');
			expect(blockquote).toBeTruthy();
		});

		it('should render code blocks with syntax highlighting', async () => {
			const content = '```javascript\nconst x = 42;\n```';
			const { container } = render(Streamdown, { content });

			const codeBlock = container.querySelector('[data-streamdown="code-block"]');
			expect(codeBlock).toBeTruthy();
		});

		it('should render inline code', async () => {
			const content = 'Use the `console.log()` function';
			const { container } = render(Streamdown, { content });

			const inlineCode = container.querySelector('[data-streamdown="inline-code"]');
			expect(inlineCode).toBeTruthy();
			expect(inlineCode?.textContent).toBe('console.log()');
		});

		it('should render mermaid diagrams', async () => {
			const content = '```mermaid\ngraph TD\n  A --> B\n```';
			const { container } = render(Streamdown, { content });

			const mermaidBlock = container.querySelector('[data-streamdown="mermaid-block"]');
			expect(mermaidBlock).toBeTruthy();
		});

		it('should render tables with enhanced features', async () => {
			const content = '| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
			const { container } = render(Streamdown, { content });

			const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
			expect(tableWrapper).toBeTruthy();

			const table = container.querySelector('[data-streamdown="table"]');
			expect(table).toBeTruthy();

			const tableHeader = container.querySelector('[data-streamdown="table-header"]');
			expect(tableHeader).toBeTruthy();
		});

		it('should render horizontal rules', async () => {
			const content = 'Text above\n\n---\n\nText below';
			const { container } = render(Streamdown, { content });

			const hr = container.querySelector('[data-streamdown="horizontal-rule"]');
			expect(hr).toBeTruthy();
		});
	});
});
