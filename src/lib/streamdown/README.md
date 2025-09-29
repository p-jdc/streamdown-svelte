# streamdown

A security-hardened Svelte component for rendering streaming markdown with URL validation and sanitization. Based on [Vercel's markdown-sanitizers](https://github.com/vercel-labs/markdown-sanitizers) (MIT License).

This is particularly important for markdown returned from [LLMs in AI agents which might have been subject to prompt injection](https://vercel.com/blog/building-secure-ai-agents).

## Secure prefixes

This package validates URL prefixes and URL origins. Prefix allow-lists can be circumvented with open redirects, so make sure to make the prefixes are specific enough to avoid such attacks.

E.g. it is more secure to allow `https://example.com/images/` than it is to allow all of `https://example.com/` which may contain open redirects.

Additionally, URLs may contain path traversal like `/../`. This package does not resolve these - it lets the browser's URL constructor handle normalization. It is your responsibility that your web server does not allow such traversal.

## Features

- 🔒 **URL Filtering**: Configurable blocking of links and images that don't match allowed URL prefixes
- 🔄 **Streaming Support**: Handles incomplete markdown content during streaming
- 🛡️ **Security-First Options**: Prevents XSS, redirect attacks, and malicious protocol usage
- 📱 **Framework-Agnostic**: Core URL validation logic can be used independently
- 🎨 **Customizable**: Configure allowed prefixes for links and images separately
- ⚙️ **Flexible Defaults**: Allows all URLs by default, with easy security hardening options
- 📊 **Enhanced Tables**: Built-in copy and download functionality for tables
- 🎯 **Math Support**: KaTeX integration for mathematical expressions
- 🌈 **Syntax Highlighting**: Shiki-powered code blocks with theme support

## Security Considerations

**Important**: By default, Streamdown allows all URLs (`allowedLinkPrefixes: ['*']`, `allowedImagePrefixes: ['*']`) for ease of use. When rendering untrusted markdown content (e.g., from LLMs or user input), you should explicitly configure allowed prefixes for security:

```svelte
<!-- Secure configuration for untrusted content -->
<Streamdown
	content={untrustedMarkdown}
	defaultOrigin="https://your-site.com"
	allowedLinkPrefixes={['https://your-site.com/', 'https://trusted-domain.com/']}
	allowedImagePrefixes={['https://your-site.com/images/', 'https://trusted-cdn.com/']}
/>
```

## Installation

This component is part of the ai-elements-svelte library. You can use it by importing it from the components directory:

```typescript
import { Streamdown } from '$lib/components/streamdown';
```

### Dependencies

The component requires the following dependencies to be installed:

```bash
npm install svelte-exmarkdown shiki katex rehype-katex remark-math
# or
yarn add svelte-exmarkdown shiki katex rehype-katex remark-math
# or
pnpm add svelte-exmarkdown shiki katex rehype-katex remark-math
```

## Quick Start

```svelte
<script>
	import { Streamdown } from '$lib/components/streamdown';

	let markdown = `
# My Document
[Safe Link](https://github.com/user/repo)
[Blocked Link](https://malicious-site.com)
![Safe Image](https://via.placeholder.com/150)
![Blocked Image](https://evil.com/tracker.gif)
  `;
</script>

<Streamdown
	content={markdown}
	defaultOrigin="https://mysite.com"
	allowedLinkPrefixes={['https://github.com/', 'https://docs.']}
	allowedImagePrefixes={['https://via.placeholder.com/', '/']}
	parseIncompleteMarkdown={true}
/>
```

## API

### `Streamdown`

The main Svelte component for rendering hardened markdown.

#### Props

##### `content?: string`

- The markdown content to render
- Default: `''`

##### `defaultOrigin?: string`

- The origin to resolve relative URLs against
- Required when `allowedLinkPrefixes` or `allowedImagePrefixes` contain specific prefixes (not just wildcard `"*"`)
- Example: `"https://mysite.com"`

##### `allowedLinkPrefixes?: string[]`

- Array of URL prefixes that are allowed for links
- Links not matching these prefixes will be blocked and shown as `[blocked]`
- Use `"*"` to allow all URLs (disables filtering. However, `javascript:` and `data:` URLs are always disallowed)
- Default: `['*']` (allows all links)
- Example: `['https://github.com/', 'https://docs.example.com/']` or `['*']`

##### `allowedImagePrefixes?: string[]`

- Array of URL prefixes that are allowed for images
- Images not matching these prefixes will be blocked and shown as placeholders
- Use `"*"` to allow all URLs (disables filtering. However, `javascript:` and `data:` URLs are always disallowed)
- Default: `['*']` (allows all images)
- Example: `['https://via.placeholder.com/', '/']` or `['*']`

##### `parseIncompleteMarkdown?: boolean`

- Whether to parse incomplete markdown during streaming
- When `true`, handles partial markdown syntax gracefully
- Default: `false`

All other props are passed through to the underlying markdown renderer.

##### Additional Props

- `class?: string` - CSS class for the wrapper element
- `plugins?: Plugin[]` - Additional markdown plugins
- `shikiTheme?: [BundledTheme, BundledTheme]` - Light and dark themes for code highlighting

## Examples

### Basic Usage with Default Allowing

```svelte
<Streamdown content={markdownContent} />
```

### Block All URLs (Security-First Approach)

```svelte
<Streamdown content={markdownContent} allowedLinkPrefixes={[]} allowedImagePrefixes={[]} />
```

### Allow Specific Domains

```svelte
<Streamdown
	content={markdownContent}
	defaultOrigin="https://mysite.com"
	allowedLinkPrefixes={[
		'https://github.com/',
		'https://docs.github.com/',
		'https://www.npmjs.com/'
	]}
	allowedImagePrefixes={[
		'https://via.placeholder.com/',
		'https://images.unsplash.com/',
		'/' // Allow relative images
	]}
/>
```

### Relative URL Handling

```svelte
<Streamdown
	content={`
  [Relative Link](/internal-page)
  ![Relative Image](/images/logo.png)
  `}
	defaultOrigin="https://mysite.com"
	allowedLinkPrefixes={['https://mysite.com/']}
	allowedImagePrefixes={['https://mysite.com/']}
/>
```

### Allow All URLs (Wildcard)

```svelte
<Streamdown
	content={`
  [Any Link](https://anywhere.com/link)
  ![Any Image](https://untrusted-site.com/image.jpg)
  `}
	allowedLinkPrefixes={['*']}
	allowedImagePrefixes={['*']}
/>
```

**Note**: Using `"*"` disables URL filtering entirely. This is the default behavior, but be aware when using untrusted markdown sources.

### Streaming Markdown

```svelte
<script>
	let streamingContent = '';

	// Simulate streaming content
	const stream = ['# Title\n', 'Some content...', '\n[Link](https://github.com)'];
	stream.forEach((chunk, i) => {
		setTimeout(() => {
			streamingContent += chunk;
		}, i * 100);
	});
</script>

<Streamdown
	content={streamingContent}
	parseIncompleteMarkdown={true}
	allowedLinkPrefixes={['https://github.com/']}
/>
```

## Additional Features

### Enhanced Tables

Streamdown automatically enhances tables with copy and download functionality:

```svelte
<Streamdown
	content={`
| Name | Age | City |
|------|-----|------|
| John | 30  | NYC  |
| Jane | 25  | LA   |
`}
/>
```

Tables include:

- **Copy Button**: Copy table data to clipboard
- **Download Options**: Export as CSV, JSON, or other formats
- **Responsive Design**: Horizontal scrolling on mobile

### Mathematical Expressions

Built-in KaTeX support for mathematical notation:

```svelte
<Streamdown
	content={`
# Math Examples

Inline math: $E = mc^2$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`}
/>
```

### Code Syntax Highlighting

Shiki-powered syntax highlighting with theme support:

```svelte
<Streamdown content={markdownWithCode} shikiTheme={['github-light', 'github-dark']} />
```

### Table Components

You can also use the table components independently:

```typescript
import {
	TableCopyButton,
	TableDownloadButton,
	TableDownloadDropdown
} from '$lib/components/streamdown';
```

## Security Features

### URL Filtering

- **Links**: Filters `href` attributes in `<a>` elements
- **Images**: Filters `src` attributes in `<img>` elements
- **Relative URLs**: Properly resolves and validates relative URLs against `defaultOrigin`
- **URL Normalization**: Uses browser's URL constructor to normalize URLs (including path traversal)
- **Wildcard Support**: Use `"*"` prefix to disable filtering (allows all HTTP/HTTPS URLs)
- **Prefix Matching**: Validates that URLs start with allowed prefixes and have matching origins

### Advanced Attack Prevention

- **Protocol Blocking**: Blocks dangerous protocols including `javascript:`, `data:`, `vbscript:`, `about:`, and many others
- **Control Character Detection**: Prevents bypass attempts using null bytes, tabs, newlines, and other control characters
- **Unicode Spoofing Protection**: Blocks zero-width Unicode characters that could enable spoofing attacks
- **Malformed Protocol Detection**: Catches attempts to bypass protocol filtering with spaces, tabs, or newlines
- **XSS Prevention**: Comprehensive blocking of script injection vectors
- **Redirect Protection**: Prevents unauthorized redirects to malicious sites
- **Tracking Prevention**: Blocks unauthorized image tracking pixels when configured
- **Domain Spoofing**: Validates full URLs, not just domains

### Blocked Content Handling

- **Blocked Links**: Rendered as plain text with `[blocked]` indicator and title showing blocked URL
- **Blocked Images**: Rendered as placeholder text with image description
- **User Feedback**: Clear indication when content has been blocked for security
- **Accessibility**: Proper ARIA attributes and semantic markup for blocked content

## URL Validation Logic

The URL validation follows this approach (based on Vercel's methodology):

1. **URL Parsing**: Uses browser's `URL` constructor to parse and normalize URLs
2. **Protocol Validation**: Blocks dangerous protocols (`javascript:`, `data:`, etc.)
3. **Origin Matching**: Ensures URL origins match allowed prefix origins
4. **Prefix Matching**: Validates that normalized URLs start with allowed prefixes
5. **Wildcard Support**: Special `"*"` prefix allows all HTTP/HTTPS URLs

### Path Traversal Handling

Unlike some security libraries, this package **does not block** path traversal patterns like `../` in URLs. Instead, it:

1. Lets the browser's `URL` constructor normalize the URL
2. Validates the **normalized result** against allowed prefixes

For example:

- Input: `https://trusted.com/../../../evil.com/malware`
- Normalized: `https://trusted.com/evil.com/malware`
- Result: Allowed if `https://trusted.com/` is in allowed prefixes

This approach prioritizes **usability** while maintaining security through origin validation.

## Core Functions

For advanced use cases, you can use the core validation functions directly:

```typescript
import {
	createHardenedUrlTransformer,
	validateMarkdownOptions
} from '$lib/components/streamdown/lib/harden-markdown';

// Create a URL transformer
const transformer = createHardenedUrlTransformer(
	['https://github.com/', 'https://trusted.com/'],
	'https://example.com'
);

// Validate a URL
const result = transformer('https://github.com/user/repo'); // Returns the URL if allowed, null if blocked

// Validate markdown options
const options = validateMarkdownOptions({
	defaultOrigin: 'https://example.com',
	allowedLinkPrefixes: ['https://github.com/'],
	allowedImagePrefixes: ['https://images.com/']
});
```

## Testing

The package includes comprehensive tests covering:

- Basic markdown rendering
- URL filtering for links and images
- Relative URL handling
- Security bypass prevention
- Edge cases and malformed URLs
- Streaming markdown support

Run tests:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability, please send an email to the maintainers.

## Acknowledgments

This project is based on [Vercel's markdown-sanitizers](https://github.com/vercel-labs/markdown-sanitizers) and follows their security methodology. Special thanks to the Vercel team for their excellent work on markdown security.
