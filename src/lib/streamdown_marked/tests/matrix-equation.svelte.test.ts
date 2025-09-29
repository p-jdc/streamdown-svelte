import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../Streamdown.svelte';
import { parseMarkdownIntoTokens } from '../lib/parse-blocks';

describe('Matrix equation rendering', () => {
	it('should render complete matrix equation properly', () => {
		const content = `$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 &
9
\\end{bmatrix}
\\cdot
\\begin{bmatrix}
x \\\\
y \\\\
z
\\end{bmatrix}
=
\\begin{bmatrix}
a
\\\\
b \\\\
c
\\end{bmatrix}
$$`;

		// Sanity-check block/token splitting and incomplete markdown helper
		const tokens = parseMarkdownIntoTokens(content, true);
		expect(tokens.length).toBeGreaterThan(0);

		const { container } = render(Streamdown, { content, parseIncompleteMarkdown: true });

		const katexElements = container.querySelectorAll('.katex');
		const katexErrors = container.querySelectorAll('.katex-error');

		expect(katexElements.length).toBeGreaterThan(0);
		expect(katexErrors.length).toBe(0);
	});

	it('should handle matrix equation without closing $$', () => {
		const content = `$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 &
9
\\end{bmatrix}
\\cdot
\\begin{bmatrix}
x \\\\
y \\\\
z
\\end{bmatrix}
=
\\begin{bmatrix}
a
\\\\
b \\\\
c
\\end{bmatrix}`; // missing closing $$

		const tokens = parseMarkdownIntoTokens(content, true);
		expect(tokens.length).toBeGreaterThan(0);

		const { container } = render(Streamdown, { content, parseIncompleteMarkdown: true });

		const katexElements = container.querySelectorAll('.katex');
		expect(katexElements.length).toBeGreaterThan(0);
	});
});
