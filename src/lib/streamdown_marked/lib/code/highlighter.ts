// highlighter-manager.ts - Optimized highlighter management similar to Vercel's approach
import {
	createHighlighter,
	type BundledLanguage,
	type BundledTheme,
	type SpecialLanguage,
	bundledLanguages
} from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import DOMPurify from 'isomorphic-dompurify';

const PRE_TAG_REGEX = /<pre(\s|>)/;

class HighlighterManager {
	private lightHighlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
	private darkHighlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
	private lightTheme: BundledTheme | null = null;
	private darkTheme: BundledTheme | null = null;
	private readonly loadedLanguages: Set<BundledLanguage> = new Set();
	private initializationPromise: Promise<void> | null = null;

	private isLanguageSupported(language: string): language is BundledLanguage {
		return Object.hasOwn(bundledLanguages, language);
	}

	private getFallbackLanguage(): SpecialLanguage {
		return 'text';
	}

	private async ensureHighlightersInitialized(
		themes: [BundledTheme, BundledTheme],
		language: BundledLanguage
	): Promise<void> {
		const [lightTheme, darkTheme] = themes;
		const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

		// Check if we need to recreate highlighters due to theme change
		const needsLightRecreation = !this.lightHighlighter || this.lightTheme !== lightTheme;
		const needsDarkRecreation = !this.darkHighlighter || this.darkTheme !== darkTheme;

		if (needsLightRecreation || needsDarkRecreation) {
			// If themes changed, reset loaded languages
			this.loadedLanguages.clear();
		}

		// Check if we need to load the language
		const isLanguageSupported = this.isLanguageSupported(language);
		const needsLanguageLoad = !this.loadedLanguages.has(language) && isLanguageSupported;

		// Create or recreate light highlighter if needed
		if (needsLightRecreation) {
			this.lightHighlighter = await createHighlighter({
				themes: [lightTheme],
				langs: isLanguageSupported ? [language] : [],
				engine: jsEngine
			});
			this.lightTheme = lightTheme;
			if (isLanguageSupported) {
				this.loadedLanguages.add(language);
			}
		} else if (needsLanguageLoad) {
			// Load the language if not already loaded
			await this.lightHighlighter?.loadLanguage(language);
		}

		// Create or recreate dark highlighter if needed
		if (needsDarkRecreation) {
			// If recreating dark highlighter, load all previously loaded languages plus the new one
			const langsToLoad = needsLanguageLoad
				? [...this.loadedLanguages].concat(isLanguageSupported ? [language] : [])
				: Array.from(this.loadedLanguages);

			this.darkHighlighter = await createHighlighter({
				themes: [darkTheme],
				langs: langsToLoad.length > 0 ? langsToLoad : isLanguageSupported ? [language] : [],
				engine: jsEngine
			});
			this.darkTheme = darkTheme;
		} else if (needsLanguageLoad) {
			// Load the language if not already loaded
			await this.darkHighlighter?.loadLanguage(language);
		}

		// Mark language as loaded after both highlighters have it
		if (needsLanguageLoad) {
			this.loadedLanguages.add(language);
		}
	}

	async highlightCode(
		code: string,
		language: BundledLanguage,
		themes: [BundledTheme, BundledTheme],
		preClass?: string
	): Promise<[string, string]> {
		// Ensure only one initialization happens at a time
		if (this.initializationPromise) {
			await this.initializationPromise;
		}

		// Initialize or load language
		this.initializationPromise = this.ensureHighlightersInitialized(themes, language);
		await this.initializationPromise;
		this.initializationPromise = null;

		const addPreClass = (html: string) => {
			if (!preClass) {
				return html;
			}
			return html.replace(PRE_TAG_REGEX, `<pre class="${preClass}"$1`);
		};

		const [lightTheme, darkTheme] = themes;

		const lang = this.isLanguageSupported(language) ? language : this.getFallbackLanguage();

		const light = this.lightHighlighter?.codeToHtml(code, {
			lang,
			theme: lightTheme
		});
		const dark = this.darkHighlighter?.codeToHtml(code, {
			lang,
			theme: darkTheme
		});

		// Ensure we have valid HTML strings before processing
		if (!light || !dark) {
			throw new Error('Failed to generate syntax highlighting');
		}

		// Insert optional pre class, sanitize the HTML produced by Shiki, then remove inline pre background styles
		const safeLight = DOMPurify.sanitize(addPreClass(light));
		const safeDark = DOMPurify.sanitize(addPreClass(dark));

		return [removePreBackground(safeLight), removePreBackground(safeDark)];
	}
}

