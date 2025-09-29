import { marked } from 'marked';
import type { Token } from 'marked';
import { parseIncompleteMarkdown } from './parse-incomplete-markdown';
import markedKatex from 'marked-katex-extension';

// Singleton marked instance for better performance
let markedInstance: ReturnType<typeof marked.use> | null = null;

const getMarkedInstance = () => {
	if (!markedInstance) {
		markedInstance = marked.use(markedKatex(), { gfm: true });
	}
	return markedInstance;
};

// Cache for processed tokens to avoid re-parsing identical content
const tokenCache = new Map<string, Token[]>();
const MAX_CACHE_SIZE = 50;

export const parseMarkdownIntoTokens = (
	markdown: string,
	shouldParseIncompleteMarkdown: boolean
): Token[] => {
	// Create cache key including parsing options
	const cacheKey = `${markdown}:${shouldParseIncompleteMarkdown}`;

	// Check cache first
	if (tokenCache.has(cacheKey)) {
		return tokenCache.get(cacheKey)!;
	}

	const instance = getMarkedInstance();
	const tokens = instance.lexer(markdown);

	// Normalize tokens: prefer token.raw (some extensions, e.g. marked-katex,
	// place full math there) otherwise fall back to token.text; expose type.
	type TokenMeta = {
		raw: string;
		type: string;
		orig: Token;
	};

	const extractMeta = (token: Token): TokenMeta => {
		// reading potentially-present properties.
		const t = token as unknown as Record<string, unknown>;
		const raw = typeof t.raw === 'string' ? t.raw : typeof t.text === 'string' ? t.text : '';
		const type = typeof t.type === 'string' ? t.type : '';
		return { raw, type, orig: token };
	};

	const tokensWithMeta: TokenMeta[] = tokens.map(extractMeta);

	// Post-process to merge consecutive blocks that are part of the same math block
	const mergedBlocks: string[] = [];

	// Katex block regex: matches $$\n ... \n$$ or $\n ... \n$
	const blockKatexRegex = /^(\${1,2})\n([\s\S]*?)\n\1(?:\n|$)/;

	for (let i = 0; i < tokensWithMeta.length; i++) {
		const currentMeta = tokensWithMeta[i];
		const currentBlock = currentMeta.raw;

		// If the token is a katex token emitted by the extension it's already
		// atomic (contains the full $$...$$ or $...$). Push as-is and skip any
		// merge heuristics.
		if (currentMeta.type === 'blockKatex' || currentMeta.type === 'inlineKatex') {
			mergedBlocks.push(currentBlock);
			continue;
		}

		// Check if this is a standalone $$ that might be a closing delimiter
		if (currentBlock.trim() === '$$' && mergedBlocks.length > 0) {
			const previousBlock = mergedBlocks.at(-1);

			if (!previousBlock) {
				continue;
			}

			// Check if the previous block starts with $$ but doesn't end with $$
			const prevStartsWith$$ = previousBlock.trimStart().startsWith('$$');
			const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;

			// If previous block has odd number of $$ and starts with $$,
			// and the concatenation forms a valid katex block, merge them.
			if (prevStartsWith$$ && prevDollarCount % 2 === 1) {
				// Only create candidate and validate if pattern matches
				const candidate = previousBlock + currentBlock;
				if (blockKatexRegex.test(candidate.trim())) {
					mergedBlocks[mergedBlocks.length - 1] = candidate;
					continue;
				}
			}
		}

		// Check if current block ends with $$ and previous block started with $$ but didn't close
		if (mergedBlocks.length > 0 && currentBlock.trimEnd().endsWith('$$')) {
			const previousBlock = mergedBlocks.at(-1);

			if (!previousBlock) {
				continue;
			}

			const prevStartsWith$$ = previousBlock.trimStart().startsWith('$$');
			const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;
			const currDollarCount = (currentBlock.match(/\$\$/g) || []).length;

			// Merge when previous has unclosed $$ and current ends with a single $$ forming a katex block.
			if (
				prevStartsWith$$ &&
				prevDollarCount % 2 === 1 &&
				!currentBlock.trimStart().startsWith('$$') &&
				currDollarCount === 1
			) {
				// Only create candidate and validate if pattern matches
				const candidate = previousBlock + currentBlock;
				if (blockKatexRegex.test(candidate.trim())) {
					mergedBlocks[mergedBlocks.length - 1] = candidate;
					continue;
				}
			}
		}

		mergedBlocks.push(currentBlock);
	}

	// Trim blocks and run parseIncompleteMarkdown unless the block already matches
	// a complete Katex block (avoid duplicating/altering valid $$ math blocks).
	const processedBlocks = shouldParseIncompleteMarkdown
		? mergedBlocks.map((block) => {
				// If it already looks like a complete block math (matches the regex), leave it as-is.
				if (blockKatexRegex.test(block)) {
					return block;
				}

				// Trim the block before running the incomplete markdown parser
				// to avoid accidental indented code blocks from template indentation.
				return parseIncompleteMarkdown(block.trim());
			})
		: mergedBlocks;

	// Re-tokenize the processed blocks to get the final tokens
	const finalTokens: Token[] = [];
	for (const block of processedBlocks) {
		const blockTokens = instance.lexer(block);
		finalTokens.push(...blockTokens);
	}

	// Cache the result with LRU eviction
	if (tokenCache.size >= MAX_CACHE_SIZE) {
		const firstKey = tokenCache.keys().next().value;
		if (firstKey) {
			tokenCache.delete(firstKey);
		}
	}
	tokenCache.set(cacheKey, finalTokens);

	return finalTokens;
};
