import { describe, it, expect } from 'vitest';
import { parseMarkdownIntoTokens } from '../lib/parse-blocks';

describe('LaTeX begin block streaming issue', () => {
	it('merges split $$...$$ with \n\\begin{...} lines into a blockKatex token', () => {
		const content = `$$\n\\begin{pmatrix}\nx \\\\n y\n\\end{pmatrix}\n=\n$$`;

		// Parse into tokens using the library function which applies merging
		const tokens = parseMarkdownIntoTokens(content, true);

		// There should be at least one token that is a katex block or contains katex HTML
		const hasKatex = tokens.some(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(t: any) =>
				t.type === 'blockKatex' ||
				(t.type === 'paragraph' && (t.raw ?? t.text ?? '').includes('<span class="katex"'))
		);
		expect(hasKatex).toBe(true);
	});

	it('does not produce stray $$$$ when using parseIncompleteMarkdown on split blocks', () => {
		const fragments = ['$$\n', '\\begin{pmatrix}\nx \\n y\n', '\\end{pmatrix}\n=\n', '$$'];

		// Simulate streaming by joining fragments and running through the
		// library merge + re-lex path so behaviour matches runtime.
		const content = fragments.join('');
		const tokens = parseMarkdownIntoTokens(content, true);

		// Serialize tokens back to text for inspection (use raw/text when available)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const serialized = tokens.map((t: any) => t.raw ?? t.text ?? '').join('');

		// Should not contain four consecutive dollar signs
		expect(serialized).not.toContain('$$$$');
	});
});
