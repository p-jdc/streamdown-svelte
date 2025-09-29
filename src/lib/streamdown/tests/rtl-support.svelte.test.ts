import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../Streamdown.svelte';

describe('RTL (Right-to-Left) Support', () => {
	it('renders basic RTL text correctly', () => {
		const rtlContent = 'مرحبا بك في Streamdown';
		const target = document.createElement('div');
		document.body.appendChild(target);
		const { container } = render(Streamdown, { target, props: { content: rtlContent } });
		expect(container.textContent).toContain('مرحبا بك في Streamdown');
	});

	it('renders mixed RTL/LTR content in paragraphs', () => {
		const mixedContent = `
This is English text.

هذا نص عربي مع **تنسيق غامق** و *مائل*.

Mixed paragraph: Hello مرحبا World عالم.
`;

		const target = document.createElement('div');
		document.body.appendChild(target);
		const { container } = render(Streamdown, { target, props: { content: mixedContent } });
		expect(container.textContent).toContain('هذا نص عربي');
		expect(container.textContent).toContain('Hello مرحبا World عالم');
	});

	it('renders RTL content in lists', () => {
		const rtlList = `
- عنصر القائمة الأول
- עברית פריט רשימה
- Third item in English
- רابع عنصر بالعربية
`;

		const target = document.createElement('div');
		document.body.appendChild(target);
		const { container } = render(Streamdown, { target, props: { content: rtlList } });
		const listItems = container.querySelectorAll('[data-streamdown="list-item"]');
		expect(listItems.length).toBe(4);
		expect(container.textContent).toContain('עברית פריט רשימה');
	});

	it('renders RTL content in headings', () => {
		const rtlHeadings = `
# عنوان رئيسي بالعربية
## כותרת משנה בעברית
### Mixed Heading مختلط
`;

		const target = document.createElement('div');
		document.body.appendChild(target);
		const { container } = render(Streamdown, { target, props: { content: rtlHeadings } });
		const h1 = container.querySelector('[data-streamdown="heading-1"]');
		const h2 = container.querySelector('[data-streamdown="heading-2"]');
		const h3 = container.querySelector('[data-streamdown="heading-3"]');

		expect(h1?.textContent).toBe('عنوان رئيسي بالعربية');
		expect(h2?.textContent).toBe('כותרת משנה בעברית');
		expect(h3?.textContent).toBe('Mixed Heading مختلط');
	});

	it('renders inline code with RTL text', () => {
		const inlineRtl = 'Use `مرحبا` for greeting in Arabic';
		const target = document.createElement('div');
		document.body.appendChild(target);
		const { container } = render(Streamdown, { target, props: { content: inlineRtl } });
		const inlineCode = container.querySelector('[data-streamdown="inline-code"]');
		expect(inlineCode?.textContent).toBe('مرحبا');
	});

	it('renders links with RTL text', () => {
		const rtlLink = '[نص الرابط العربي](https://example.com)';
		const target = document.createElement('div');
		document.body.appendChild(target);
		const { container } = render(Streamdown, { target, props: { content: rtlLink } });
		const link = container.querySelector('[data-streamdown="link"]');
		expect(link?.textContent).toBe('نص الرابط العربي');
		expect(link?.getAttribute('href')?.startsWith('https://example.com')).toBe(true);
	});

	it('works with dir="rtl" CSS style', () => {
		const rtlContent = 'هذا نص عربي كامل';
		const wrapper = document.createElement('div');
		wrapper.setAttribute('dir', 'rtl');
		document.body.appendChild(wrapper);

		const { container } = render(Streamdown, { props: { content: rtlContent }, target: wrapper });
		// The wrapper element has the dir attribute; ensure it is present.
		expect(wrapper.getAttribute('dir')).toBe('rtl');
		expect(container.textContent).toContain('هذا نص عربي كامل');

		// Ensure the rendered content inherits RTL direction from the wrapper.
		expect(getComputedStyle(container).direction).toBe('rtl');

		// Let the test harness cleanup the wrapper; do not remove it manually here.
	});

	it('preserves bidirectional text ordering', () => {
		const bidiContent = 'The price is 50 ريال for the العربية edition';
		const target = document.createElement('div');
		document.body.appendChild(target);
		const { container } = render(Streamdown, { target, props: { content: bidiContent } });
		expect(container.textContent).toContain('The price is 50 ريال for the العربية edition');
	});
});
