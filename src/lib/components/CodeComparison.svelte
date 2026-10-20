<script lang="ts">
	import CodeBlock from './CodeBlock.svelte';
	import { Columns2, ShieldCheck, TriangleAlert } from '@lucide/svelte';

	interface Props {
		title: string;
		description?: string;
		leftTitle: string;
		leftLanguage?: string;
		leftCode: string;
		rightTitle: string;
		rightLanguage?: string;
		rightCode: string;
		leftBadge?: string;
		rightBadge?: string;
		isPrototypeVsProduction?: boolean;
	}

	let {
		title,
		description = '',
		leftTitle,
		leftLanguage = 'python',
		leftCode,
		rightTitle,
		rightLanguage = 'python',
		rightCode,
		leftBadge,
		rightBadge,
		isPrototypeVsProduction = false
	}: Props = $props();

	let activeMobileTab = $state<'left' | 'right'>('left');
</script>

<div class="my-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl">
	<!-- Comparison Header -->
	<div class="border-b border-zinc-800 bg-zinc-900/90 px-5 py-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<div>
				<div class="flex items-center gap-2">
					<Columns2 class="h-4 w-4 text-cyan-400" />
					<h3 class="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
						{title}
					</h3>
				</div>
				{#if description}
					<p class="mt-1 text-xs text-zinc-400">
						{description}
					</p>
				{/if}
			</div>

			<!-- Mobile Tab Switcher -->
			<div class="flex min-w-0 items-center gap-1 rounded-lg bg-zinc-800/80 p-1 md:hidden">
				<button
					type="button"
					onclick={() => (activeMobileTab = 'left')}
					class="min-w-0 flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors {activeMobileTab ===
					'left'
						? 'bg-zinc-700 text-white shadow'
						: 'text-zinc-400 hover:text-zinc-200'}"
					title={leftTitle}
				>
					<span class="block truncate">{leftTitle}</span>
				</button>
				<button
					type="button"
					onclick={() => (activeMobileTab = 'right')}
					class="min-w-0 flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors {activeMobileTab ===
					'right'
						? 'bg-zinc-700 text-white shadow'
						: 'text-zinc-400 hover:text-zinc-200'}"
					title={rightTitle}
				>
					<span class="block truncate">{rightTitle}</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Dual Pane Container -->
	<div class="grid grid-cols-1 divide-y divide-zinc-800 md:grid-cols-2 md:divide-x md:divide-y-0">
		<!-- Left Pane -->
		<div class="p-3 {activeMobileTab === 'left' ? 'block' : 'hidden md:block'}">
			<div class="mb-2 flex items-center justify-between px-1">
				<div class="flex items-center gap-2">
					{#if isPrototypeVsProduction}
						<TriangleAlert class="h-3.5 w-3.5 text-amber-400" />
					{/if}
					<span class="text-xs font-semibold text-zinc-300">{leftTitle}</span>
				</div>
				{#if leftBadge || isPrototypeVsProduction}
					<span
						class="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase {isPrototypeVsProduction
							? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
							: 'bg-zinc-800 text-zinc-400'}"
					>
						{leftBadge || 'Prototype / Legacy'}
					</span>
				{/if}
			</div>
			<CodeBlock code={leftCode} language={leftLanguage} title={leftTitle} showLineNumbers={true} />
		</div>

		<!-- Right Pane -->
		<div class="p-3 {activeMobileTab === 'right' ? 'block' : 'hidden md:block'}">
			<div class="mb-2 flex items-center justify-between px-1">
				<div class="flex items-center gap-2">
					{#if isPrototypeVsProduction}
						<ShieldCheck class="h-3.5 w-3.5 text-emerald-400" />
					{/if}
					<span class="text-xs font-semibold text-zinc-100">{rightTitle}</span>
				</div>
				{#if rightBadge || isPrototypeVsProduction}
					<span
						class="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase {isPrototypeVsProduction
							? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
							: 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-400'}"
					>
						{rightBadge || 'Production / Enterprise'}
					</span>
				{/if}
			</div>
			<CodeBlock
				code={rightCode}
				language={rightLanguage}
				title={rightTitle}
				showLineNumbers={true}
			/>
		</div>
	</div>
</div>
