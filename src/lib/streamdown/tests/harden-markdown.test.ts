import { describe, it, expect } from 'vitest';
import {
	createHardenedUrlTransformer,
	validateMarkdownOptions,
	type HardenedMarkdownComponent
} from '../lib/harden-markdown.js';

describe('createHardenedUrlTransformer', () => {
	describe('URL validation and transformation', () => {
		it('returns null for non-string URLs', () => {
			const transformer = createHardenedUrlTransformer(['https://example.com/']);
			expect(transformer(null)).toBe(null);
			expect(transformer(undefined)).toBe(null);
			expect(transformer(123)).toBe(null);
			expect(transformer({})).toBe(null);
		});

		it('returns null for empty URLs', () => {
			const transformer = createHardenedUrlTransformer(['https://example.com/']);
			expect(transformer('')).toBe(null);
		});

		it('allows special streamdown incomplete link marker', () => {
			const transformer = createHardenedUrlTransformer(['https://example.com/']);
			expect(transformer('streamdown:incomplete-link')).toBe('streamdown:incomplete-link');
		});

		it('preserves relative URLs when input is relative and allowed', () => {
			const transformer = createHardenedUrlTransformer(
				['https://example.com/'],
				'https://example.com'
			);
			expect(transformer('/path/to/page?query=1#hash')).toBe('/path/to/page?query=1#hash');
		});

		it('returns absolute URL when input is absolute and allowed', () => {
			const transformer = createHardenedUrlTransformer(['https://github.com/']);
			expect(transformer('https://github.com/user/repo')).toBe('https://github.com/user/repo');
		});

		it('blocks relative URLs that resolve to disallowed origins', () => {
			const transformer = createHardenedUrlTransformer(
				['https://trusted.com/'],
				'https://untrusted.com'
			);
			expect(transformer('/api/data')).toBe(null);
		});

		it('handles protocol-relative URLs', () => {
			const transformer = createHardenedUrlTransformer(
				['https://cdn.example.com/'],
				'https://example.com'
			);
			expect(transformer('//cdn.example.com/resource')).toBe('/resource');
		});

		it('normalizes URLs to prevent bypasses', () => {
			const transformer = createHardenedUrlTransformer(['https://github.com/']);
			// URL normalization resolves to https://github.com/evil.com which is allowed
			// since it starts with https://github.com/
			expect(transformer('https://github.com/../../../evil.com')).toBe(
				'https://github.com/evil.com'
			);
		});
	});

	describe('Wildcard prefix support', () => {
		it('allows all http/https URLs when allowedPrefixes includes "*"', () => {
			const transformer = createHardenedUrlTransformer(['*']);

			const testUrls = [
				{ input: 'https://example.com/test', expected: 'https://example.com/test' },
				{
					input: 'https://malicious-site.com/tracker',
					expected: 'https://malicious-site.com/tracker'
				},
				{ input: 'http://insecure-site.com', expected: 'http://insecure-site.com/' },
				{ input: 'https://any-domain.org/path', expected: 'https://any-domain.org/path' }
			];

			testUrls.forEach(({ input, expected }) => {
				expect(transformer(input)).toBe(expected);
			});
		});

		it('handles relative URLs with wildcard prefix', () => {
			const transformer = createHardenedUrlTransformer(['*'], 'https://example.com');
			expect(transformer('/internal-page')).toBe('/internal-page');
		});

		it('wildcard works alongside other prefixes', () => {
			const transformer = createHardenedUrlTransformer(['https://github.com/', '*']);
			expect(transformer('https://random-site.com/path')).toBe('https://random-site.com/path');
		});

		it('wildcard allows URLs that can be resolved with defaultOrigin', () => {
			const transformer = createHardenedUrlTransformer(['*'], 'https://example.com');
			expect(transformer('invalid-url-without-protocol')).toBe(
				'https://example.com/invalid-url-without-protocol'
			);
		});

		it("wildcard doesn't require defaultOrigin for absolute URLs", () => {
			const transformer = createHardenedUrlTransformer(['*']);
			expect(transformer('https://example.com/test')).toBe('https://example.com/test');
		});

		it('wildcard still blocks completely unparseable URLs', () => {
			const transformer = createHardenedUrlTransformer(['*']);
			expect(transformer('ht@tp://not-a-valid-url')).toBe(null);
		});

		it('wildcard still blocks javascript: URLs', () => {
			const transformer = createHardenedUrlTransformer(['*']);
			expect(transformer('javascript:alert("XSS")')).toBe(null);
		});

		it('wildcard blocks data: URLs', () => {
			const transformer = createHardenedUrlTransformer(['*']);
			expect(transformer('data:text/html,123')).toBe(null);
		});

		it('wildcard blocks non-http(s) protocols', () => {
			const transformer = createHardenedUrlTransformer(['*']);
			expect(transformer('file:///etc/passwd')).toBe(null);
			expect(transformer('ftp://ftp.example.com/file')).toBe(null);
			expect(transformer('mailto:user@example.com')).toBe(null);
		});
	});

	describe('Bad URL cases', () => {
		const badUrls = [
			'javascript:alert("XSS")',
			'data:text/html,<script>alert("XSS")</script>',
			'vbscript:msgbox("XSS")',
			'file:///etc/passwd',
			'about:blank',
			'blob:https://example.com/uuid',
			'mailto:user@example.com',
			'tel:+1234567890',
			'ftp://ftp.example.com/file',
			'../../../etc/passwd',
			'//evil.com/malware',
			'https://evil.com@github.com',
			'https://github.com.evil.com',
			'https://github.com%2e%2e%2f%2e%2e%2fevil.com',
			'https://github.com%00.evil.com',
			'\x00javascript:alert(1)',
			' javascript:alert(1)',
			'javascript\x00:alert(1)'
		];

		it.each(badUrls)('blocks malicious URL: %s', (badUrl) => {
			const transformer = createHardenedUrlTransformer(
				['https://github.com/'],
				'https://example.com'
			);
			expect(transformer(badUrl)).toBe(null);
		});

		// Special case: URLs with backslashes get normalized by the URL parser
		it('handles URL normalization edge cases', () => {
			const transformer = createHardenedUrlTransformer(
				['https://github.com/'],
				'https://example.com'
			);
			// This URL gets normalized to 'https://github.com/.evil.com' which is actually allowed
			// since it starts with 'https://github.com/' - this is expected behavior
			expect(transformer('https://github.com\\.evil.com')).toBe('https://github.com/.evil.com');
		});
	});

	describe('Edge cases with malformed URLs', () => {
		it('handles numeric URL inputs', () => {
			const transformer = createHardenedUrlTransformer(
				['https://example.com/'],
				'https://example.com'
			);
			// Numeric URLs resolve to relative paths like /123 which become https://example.com/123
			expect(transformer('123')).toBe('https://example.com/123');
		});

		it('handles URLs with unicode characters', () => {
			const transformer = createHardenedUrlTransformer(['https://example.com/']);
			expect(transformer('https://example.com/路径/文件')).toBe(
				'https://example.com/%E8%B7%AF%E5%BE%84/%E6%96%87%E4%BB%B6'
			);
		});

		it('handles extremely long URLs', () => {
			const longPath = 'a'.repeat(1000);
			const transformer = createHardenedUrlTransformer(['https://example.com/']);
			expect(transformer(`https://example.com/${longPath}`)).toBe(
				`https://example.com/${longPath}`
			);
		});
	});

	describe('URL prefix validation behavior', () => {
		it("requires complete valid URL prefixes (protocol-only prefixes don't work)", () => {
			const transformer = createHardenedUrlTransformer(['https://']);
			// The link should be blocked because "https://" cannot be parsed as a valid URL
			expect(transformer('https://github.com/test')).toBe(null);
		});

		it('works with complete domain prefixes', () => {
			const transformer = createHardenedUrlTransformer(['https://github.com/']);
			expect(transformer('https://github.com/user/repo')).toBe('https://github.com/user/repo');
		});

		it('requires origin and prefix to match for validation', () => {
			const transformer = createHardenedUrlTransformer(['https://github.com/user/']);
			// Only URLs matching the prefix should be allowed
			expect(transformer('https://github.com/user/repo')).toBe('https://github.com/user/repo');
			expect(transformer('https://github.com/other/repo')).toBe(null);
		});
	});

	describe('Multiple allowed prefixes', () => {
		it('handles multiple allowed prefixes correctly', () => {
			const transformer = createHardenedUrlTransformer([
				'https://github.com/',
				'https://docs.example.com',
				'https://www.example.com'
			]);

			expect(transformer('https://github.com/repo')).toBe('https://github.com/repo');
			expect(transformer('https://docs.example.com/page')).toBe('https://docs.example.com/page');
			expect(transformer('https://www.example.com/')).toBe('https://www.example.com/');
			expect(transformer('https://malicious.com')).toBe(null);
		});
	});

	describe('Query params and hash preservation', () => {
		it('preserves query params and hash in relative URLs', () => {
			const transformer = createHardenedUrlTransformer(
				['https://trusted.com/'],
				'https://trusted.com'
			);
			expect(transformer('/img.jpg?size=large&v=2#section')).toBe(
				'/img.jpg?size=large&v=2#section'
			);
		});

		it('preserves query params and hash in absolute URLs', () => {
			const transformer = createHardenedUrlTransformer(['https://trusted.com/']);
			expect(transformer('https://trusted.com/img.jpg?size=large&v=2#section')).toBe(
				'https://trusted.com/img.jpg?size=large&v=2#section'
			);
		});
	});
});

