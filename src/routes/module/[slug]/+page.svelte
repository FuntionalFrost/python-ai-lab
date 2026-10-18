<script lang="ts">
	import type { PageProps } from './$types';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import CodeComparison from '#lib/components/CodeComparison.svelte';
	import PytestRunnerModal from '#lib/components/PytestRunnerModal.svelte';
	import ToolExecutionVisualizer from '#lib/components/ToolExecutionVisualizer.svelte';
	import ChatPlayground from '#lib/components/ChatPlayground.svelte';
	import BenchmarkGraph from '#lib/components/BenchmarkGraph.svelte';
	import { ALL_TRACKS } from '#lib/data/curriculum/index';
	import {
		Terminal,
		CircleCheck,
		ArrowRight,
		ArrowLeft,
		Play,
		BookOpen,
		Sparkles,
		Layers,
		ShieldCheck
	} from '@lucide/svelte';

	let { data }: PageProps = $props();
	const track = $derived(data.track);
	const nextTrack = $derived(data.nextTrack);
	const prevTrack = $derived(data.prevTrack);

	let isPytestModalOpen = $state(false);
</script>

<div class="space-y-12">
	<!-- Top Navigation & Status Header -->
	<div
		class="flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2 font-mono text-xs text-zinc-400">
				<a href="/" class="transition-colors hover:text-cyan-400">Curriculum</a>
				<span>/</span>
				<span class="font-bold text-cyan-400">Track {track.trackNumber} of {ALL_TRACKS.length}</span
				>
			</div>
			<h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
				{track.title}
			</h1>
			<p class="text-sm text-zinc-300">
				{track.subtitle}
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<!-- Run Pytest Action Button -->
			<button
				type="button"
				onclick={() => (isPytestModalOpen = true)}
				class="flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-500 hover:to-teal-500"
			>
				<Terminal class="h-4 w-4" />
				<span>Run pytest Suite</span>
			</button>
		</div>
	</div>

	<!-- Meta Attributes Row -->
	<div
		class="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-xs md:grid-cols-4"
	>
		<div>
			<span class="block text-[10px] text-zinc-500 uppercase">Difficulty Level</span>
			<span class="mt-0.5 inline-block font-bold text-zinc-200">{track.level}</span>
		</div>
		<div>
			<span class="block text-[10px] text-zinc-500 uppercase">Estimated Duration</span>
			<span class="mt-0.5 inline-block font-bold text-zinc-200"
				>{track.estimatedMinutes} Minutes</span
			>
		</div>
		<div>
			<span class="block text-[10px] text-zinc-500 uppercase">Framework Focus</span>
			<span class="mt-0.5 inline-block truncate font-bold text-cyan-400"
				>{track.frameworks.slice(0, 2).join(', ')}</span
			>
		</div>
		<div>
			<span class="block text-[10px] text-zinc-500 uppercase">Test Suite Coverage</span>
			<span class="mt-0.5 inline-block font-bold text-emerald-400"
				>{track.testSuite.coverage.total.cover}</span
			>
		</div>
	</div>

	<!-- Objectives Checklist -->
	<section class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
		<h2 class="mb-4 flex items-center gap-2 text-base font-bold text-zinc-100">
			<ShieldCheck class="h-5 w-5 text-cyan-400" />
			<span>Key Learning Objectives</span>
		</h2>
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
			{#each track.objectives as objective (objective)}
				<div class="flex items-start gap-2.5 text-xs text-zinc-300">
					<CircleCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
					<span class="leading-relaxed">{objective}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Architecture Section -->
	<section class="space-y-6">
		<div class="border-b border-zinc-800/80 pb-3">
			<h2 class="flex items-center gap-2 text-xl font-bold text-zinc-100">
				<Layers class="h-5 w-5 text-cyan-400" />
				<span>Architecture & Design Pattern</span>
			</h2>
			<p class="mt-1 text-xs text-zinc-400">
				{track.architecture.patternName}
			</p>
		</div>

		<!-- Diagram Box -->
		{#if track.architecture.diagram}
			<div
				class="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 font-mono text-xs leading-relaxed text-cyan-300 shadow-xl"
			>
				<pre class="select-all">{track.architecture.diagram}</pre>
			</div>
		{/if}

		<!-- Architectural Explanation -->
		<div
			class="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 text-sm leading-relaxed text-zinc-300"
		>
			<p class="whitespace-pre-line">{track.architecture.explanation}</p>
		</div>

		<!-- Key Concepts Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			{#each track.architecture.keyConcepts as concept (concept.name)}
				<div class="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
					<h3 class="font-mono text-xs font-bold text-cyan-300">
						{concept.name}
					</h3>
					<p class="text-xs leading-relaxed text-zinc-400">
						{concept.description}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Side-by-side Code Comparisons -->
	{#if track.comparisons && track.comparisons.length > 0}
		<section class="space-y-6">
			<div class="border-b border-zinc-800/80 pb-3">
				<h2 class="flex items-center gap-2 text-xl font-bold text-zinc-100">
					<BookOpen class="h-5 w-5 text-emerald-400" />
					<span>Side-by-Side Code Comparisons</span>
				</h2>
				<p class="mt-1 text-xs text-zinc-400">
					Direct implementation contrasts between architectural patterns and migration stages.
				</p>
			</div>

			{#each track.comparisons as comparison (comparison.title)}
				<CodeComparison
					title={comparison.title}
					description={comparison.description}
					leftTitle={comparison.leftTitle}
					leftLanguage={comparison.leftLanguage}
					leftCode={comparison.leftCode}
					rightTitle={comparison.rightTitle}
					rightLanguage={comparison.rightLanguage}
					rightCode={comparison.rightCode}
					isPrototypeVsProduction={track.slug === '08-prototype-to-production' ||
						track.slug === '02-pydantic-settings'}
				/>
			{/each}
		</section>
	{/if}

	<!-- Embedded Interactive Component (Context-specific) -->
	{#if track.interactiveComponent === 'tool-visualizer'}
		<section class="space-y-4">
			<div class="border-b border-zinc-800/80 pb-3">
				<h2 class="flex items-center gap-2 text-xl font-bold text-zinc-100">
					<Sparkles class="h-5 w-5 text-cyan-400" />
					<span>Interactive Tool Calling Visualizer</span>
				</h2>
				<p class="mt-1 text-xs text-zinc-400">
					Step through the 5 stages of LLM tool proposal, Pydantic validation, and execution in real
					time.
				</p>
			</div>
			<ToolExecutionVisualizer />
		</section>
	{:else if track.interactiveComponent === 'chat'}
		<section class="space-y-4">
			<div class="border-b border-zinc-800/80 pb-3">
				<h2 class="flex items-center gap-2 text-xl font-bold text-zinc-100">
					<Sparkles class="h-5 w-5 text-cyan-400" />
					<span>Live SSE Streaming Playground</span>
				</h2>
				<p class="mt-1 text-xs text-zinc-400">
					Test latency simulation, inspect raw Server-Sent Event chunks, and verify payload schemas.
				</p>
			</div>
			<ChatPlayground />
		</section>
	{:else if track.interactiveComponent === 'benchmark'}
		<section class="space-y-4">
			<div class="border-b border-zinc-800/80 pb-3">
				<h2 class="flex items-center gap-2 text-xl font-bold text-zinc-100">
					<Sparkles class="h-5 w-5 text-cyan-400" />
					<span>Interactive Latency & Eval Visualizer</span>
				</h2>
				<p class="mt-1 text-xs text-zinc-400">
					Adjust concurrent client load to simulate threadpool worker saturation versus async event
					loop scaling.
				</p>
			</div>
			<BenchmarkGraph />
		</section>
	{/if}

	<!-- Reference Code Snippets -->
	<section class="space-y-6">
		<div class="border-b border-zinc-800/80 pb-3">
			<h2 class="flex items-center gap-2 text-xl font-bold text-zinc-100">
				<Terminal class="h-5 w-5 text-cyan-400" />
				<span>Production Code Implementation</span>
			</h2>
			<p class="mt-1 text-xs text-zinc-400">
				Fully typed Python 3.13+ production modules ready to drop into an enterprise service.
			</p>
		</div>

		{#each track.codeSnippets as snippet (snippet.id)}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-zinc-200">{snippet.title}</span>
					<span class="font-mono text-[11px] text-zinc-500">{snippet.filePath}</span>
				</div>
				<p class="text-xs text-zinc-400">{snippet.description}</p>
				<CodeBlock code={snippet.code} language={snippet.language} title={snippet.filePath} />
			</div>
		{/each}
	</section>

	<!-- Test Suite Details -->
	<section class="space-y-6">
		<div
			class="flex flex-col gap-3 border-b border-zinc-800/80 pb-3 sm:flex-row sm:items-center sm:justify-between"
		>
			<div>
				<h2 class="flex items-center gap-2 text-xl font-bold text-zinc-100">
					<Terminal class="h-5 w-5 text-emerald-400" />
					<span>Accompanying Test Suite (pytest + pytest-mock)</span>
				</h2>
				<p class="mt-1 text-xs text-zinc-400">
					Deterministic unit & integration tests validating domain invariants without network calls.
				</p>
			</div>

			<button
				type="button"
				onclick={() => (isPytestModalOpen = true)}
				class="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow transition-colors hover:bg-cyan-500"
			>
				<Play class="h-3.5 w-3.5 fill-white" />
				<span>Execute in Terminal</span>
			</button>
		</div>

		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold text-zinc-200">{track.testSuite.title}</span>
				<span class="font-mono text-[11px] text-zinc-500">{track.testSuite.testFilePath}</span>
			</div>
			<CodeBlock
				code={track.testSuite.testCode}
				language="python"
				title={track.testSuite.testFilePath}
			/>
		</div>
	</section>

	<!-- Footer Navigation Between Tracks -->
	<div
		class="flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-8 sm:flex-row"
	>
		{#if prevTrack}
			<a
				href="/module/{prevTrack.slug}"
				class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
			>
				<ArrowLeft class="h-4 w-4" />
				<div class="text-left">
					<span class="block font-mono text-[10px] text-zinc-500 uppercase">Previous Track</span>
					<span>{prevTrack.shortTitle}</span>
				</div>
			</a>
		{:else}
			<div></div>
		{/if}

		{#if nextTrack}
			<a
				href="/module/{nextTrack.slug}"
				class="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-cyan-500"
			>
				<div class="text-right">
					<span class="block font-mono text-[10px] text-cyan-200 uppercase">Next Track</span>
					<span>{nextTrack.shortTitle}</span>
				</div>
				<ArrowRight class="h-4 w-4" />
			</a>
		{:else}
			<a
				href="/benchmarks"
				class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-emerald-500"
			>
				<span>View Benchmarks</span>
				<ArrowRight class="h-4 w-4" />
			</a>
		{/if}
	</div>
</div>

<!-- Pytest Runner Terminal Modal -->
<PytestRunnerModal
	bind:isOpen={isPytestModalOpen}
	testSuite={track.testSuite}
	onClose={() => (isPytestModalOpen = false)}
/>
