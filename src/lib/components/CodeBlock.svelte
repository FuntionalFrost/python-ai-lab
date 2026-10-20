<script lang="ts">
	import Prism from 'prismjs';
	import 'prismjs/components/prism-python.js';
	import 'prismjs/components/prism-bash.js';
	import 'prismjs/components/prism-json.js';
	import 'prismjs/components/prism-typescript.js';
	import 'prismjs/components/prism-ini.js';
	import { Check, Copy, Terminal, FileCode } from '@lucide/svelte';
	import { useClipboard } from 'yaxa-svelte';

	interface Props {
		code: string;
		language?: string;
		title?: string;
		showLineNumbers?: boolean;
		highlightLines?: number[];
		class?: string;
	}

	let {
		code = '',
		language = 'python',
		title = '',
		showLineNumbers = true,
		highlightLines = [],
		class: className = ''
	}: Props = $props();

	const clipboard = useClipboard({ timeout: 2000 });

	const highlightedHtml = $derived.by(() => {
		const lang = language.toLowerCase();
		const grammar = Prism.languages[lang] || Prism.languages.python || Prism.languages.plain;
		const cleanCode = code.trim();
		try {
			return Prism.highlight(cleanCode, grammar, lang);
		} catch {
			return cleanCode;
		}
	});

	const lines = $derived.by(() => {
		return code.trim().split('\n');
	});
</script>

<div class="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl {className}">
	<!-- Header Bar -->
	<div
		class="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/70 px-4 py-2.5 text-xs text-zinc-400"
	>
		<div class="flex items-center gap-2">
			{#if language === 'bash' || language === 'sh'}
				<Terminal class="h-3.5 w-3.5 text-emerald-400" />
			{:else}
				<FileCode class="h-3.5 w-3.5 text-cyan-400" />
			{/if}
			<span class="font-mono font-medium text-zinc-200">
				{title || (language === 'bash' ? 'Terminal' : `${language.toUpperCase()} Snippet`)}
			</span>
			<span
				class="rounded bg-zinc-800/70 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 uppercase"
			>
				{language}
			</span>
		</div>

		<button
			type="button"
			onclick={() => clipboard.copy(code.trim())}
			class="flex items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
			aria-label="Copy code to clipboard"
		>
			{#if clipboard.copied}
				<Check class="h-3.5 w-3.5 text-emerald-400" />
				<span class="text-emerald-400">Copied</span>
			{:else}
				<Copy class="h-3.5 w-3.5 text-zinc-400" />
				<span>Copy</span>
			{/if}
		</button>
	</div>

	<!-- Code Area -->
	<div class="relative overflow-x-auto font-mono text-xs leading-relaxed">
		{#if showLineNumbers}
			<div class="flex min-w-full">
				<!-- Line Numbers Gutter -->
				<div
					class="sticky left-0 z-10 border-r border-zinc-800/60 bg-zinc-950 py-3 text-right text-zinc-600 select-none"
					aria-hidden="true"
				>
					{#each lines as _line, i (i)}
						{@const lineNum = i + 1}
						{@const isHighlighted = highlightLines.includes(lineNum)}
						<div
							class="px-3 {isHighlighted
								? 'bg-cyan-500/10 font-bold text-cyan-400'
								: 'text-zinc-600'}"
						>
							{lineNum}
						</div>
					{/each}
				</div>

				<!-- Code Content -->
				<pre class="flex-1 p-3 text-zinc-200"><code class="language-{language}"
						>{@html highlightedHtml}</code
					></pre>
			</div>
		{:else}
			<pre class="p-3 text-zinc-200"><code class="language-{language}">{@html highlightedHtml}</code
				></pre>
		{/if}
	</div>
</div>

<style>
	:global(.token.comment),
	:global(.token.prolog),
	:global(.token.doctype),
	:global(.token.cdata) {
		color: #71717a;
		font-style: italic;
	}

	:global(.token.punctuation) {
		color: #a1a1aa;
	}

	:global(.token.property),
	:global(.token.tag),
	:global(.token.boolean),
	:global(.token.number),
	:global(.token.constant),
	:global(.token.symbol),
	:global(.token.deleted) {
		color: #f87171;
	}

	:global(.token.selector),
	:global(.token.attr-name),
	:global(.token.string),
	:global(.token.char),
	:global(.token.builtin),
	:global(.token.inserted) {
		color: #34d399;
	}

	:global(.token.operator),
	:global(.token.entity),
	:global(.token.url),
	:global(.language-css .token.string),
	:global(.style .token.string) {
		color: #38bdf8;
	}

	:global(.token.atrule),
	:global(.token.attr-value),
	:global(.token.keyword) {
		color: #c084fc;
		font-weight: 600;
	}

	:global(.token.function),
	:global(.token.class-name) {
		color: #67e8f9;
	}

	:global(.token.regex),
	:global(.token.important),
	:global(.token.variable) {
		color: #fbbf24;
	}

	:global(.token.decorator) {
		color: #f472b6;
	}
</style>
