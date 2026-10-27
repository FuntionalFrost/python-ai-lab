<script lang="ts">
	import { Check, Copy, Terminal, FileCode } from '@lucide/svelte';
	import { useClipboard, tokenizeCode } from 'yaxa-svelte';

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

	const resolvedLang = $derived(language.toLowerCase() === 'ini' ? 'env' : language.toLowerCase());
	const tokenizedLines = $derived(tokenizeCode(code.trim(), resolvedLang));
</script>

{#snippet renderLine(lineTokens: ReturnType<typeof tokenizeCode>[number], lineNum: number)}
	{@const isHighlighted = highlightLines.includes(lineNum)}
	<div class="px-3 {isHighlighted ? 'bg-cyan-500/10' : ''}">
		{#if lineTokens.length === 0 || lineTokens.every((t) => !t.text)}
			<span>&#8203;</span>
		{:else}
			{#each lineTokens as token, tokenIdx (tokenIdx)}
				{#if token.type === 'rune'}
					<span class="font-bold text-amber-400">{token.text}</span>
				{:else if token.type === 'keyword'}
					<span class="font-semibold text-purple-400">{token.text}</span>
				{:else if token.type === 'decorator'}
					<span class="text-pink-400">{token.text}</span>
				{:else if token.type === 'string'}
					<span class="text-emerald-400">{token.text}</span>
				{:else if token.type === 'comment'}
					<span class="text-zinc-500 italic">{token.text}</span>
				{:else if token.type === 'function'}
					<span class="text-cyan-400">{token.text}</span>
				{:else if token.type === 'tag'}
					<span class="font-semibold text-rose-400">{token.text}</span>
				{:else if token.type === 'attr'}
					<span class="text-amber-300">{token.text}</span>
				{:else if token.type === 'directive'}
					<span class="text-amber-400">{token.text}</span>
				{:else if token.type === 'number'}
					<span class="text-purple-400">{token.text}</span>
				{:else if token.type === 'macro'}
					<span class="font-semibold text-indigo-400">{token.text}</span>
				{:else if token.type === 'punctuation'}
					<span class="text-zinc-400">{token.text}</span>
				{:else}
					<span class="text-zinc-200">{token.text}</span>
				{/if}
			{/each}
		{/if}
	</div>
{/snippet}

<div class="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl {className}">
	<!-- Header Bar -->
	<div
		class="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-900/70 px-4 py-2.5 text-xs text-zinc-400"
	>
		<div class="flex min-w-0 items-center gap-2">
			{#if language === 'bash' || language === 'sh'}
				<Terminal class="h-3.5 w-3.5 shrink-0 text-emerald-400" />
			{:else}
				<FileCode class="h-3.5 w-3.5 shrink-0 text-cyan-400" />
			{/if}
			<div class="min-w-0 font-mono font-medium text-zinc-200">
				<span
					>{title || (language === 'bash' ? 'Terminal' : `${language.toUpperCase()} Snippet`)}</span
				>
				<span
					class="ml-1.5 inline-flex items-center rounded bg-zinc-800/70 px-1.5 py-0.5 align-middle font-mono text-[10px] whitespace-nowrap text-zinc-400 uppercase"
				>
					{language}
				</span>
			</div>
		</div>

		<button
			type="button"
			onclick={() => clipboard.copy(code.trim())}
			class="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
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
					{#each tokenizedLines as _, i (i)}
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
				<pre class="flex-1 py-3 text-zinc-200"><code class="language-{language}"
						>{#each tokenizedLines as lineTokens, i (i)}{@render renderLine(
								lineTokens,
								i + 1
							)}{/each}</code
					></pre>
			</div>
		{:else}
			<pre class="py-3 text-zinc-200"><code class="language-{language}"
					>{#each tokenizedLines as lineTokens, i (i)}{@render renderLine(
							lineTokens,
							i + 1
						)}{/each}</code
				></pre>
		{/if}
	</div>
</div>
