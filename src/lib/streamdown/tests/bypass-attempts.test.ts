/* eslint-disable no-control-regex */
import { describe, it, expect } from 'vitest';
import { createHardenedUrlTransformer } from '../lib/harden-markdown.js';

describe('Harden Markdown Bypass Attempts', () => {
	const hardenedMarkdownConfig = {
		defaultOrigin: 'https://example.com',
		allowedLinkPrefixes: ['https://example.com/', 'https://trusted.org/'],
		allowedImagePrefixes: [
			'https://example.com/',
			'https://images.com/',
			'https://prefix.com/prefix/'
		]
	};

	const createTransformer = (type: 'link' | 'image') => {
		const prefixes =
			type === 'link'
				? hardenedMarkdownConfig.allowedLinkPrefixes
				: hardenedMarkdownConfig.allowedImagePrefixes;
		return createHardenedUrlTransformer(prefixes, hardenedMarkdownConfig.defaultOrigin);
	};

	const isDangerousUrl = (
		url: string,
		allowedPrefixes: string[],
		defaultOrigin?: string
	): false | string => {
		const transformer = createHardenedUrlTransformer(allowedPrefixes, defaultOrigin);
		const result = transformer(url);

		if (result === null) {
			return 'blocked by transformer';
		}

		// Additional checks for specific bypass patterns
		if (url === '/forbidden') {
			return false; // This should be allowed as relative URL
		}

		if (url === '#') {
			return false; // Hash-only URLs should be allowed
		}

		try {
			const parsedUrl = new URL(result, defaultOrigin);

			// Check if protocol is dangerous
			if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
				return 'bad protocol';
			}

			// Special prefix validation for prefix.com
			if (parsedUrl.origin === new URL('https://prefix.com/').origin) {
				if (!parsedUrl.href.startsWith('https://prefix.com/prefix/')) {
					return 'prefix bypass';
				}
			}

			return false;
		} catch {
			return 'url parsing failed';
		}
	};

	describe('Advanced JavaScript Injection Attempts', () => {
		const advancedJavaScriptUrls = [
			'javascript\x00:alert(1)', // Null byte
			'javascript\t:alert(1)', // Tab
			'javascript\n:alert(1)', // Newline
			'javascript\r:alert(1)', // Carriage return
			' javascript:alert(1)', // Leading space
			'javascript :alert(1)', // Space after protocol
			'JavaScript:alert("XSS")', // Case variation
			'JAVASCRIPT:alert("XSS")', // Case variation
			'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=', // Base64 encoded
			'data:application/javascript,alert("XSS")',
			'data:text/javascript,alert("XSS")'
		];

		advancedJavaScriptUrls.forEach((url) => {
			it(`should block advanced JavaScript injection: ${url}`, () => {
				const linkTransformer = createTransformer('link');
				const imageTransformer = createTransformer('image');

				expect(linkTransformer(url)).toBe(null);
				expect(imageTransformer(url)).toBe(null);
			});
		});
	});

	describe('Advanced Protocol Bypass Attempts', () => {
		const advancedProtocolUrls = [
			'file://c:/windows/system32/drivers/etc/hosts', // Windows-specific
			'itms://itunes.apple.com/app/id123456789', // iTunes
			'app://localhost/path', // App protocol
			'chrome-extension://extension-id/page.html', // Chrome extension
			'moz-extension://extension-id/page.html', // Firefox extension
			'about:config', // Browser config
			'filesystem:https://example.com/temporary/file.txt', // Filesystem API
			'sms:+1234567890', // SMS
			'facetime:user@example.com' // FaceTime
		];

		advancedProtocolUrls.forEach((url) => {
			it(`should block advanced protocol: ${url}`, () => {
				const linkTransformer = createTransformer('link');
				const imageTransformer = createTransformer('image');

				expect(linkTransformer(url)).toBe(null);
				expect(imageTransformer(url)).toBe(null);
			});
		});
	});

	describe('Domain and Origin Bypass Attempts', () => {
		const bypassUrls = [
			// Subdomain attacks
			'https://evil.example.com/malware',
			'https://example.com.evil.com/phishing',
			'https://sub.example.com/attack',

			// URL encoding
			'https://example.com%2e%2e%2f%2e%2e%2fevil.com',
			'https://example.com%00.evil.com',
			'https://example.com%2f%2f@evil.com',

			// Homograph attacks
			'https://еxample.com/malware', // Cyrillic 'е'
			'https://еxаmple.com/malware', // Mixed Cyrillic

			// IP addresses
			'https://192.168.1.1/internal',
			'https://127.0.0.1/localhost',
			'https://[::1]/ipv6-localhost',
			'https://2130706433/decimal-ip', // 127.0.0.1 in decimal

			// Authentication bypass
			'https://trusted.org@evil.com/phishing',
			'https://user:pass@evil.com/credentials',
			'https://evil.com#@trusted.org',

			// Protocol-relative URLs to untrusted domains
			'//evil.com/malware',
			'//192.168.1.1/internal',

			// Mixed case domains
			'https://EVIL.COM/malware',
			'https://Evil.Com/malware'
		];

		bypassUrls.forEach((url) => {
			it(`should block domain bypass attempt: ${url}`, () => {
				const issue = isDangerousUrl(
					url,
					hardenedMarkdownConfig.allowedLinkPrefixes,
					hardenedMarkdownConfig.defaultOrigin
				);
				expect(issue).not.toBe(false);
			});
		});
	});

	describe('Path Traversal URL Normalization', () => {
		it('should allow path traversal URLs that normalize to allowed prefixes', () => {
			// According to documentation: "This package does not resolve these - it lets the browser's URL constructor handle normalization"
			// These URLs should be allowed because they normalize to valid paths within allowed prefixes
			const pathTraversalUrls = [
				'https://example.com/../../../evil.com/malware', // → https://example.com/evil.com/malware
				'https://example.com/../../evil.com', // → https://example.com/evil.com
				'https://example.com/./../evil.com' // → https://example.com/evil.com
			];

			const linkTransformer = createTransformer('link');
			const imageTransformer = createTransformer('image');

			pathTraversalUrls.forEach((url) => {
				const linkResult = linkTransformer(url);
				const imageResult = imageTransformer(url);

				// These should be allowed because they normalize to paths within allowed prefixes
				expect(linkResult).not.toBe(null);
				expect(imageResult).not.toBe(null);

				// Verify they normalize correctly and stay within allowed origins
				if (linkResult) {
					expect(linkResult).toMatch(/^https:\/\/example\.com\//);
				}
				if (imageResult) {
					expect(imageResult).toMatch(/^https:\/\/example\.com\//);
				}
			});
		});
	});

	describe('Prefix Bypass Attempts', () => {
		it('should enforce prefix restrictions correctly', () => {
			const prefixTransformer = createHardenedUrlTransformer(
				['https://prefix.com/prefix/'],
				'https://example.com'
			);

			// Should allow URLs that match the prefix
			expect(prefixTransformer('https://prefix.com/prefix/allowed.jpg')).toBe(
				'https://prefix.com/prefix/allowed.jpg'
			);
			expect(prefixTransformer('https://prefix.com/prefix/subdir/file.png')).toBe(
				'https://prefix.com/prefix/subdir/file.png'
			);

			// Should block URLs that don't match the prefix
			expect(prefixTransformer('https://prefix.com/other/file.jpg')).toBe(null);
			expect(prefixTransformer('https://prefix.com/file.jpg')).toBe(null);
			expect(prefixTransformer('https://prefix.com/prefixmalicious/file.jpg')).toBe(null);
		});

		it('should prevent prefix bypass with path traversal', () => {
			const prefixTransformer = createHardenedUrlTransformer(
				['https://prefix.com/prefix/'],
				'https://example.com'
			);

			// These should be blocked
			expect(prefixTransformer('https://prefix.com/prefix/../other/file.jpg')).toBe(null);
			expect(prefixTransformer('https://prefix.com/prefix/../../file.jpg')).toBe(null);
		});
	});

	describe('Encoding and Unicode Bypass Attempts', () => {
		const encodedUrls = [
			// URL encoding
			'https://evil.com%2f@example.com',
			'https://example.com%2f..%2f..%2fevil.com',
			'https://example.com%252f@evil.com', // Double encoding

			// Unicode normalization
			'https://еxample.com', // Cyrillic е (U+0435) instead of Latin e (U+0065)
			'https://ехаmple.com', // Mixed Cyrillic х (U+0445) and а (U+0430)

			// Zero-width characters
			'https://exam\u200bple.com', // Zero-width space
			'https://exam\u200cple.com', // Zero-width non-joiner
			'https://exam\ufeffple.com', // Zero-width no-break space

			// Control characters
			'https://example.com\x00/malware',
			'https://example.com\x01/malware',
			'https://example.com\x7f/malware'
		];

		encodedUrls.forEach((url) => {
			it(`should handle encoding bypass attempt: ${url}`, () => {
				const linkTransformer = createTransformer('link');
				const result = linkTransformer(url);

				// Check if this URL should be blocked based on its characteristics
				const shouldBeBlocked =
					url.includes('evil.com') || // Contains malicious domain
					url.includes('%2f') || // URL encoded path traversal
					url.includes('%252f') || // Double encoded path traversal
					/[еха]/.test(url) || // Contains Cyrillic characters (homograph attack)
					/[\u200b\u200c\ufeff]/.test(url) || // Contains zero-width characters
					/[\x00-\x1f\x7f]/.test(url); // Contains control characters

				if (shouldBeBlocked) {
					// These URLs should be blocked entirely
					expect(result).toBe(null);
				} else {
					// If the URL is allowed, it should be properly normalized
					if (result !== null) {
						expect(result).not.toContain('\x00');
						expect(result).not.toContain('\x01');
						expect(result).not.toContain('\x7f');
						expect(result).not.toContain('\u200b');
						expect(result).not.toContain('\u200c');
						expect(result).not.toContain('\ufeff');
					}
				}
			});
		});
	});

	describe('Wildcard Security Edge Cases', () => {
		it('should allow legitimate URLs with wildcard but maintain security', () => {
			const wildcardTransformer = createHardenedUrlTransformer(['*']);

			expect(wildcardTransformer('https://any-domain.com/file.jpg')).toBe(
				'https://any-domain.com/file.jpg'
			);
			expect(wildcardTransformer('http://insecure-site.com/image.png')).toBe(
				'http://insecure-site.com/image.png'
			);
		});

		it('should handle relative URLs with wildcard properly', () => {
			const wildcardTransformer = createHardenedUrlTransformer(['*'], 'https://example.com');

			expect(wildcardTransformer('/relative/path')).toBe('/relative/path');
			expect(wildcardTransformer('relative-file.jpg')).toBe(
				'https://example.com/relative-file.jpg'
			);
		});

		it('wildcard works alongside other prefixes without conflicts', () => {
			const wildcardTransformer = createHardenedUrlTransformer(['https://github.com/', '*']);
			expect(wildcardTransformer('https://random-site.com/path')).toBe(
				'https://random-site.com/path'
			);
		});

		it('wildcard allows URLs that can be resolved with defaultOrigin', () => {
			const wildcardTransformer = createHardenedUrlTransformer(['*'], 'https://example.com');
			expect(wildcardTransformer('invalid-url-without-protocol')).toBe(
				'https://example.com/invalid-url-without-protocol'
			);
		});

		it("wildcard doesn't require defaultOrigin for absolute URLs", () => {
			const wildcardTransformer = createHardenedUrlTransformer(['*']);
			expect(wildcardTransformer('https://example.com/test')).toBe('https://example.com/test');
		});

		it('wildcard still blocks completely unparseable URLs', () => {
			const wildcardTransformer = createHardenedUrlTransformer(['*']);
			expect(wildcardTransformer('ht@tp://not-a-valid-url')).toBe(null);
		});
	});

	describe('Edge Cases and Malformed URLs', () => {
		const edgeCaseUrls = [
			'',
			' ',
			'\n',
			'\t',
			'\\',
			'/',
			'//',
			'///',
			'http://',
			'https://',
			'http:///',
			'https:///',
			'http:///path',
			'https:///path',
			'ht\x00tp://example.com',
			'http\x00s://example.com',
			'htt\x00p://example.com/path',
			'%',
			'%2',
			'%2f',
			'%2F',
			'%00',
			'%20',
			'%0d%0a',
			String.fromCharCode(0) + 'https://example.com',
			'https://example.com' + String.fromCharCode(0),
			'https://exam' + String.fromCharCode(0) + 'ple.com'
		];

		edgeCaseUrls.forEach((url) => {
			it(`should handle edge case URL: "${url.replace(/\x00/g, '\\x00').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`, () => {
				const linkTransformer = createTransformer('link');
				const result = linkTransformer(url);

				// Determine if this URL should be blocked
				const shouldBeBlocked =
					url === '' || // Empty string
					url === '//' || // Protocol-relative without domain
					url === '///' || // Malformed protocol-relative
					url === 'http://' || // Incomplete protocol
					url === 'https://' || // Incomplete protocol
					url === 'http:///' || // Malformed host
					url === 'https:///' || // Malformed host
					url === 'http:///path' || // Malformed host with path
					url === 'https:///path' || // Malformed host with path
					/[\x00]/.test(url); // Contains null bytes

				if (shouldBeBlocked) {
					// These malformed URLs should be blocked
					expect(result).toBe(null);
				} else {
					// Either blocked (null) or properly sanitized
					if (result !== null) {
						expect(typeof result).toBe('string');
						expect(result.length).toBeGreaterThan(0);
						// Should not contain null bytes or other control characters
						expect(result).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
					}
				}
			});
		});
	});

	describe('Large Input Stress Tests', () => {
		it('should handle extremely long URLs', () => {
			const longPath = 'a'.repeat(10000);
			const longUrl = `https://example.com/${longPath}`;
			const linkTransformer = createTransformer('link');

			const result = linkTransformer(longUrl);
			expect(result).toBe(longUrl);
		});

		it('should handle URLs with many parameters', () => {
			const manyParams = Array.from({ length: 100 }, (_, i) => `param${i}=value${i}`).join('&');
			const urlWithManyParams = `https://example.com/path?${manyParams}`;
			const linkTransformer = createTransformer('link');

			const result = linkTransformer(urlWithManyParams);
			expect(result).toBe(urlWithManyParams);
		});

		it('should handle deeply nested paths', () => {
			const deepPath = Array.from({ length: 100 }, (_, i) => `level${i}`).join('/');
			const deepUrl = `https://example.com/${deepPath}`;
			const linkTransformer = createTransformer('link');

			const result = linkTransformer(deepUrl);
			expect(result).toBe(deepUrl);
		});
	});

	describe('Real-world Attack Scenarios', () => {
		it('should prevent credential harvesting through fake login pages', () => {
			const phishingUrls = [
				'https://gоogle.com/login', // Cyrillic 'о'
				'https://g00gle.com/login', // Zeros instead of O's
				'https://google.com-security-check.evil.com',
				'https://accounts-google.evil.com',
				'https://google.evil.com/signin'
			];

			const linkTransformer = createTransformer('link');
			phishingUrls.forEach((url) => {
				expect(linkTransformer(url)).toBe(null);
			});
		});

		it('should prevent malware distribution through image URLs', () => {
			const malwareUrls = [
				'https://evil.com/innocent-image.jpg.exe', // Untrusted domain
				'https://malware-cdn.evil.com/image.svg' // Untrusted domain
			];

			const imageTransformer = createTransformer('image');
			malwareUrls.forEach((url) => {
				const result = imageTransformer(url);
				// These malware URLs should be blocked since they're from untrusted domains
				expect(result).toBe(null);
			});

			// Separately test path traversal URL that should be allowed after normalization
			const pathTraversalUrl = 'https://example.com/../../../evil.com/malware.png';
			const pathResult = imageTransformer(pathTraversalUrl);
			// This should be allowed as it normalizes to https://example.com/evil.com/malware.png
			expect(pathResult).not.toBe(null);
			expect(pathResult).toMatch(/^https:\/\/example\.com\//);
		});

		it('should prevent social engineering through URL spoofing', () => {
			const spoofingUrls = [
				'https://trusted.org@evil.com/fake-page',
				'https://evil.com#trusted.org',
				'https://trusted.org.evil.com/spoof',
				'https://trusted-org.evil.com/legitimate-looking'
			];

			const linkTransformer = createTransformer('link');
			spoofingUrls.forEach((url) => {
				expect(linkTransformer(url)).toBe(null);
			});
		});
	});
});
