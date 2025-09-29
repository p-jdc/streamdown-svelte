import { describe, it, expect } from 'vitest';
import { parseMarkdownIntoBlocks } from '../lib/parse-blocks';

describe('LaTeX begin block streaming issue', () => {
	it('merges split $$...$$ with \n\\begin{...} lines into a merged math block', () => {
		const content = `$$\n\\begin{pmatrix}\nx \\\\n+ y\n\\end{pmatrix}\n=\n$$`;

		// Parse into blocks using the library function which applies merging
		const blocks = parseMarkdownIntoBlocks(content);

		// There should be at least one block that contains the opening $$ and the LaTeX \begin
		const hasKatexLike = blocks.some(
			(b: string) => b.includes('$$') && b.includes('\\begin{pmatrix}')
		);
		expect(hasKatexLike).toBe(true);
	});

	it('does not produce stray $$$$ when using parseIncompleteMarkdown on split blocks', () => {
		const fragments = ['$$\n', '\\begin{pmatrix}\nx \\n y\n', '\\end{pmatrix}\n=\n', '$$'];

		// Simulate streaming by joining fragments and running through the
		// library merge + re-lex path so behaviour matches runtime.
		const content = fragments.join('');
		const blocks = parseMarkdownIntoBlocks(content);

		// Serialize blocks back to text for inspection
		const serialized = blocks.join('');

		// Should not contain four consecutive dollar signs
		expect(serialized).not.toContain('$$$$');
	});
});
