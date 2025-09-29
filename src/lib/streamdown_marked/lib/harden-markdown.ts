// Based on https://github.com/vercel-labs/markdown-sanitizers (MIT License)

interface HardenSvelteMarkdownOptions {
	defaultOrigin?: string;
	allowedLinkPrefixes?: string[];
	allowedImagePrefixes?: string[];
}

export interface HardenedMarkdownComponent {
	allowedLinkPrefixes?: string[];
	allowedImagePrefixes?: string[];
	defaultOrigin?: string;
	components?: Record<string, unknown>;
	[key: string]: unknown;
}

export function createHardenedUrlTransformer(allowedPrefixes: string[], defaultOrigin?: string) {
	/**
	 * Checks if a protocol is dangerous based on Vercel's comprehensive list
	 */
	const isDangerousProtocol = (protocol: string): boolean => {
		const dangerous = [
			'javascript:',
			'data:',
			'vbscript:',
			'about:',
			'chrome:',
			'chrome-extension:',
			'moz-extension:',
			'file:',
			'blob:',
			'filesystem:',
			'jar:',
			'ms-appx:',
			'ms-appx-web:',
			'res:',
			'resource:',
			'app:',
			'intent:',
			'android-app:',
			'mailto:',
			'tel:',
			'sms:',
			'ftp:',
			'ws:',
			'wss:',
			'jscript:',
			'ecmascript:',
			'livescript:'
		];

		return dangerous.includes(protocol.toLowerCase());
	};

	const parseUrl = (url: unknown): URL | null => {
		if (typeof url !== 'string') return null;
		try {
			// Try to parse as absolute URL first
			const urlObject = new URL(url);
			return urlObject;
		} catch {
			// If that fails and we have a defaultOrigin, try with it
			if (defaultOrigin) {
				try {
					const urlObject = new URL(url, defaultOrigin);
					return urlObject;
				} catch {
					return null;
				}
			}
			return null;
		}
	};

	const isPathRelativeUrl = (url: unknown): boolean => {
		if (typeof url !== 'string') return false;
		return url.startsWith('/');
	};

	/**
	 * Checks for Unicode and control characters that could enable spoofing attacks
	 * or bypass security filters through silent normalization
	 */
	const hasSuspiciousPatterns = (url: string): boolean => {
		// 1. Control characters (null bytes, tabs, newlines, etc.)
		// eslint-disable-next-line no-control-regex
		if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(url)) {
			return true;
		}

		// 2. Zero-width Unicode characters that could enable spoofing
		if (/[\u200B-\u200D\uFEFF]/.test(url)) {
			return true;
		}

		// 3. Malformed protocol attempts with whitespace (javascript :, data :, etc.)
		// This catches attempts to bypass protocol filtering with spaces, tabs, or newlines
		if (
			/(?:javascript|data|vbscript|about|chrome|chrome-extension|moz-extension|file|blob|filesystem|jar|ms-appx|ms-appx-web|res|resource|app|intent|android-app|mailto|tel|sms|ftp|ws|wss|jscript|ecmascript|livescript)\s*:/i.test(
				url
			)
		) {
			return true;
		}

		return false;
	};

	const transformUrl = (url: unknown): string | null => {
		if (!url) return null;

		// Special case: allow incomplete links for streaming
		if (url === 'streamdown:incomplete-link') {
			return url as string;
		}

		if (typeof url !== 'string') return null;

		// Pre-validation: Reject URLs with suspicious patterns before normalization
		if (hasSuspiciousPatterns(url)) {
			return null;
		}

		// Try to parse the URL - let URL constructor handle normalization
		const parsedUrl = parseUrl(url);
		if (!parsedUrl) return null;

		// Check if protocol is dangerous (following Vercel's approach)
		if (isDangerousProtocol(parsedUrl.protocol)) {
			return null;
		}

		// If the input is path relative, we output a path relative URL as well,
		// however, we always run the same checks on an absolute URL and we
		// always reconstruct the output from the parsed URL to ensure that
		// the output is always a valid URL.
		const inputWasRelative = isPathRelativeUrl(url);

		if (
			parsedUrl &&
			allowedPrefixes.some((prefix) => {
				const parsedPrefix = parseUrl(prefix);
				if (!parsedPrefix) {
					return false;
				}
				if (parsedPrefix.origin !== parsedUrl.origin) {
					return false;
				}
				return parsedUrl.href.startsWith(parsedPrefix.href);
			})
		) {
			if (inputWasRelative) {
				return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
			}
			return parsedUrl.href;
		}

		// Check for wildcard - allow all URLs
		if (allowedPrefixes.includes('*')) {
			// Wildcard only allows http and https URLs
			if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
				return null;
			}
			if (inputWasRelative) {
				return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
			}
			return parsedUrl.href;
		}

		return null;
	};

	return transformUrl;
}

export function validateMarkdownOptions(options: HardenSvelteMarkdownOptions) {
	const { defaultOrigin = '', allowedLinkPrefixes = [], allowedImagePrefixes = [] } = options;

	// Only require defaultOrigin if we have specific prefixes (not wildcard only)
	const hasSpecificLinkPrefixes =
		allowedLinkPrefixes.length && !allowedLinkPrefixes.every((p) => p === '*');
	const hasSpecificImagePrefixes =
		allowedImagePrefixes.length && !allowedImagePrefixes.every((p) => p === '*');

	if (!defaultOrigin && (hasSpecificLinkPrefixes || hasSpecificImagePrefixes)) {
		throw new Error(
			'defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided'
		);
	}

	return {
		defaultOrigin,
		allowedLinkPrefixes,
		allowedImagePrefixes
	};
}
