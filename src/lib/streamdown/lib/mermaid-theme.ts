/**
 * Mermaid themes based on shadcn/ui CSS variables
 * These themes dynamically use CSS custom properties from app.css
 */

import { oklch2hex } from 'colorizr';
import type { MermaidConfig } from 'mermaid';

export interface MermaidThemeVariables {
	darkMode?: boolean;
	background?: string;
	fontFamily?: string;
	fontSize?: string;
	primaryColor?: string;
	primaryTextColor?: string;
	primaryBorderColor?: string;
	secondaryColor?: string;
	secondaryTextColor?: string;
	secondaryBorderColor?: string;
	tertiaryColor?: string;
	tertiaryTextColor?: string;
	tertiaryBorderColor?: string;
	noteBkgColor?: string;
	noteTextColor?: string;
	noteBorderColor?: string;
	lineColor?: string;
	textColor?: string;
	mainBkg?: string;
	errorBkgColor?: string;
	errorTextColor?: string;
}

/**
 * Helper function to get CSS variable OKLCH values and convert to hex for Mermaid
 * This ensures all colors are in a format Mermaid can understand
 */
function getCSSVar(variable: string): string {
	if (typeof window === 'undefined') {
		// For SSR, return a neutral value that will be replaced when hydrated
		return '#000000'; // This will be corrected on the client
	}

	try {
		// Get the raw CSS variable value
		const style = getComputedStyle(document.documentElement);
		const rawValue = style.getPropertyValue(variable).trim();

		// Simple fallback if variable isn't available
		if (!rawValue) {
			return '#000000';
		}

		// Parse OKLCH value from CSS variable
		// Expected format: "oklch(l c h)" or "oklch(l c h / alpha)" or "oklch(l c h/alpha)"
		// Values can be either decimal (0.269) or percentage (26.9%)
		const oklchMatch = rawValue.match(
			/oklch\(([-\d.]+%?)\s+([\d.]+%?)\s+([-\d.]+%?)(?:\s*\/?\s*([\d.%]+))?\)/
		);

		if (oklchMatch) {
			const [, l, c, h] = oklchMatch;

			// Convert percentage values to decimal
			const lightness = l.endsWith('%') ? parseFloat(l) / 100 : parseFloat(l);
			const chroma = c.endsWith('%') ? parseFloat(c) / 100 : parseFloat(c);
			const hue = h.endsWith('%') ? parseFloat(h) : parseFloat(h); // Hue is typically in degrees, not percentage

			const oklchValues: [number, number, number] = [lightness, chroma, hue];
			const hexResult = oklch2hex(oklchValues);
			return hexResult;
		}

		// If we can't parse the OKLCH value, fall back to black
		return '#000000';
	} catch {
		return '#000000'; // Minimal fallback
	}
}

/**
 * Wait for CSS variables to be updated after theme transitions
 * This ensures we read the correct theme values from the DOM
 */
async function waitForCSSVariables(): Promise<void> {
	if (typeof window === 'undefined') return;

	// Simple delay to ensure CSS variables have updated after theme transitions
	await new Promise((resolve) => setTimeout(resolve, 50));
}

/**
 * Get current theme using shadcn/ui CSS variables
 * This function generates the theme dynamically based on current CSS variable values
 */
export async function getCurrentTheme(isDark: boolean): Promise<MermaidThemeVariables> {
	await waitForCSSVariables();

	return {
		darkMode: isDark,
		background: getCSSVar('--background'),
		fontFamily: 'ui-sans-serif, system-ui, sans-serif',
		fontSize: '16px',
		primaryColor: getCSSVar('--card'),
		primaryTextColor: getCSSVar('--card-foreground'),
		primaryBorderColor: getCSSVar('--border'),
		secondaryColor: getCSSVar('--secondary'),
		tertiaryColor: getCSSVar('--muted'),
		lineColor: getCSSVar('--primary'),
		textColor: getCSSVar('--card-foreground'),
		mainBkg: getCSSVar('--card')
	};
}

/**
 * Create MermaidConfig for given theme variables
 * Optionally merge with custom config while preserving theme variables
 */
export function createMermaidConfig(
	themeVariables: MermaidThemeVariables,
	customConfig?: MermaidConfig
): MermaidConfig {
	const defaultConfig: MermaidConfig = {
		startOnLoad: false,
		theme: 'base',
		themeVariables: themeVariables,
		securityLevel: 'strict',
		suppressErrorRendering: true,
		dompurifyConfig: {
			USE_PROFILES: { svg: true, svgFilters: true },
			ADD_TAGS: ['foreignobject'],
			ADD_ATTR: ['dominant-baseline']
		}
	};

	// Merge custom config with default config
	const mergedConfig = customConfig
		? {
				...defaultConfig,
				...customConfig,
				// Deep merge themeVariables to preserve default theme variables
				themeVariables: {
					...themeVariables,
					...customConfig.themeVariables
				}
			}
		: defaultConfig;

	return mergedConfig;
}