// Create a singleton instance of the highlighter manager
const highlighterManager = new HighlighterManager();

export async function highlightCode(
	code: string,
	language: BundledLanguage,
	themes: [BundledTheme, BundledTheme],
	preClass?: string
) {
	return highlighterManager.highlightCode(code, language, themes, preClass);
}

// Remove background styles from <pre> tags (inline style)
function removePreBackground(html: string) {
	return html.replace(/(<pre[^>]*)(style="[^"]*background[^";]*;?[^"]*")([^>]*>)/g, '$1$3');
}

export const languageExtensionMap: Record<BundledLanguage, string> = {
	'1c': '1c',
	'1c-query': '1cq',
	abap: 'abap',
	'actionscript-3': 'as',
	ada: 'ada',
	adoc: 'adoc',
	'angular-html': 'html',
	'angular-ts': 'ts',
	apache: 'conf',
	apex: 'cls',
	apl: 'apl',
	applescript: 'applescript',
	ara: 'ara',
	asciidoc: 'adoc',
	asm: 'asm',
	astro: 'astro',
	awk: 'awk',
	ballerina: 'bal',
	bash: 'sh',
	bat: 'bat',
	batch: 'bat',
	be: 'be',
	beancount: 'beancount',
	berry: 'berry',
	bibtex: 'bib',
	bicep: 'bicep',
	blade: 'blade.php',
	bsl: 'bsl',
	c: 'c',
	'c#': 'cs',
	'c++': 'cpp',
	cadence: 'cdc',
	cairo: 'cairo',
	cdc: 'cdc',
	clarity: 'clar',
	clj: 'clj',
	clojure: 'clj',
	'closure-templates': 'soy',
	cmake: 'cmake',
	cmd: 'cmd',
	cobol: 'cob',
	codeowners: 'CODEOWNERS',
	codeql: 'ql',
	coffee: 'coffee',
	coffeescript: 'coffee',
	'common-lisp': 'lisp',
	console: 'sh',
	coq: 'v',
	cpp: 'cpp',
	cql: 'cql',
	crystal: 'cr',
	cs: 'cs',
	csharp: 'cs',
	css: 'css',
	csv: 'csv',
	cue: 'cue',
	cypher: 'cql',
	d: 'd',
	dart: 'dart',
	dax: 'dax',
	desktop: 'desktop',
	diff: 'diff',
	docker: 'dockerfile',
	dockerfile: 'dockerfile',
	dotenv: 'env',
	'dream-maker': 'dm',
	edge: 'edge',
	elisp: 'el',
	elixir: 'ex',
	elm: 'elm',
	'emacs-lisp': 'el',
	erb: 'erb',
	erl: 'erl',
	erlang: 'erl',
	f: 'f',
	'f#': 'fs',
	f03: 'f03',
	f08: 'f08',
	f18: 'f18',
	f77: 'f77',
	f90: 'f90',
	f95: 'f95',
	fennel: 'fnl',
	fish: 'fish',
	fluent: 'ftl',
	for: 'for',
	'fortran-fixed-form': 'f',
	'fortran-free-form': 'f90',
	fs: 'fs',
	fsharp: 'fs',
	fsl: 'fsl',
	ftl: 'ftl',
	gdresource: 'tres',
	gdscript: 'gd',
	gdshader: 'gdshader',
	genie: 'gs',
	gherkin: 'feature',
	'git-commit': 'gitcommit',
	'git-rebase': 'gitrebase',
	gjs: 'js',
	gleam: 'gleam',
	'glimmer-js': 'js',
	'glimmer-ts': 'ts',
	glsl: 'glsl',
	gnuplot: 'plt',
	go: 'go',
	gql: 'gql',
	graphql: 'graphql',
	groovy: 'groovy',
	gts: 'gts',
	hack: 'hack',
	haml: 'haml',
	handlebars: 'hbs',
	haskell: 'hs',
	haxe: 'hx',
	hbs: 'hbs',
	hcl: 'hcl',
	hjson: 'hjson',
	hlsl: 'hlsl',
	hs: 'hs',
	html: 'html',
	'html-derivative': 'html',
	http: 'http',
	hxml: 'hxml',
	hy: 'hy',
	imba: 'imba',
	ini: 'ini',
	jade: 'jade',
	java: 'java',
	javascript: 'js',
	jinja: 'jinja',
	jison: 'jison',
	jl: 'jl',
	js: 'js',
	json: 'json',
	json5: 'json5',
	jsonc: 'jsonc',
	jsonl: 'jsonl',
	jsonnet: 'jsonnet',
	jssm: 'jssm',
	jsx: 'jsx',
	julia: 'jl',
	kotlin: 'kt',
	kql: 'kql',
	kt: 'kt',
	kts: 'kts',
	kusto: 'kql',
	latex: 'tex',
	lean: 'lean',
	lean4: 'lean',
	less: 'less',
	liquid: 'liquid',
	lisp: 'lisp',
	lit: 'lit',
	llvm: 'll',
	log: 'log',
	logo: 'logo',
	lua: 'lua',
	luau: 'luau',
	make: 'mak',
	makefile: 'mak',
	markdown: 'md',
	marko: 'marko',
	matlab: 'm',
	md: 'md',
	mdc: 'mdc',
	mdx: 'mdx',
	mediawiki: 'wiki',
	mermaid: 'mmd',
	mips: 's',
	mipsasm: 's',
	mmd: 'mmd',
	mojo: 'mojo',
	move: 'move',
	nar: 'nar',
	narrat: 'narrat',
	nextflow: 'nf',
	nf: 'nf',
	nginx: 'conf',
	nim: 'nim',
	nix: 'nix',
	nu: 'nu',
	nushell: 'nu',
	objc: 'm',
	'objective-c': 'm',
	'objective-cpp': 'mm',
	ocaml: 'ml',
	pascal: 'pas',
	perl: 'pl',
	perl6: 'p6',
	php: 'php',
	plsql: 'pls',
	po: 'po',
	polar: 'polar',
	postcss: 'pcss',
	pot: 'pot',
	potx: 'potx',
	powerquery: 'pq',
	powershell: 'ps1',
	prisma: 'prisma',
	prolog: 'pl',
	properties: 'properties',
	proto: 'proto',
	protobuf: 'proto',
	ps: 'ps',
	ps1: 'ps1',
	pug: 'pug',
	puppet: 'pp',
	purescript: 'purs',
	py: 'py',
	python: 'py',
	ql: 'ql',
	qml: 'qml',
	qmldir: 'qmldir',
	qss: 'qss',
	r: 'r',
	racket: 'rkt',
	raku: 'raku',
	razor: 'cshtml',
	rb: 'rb',
	reg: 'reg',
	regex: 'regex',
	regexp: 'regexp',
	rel: 'rel',
	riscv: 's',
	rs: 'rs',
	rst: 'rst',
	ruby: 'rb',
	rust: 'rs',
	sas: 'sas',
	sass: 'sass',
	scala: 'scala',
	scheme: 'scm',
	scss: 'scss',
	sdbl: 'sdbl',
	sh: 'sh',
	shader: 'shader',
	shaderlab: 'shader',
	shell: 'sh',
	shellscript: 'sh',
	shellsession: 'sh',
	smalltalk: 'st',
	solidity: 'sol',
	soy: 'soy',
	sparql: 'rq',
	spl: 'spl',
	splunk: 'spl',
	sql: 'sql',
	'ssh-config': 'config',
	stata: 'do',
	styl: 'styl',
	stylus: 'styl',
	svelte: 'svelte',
	swift: 'swift',
	'system-verilog': 'sv',
	systemd: 'service',
	talon: 'talon',
	talonscript: 'talon',
	tasl: 'tasl',
	tcl: 'tcl',
	templ: 'templ',
	terraform: 'tf',
	tex: 'tex',
	tf: 'tf',
	tfvars: 'tfvars',
	toml: 'toml',
	ts: 'ts',
	'ts-tags': 'ts',
	tsp: 'tsp',
	tsv: 'tsv',
	tsx: 'tsx',
	turtle: 'ttl',
	twig: 'twig',
	typ: 'typ',
	typescript: 'ts',
	typespec: 'tsp',
	typst: 'typ',
	v: 'v',
	vala: 'vala',
	vb: 'vb',
	verilog: 'v',
	vhdl: 'vhdl',
	vim: 'vim',
	viml: 'vim',
	vimscript: 'vim',
	vue: 'vue',
	'vue-html': 'html',
	'vue-vine': 'vine',
	vy: 'vy',
	vyper: 'vy',
	wasm: 'wasm',
	wenyan: 'wy',
	wgsl: 'wgsl',
	wiki: 'wiki',
	wikitext: 'wiki',
	wit: 'wit',
	wl: 'wl',
	wolfram: 'wl',
	xml: 'xml',
	xsl: 'xsl',
	yaml: 'yaml',
	yml: 'yml',
	zenscript: 'zs',
	zig: 'zig',
	zsh: 'zsh',
	文言: 'wy'
};