describe('validateMarkdownOptions', () => {
	describe('defaultOrigin requirement', () => {
		it('throws error when allowedLinkPrefixes provided without defaultOrigin', () => {
			expect(() => {
				validateMarkdownOptions({
					allowedLinkPrefixes: ['https://github.com/']
				});
			}).toThrow(
				'defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided'
			);
		});

		it('throws error when allowedImagePrefixes provided without defaultOrigin', () => {
			expect(() => {
				validateMarkdownOptions({
					allowedImagePrefixes: ['https://example.com/']
				});
			}).toThrow(
				'defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided'
			);
		});

		it('does not throw when no prefixes are provided', () => {
			expect(() => {
				validateMarkdownOptions({});
			}).not.toThrow();
		});

		it('does not throw when only wildcard prefixes are provided', () => {
			expect(() => {
				validateMarkdownOptions({
					allowedLinkPrefixes: ['*'],
					allowedImagePrefixes: ['*']
				});
			}).not.toThrow();
		});

		it('does not throw when defaultOrigin is provided with prefixes', () => {
			expect(() => {
				validateMarkdownOptions({
					defaultOrigin: 'https://example.com',
					allowedLinkPrefixes: ['https://github.com/'],
					allowedImagePrefixes: ['https://trusted.com/']
				});
			}).not.toThrow();
		});
	});

	describe('return values', () => {
		it('returns provided values when valid', () => {
			const options = {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://github.com/'],
				allowedImagePrefixes: ['https://trusted.com/']
			};

			const result = validateMarkdownOptions(options);

			expect(result).toEqual({
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://github.com/'],
				allowedImagePrefixes: ['https://trusted.com/']
			});
		});

		it('returns defaults for missing values', () => {
			const result = validateMarkdownOptions({});

			expect(result).toEqual({
				defaultOrigin: '',
				allowedLinkPrefixes: [],
				allowedImagePrefixes: []
			});
		});

		it('handles partial options', () => {
			const result = validateMarkdownOptions({
				defaultOrigin: 'https://example.com'
			});

			expect(result).toEqual({
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: [],
				allowedImagePrefixes: []
			});
		});
	});

	describe('wildcard-only scenarios', () => {
		it('allows wildcard-only link prefixes without defaultOrigin', () => {
			expect(() => {
				validateMarkdownOptions({
					allowedLinkPrefixes: ['*']
				});
			}).not.toThrow();
		});

		it('allows wildcard-only image prefixes without defaultOrigin', () => {
			expect(() => {
				validateMarkdownOptions({
					allowedImagePrefixes: ['*']
				});
			}).not.toThrow();
		});

		it('allows mixed wildcard and specific prefixes with defaultOrigin', () => {
			expect(() => {
				validateMarkdownOptions({
					defaultOrigin: 'https://example.com',
					allowedLinkPrefixes: ['*', 'https://github.com/']
				});
			}).not.toThrow();
		});

		it('requires defaultOrigin when mixing wildcard with specific prefixes', () => {
			expect(() => {
				validateMarkdownOptions({
					allowedLinkPrefixes: ['*', 'https://github.com/']
				});
			}).toThrow();
		});
	});
});

describe('HardenedMarkdownComponent interface', () => {
	it('should accept valid component props', () => {
		// This is a TypeScript compilation test
		const component: HardenedMarkdownComponent = {
			allowedLinkPrefixes: ['https://github.com/'],
			allowedImagePrefixes: ['https://trusted.com/'],
			defaultOrigin: 'https://example.com',
			components: { h1: 'custom-component' },
			customProp: 'value'
		};

		expect(component).toBeDefined();
		expect(component.allowedLinkPrefixes).toEqual(['https://github.com/']);
		expect(component.allowedImagePrefixes).toEqual(['https://trusted.com/']);
		expect(component.defaultOrigin).toBe('https://example.com');
		expect(component.components).toEqual({ h1: 'custom-component' });
		expect(component.customProp).toBe('value');
	});
});
