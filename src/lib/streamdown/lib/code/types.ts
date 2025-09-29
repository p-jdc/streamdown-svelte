// types.ts - Shared types and constants for code block components
import type { BundledTheme } from 'shiki';

export interface CodeBlockContextType {
	code: string;
}

export interface ShikiThemeContextType {
	lightTheme: BundledTheme;
	darkTheme: BundledTheme;
}

export const CODE_BLOCK_CONTEXT_KEY = 'code-block-context';
export const SHIKI_THEME_CONTEXT_KEY = 'shiki-theme-context';
