<script lang="ts">
	import { Activity, Zap, Cpu, Users } from '@lucide/svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	let concurrency = $state(40); // 1 to 200 users
	let activeTab = $state<'throughput' | 'latency' | 'judge'>('throughput');

	// Model & Framework metrics calculation based on concurrency
	const flaskLatencyMs = $derived.by(() => {
		// Flask WSGI threadpool starts choking when concurrency > 16 workers
		if (concurrency <= 16) {
			return 210 + concurrency * 8;
		}
		return 350 + Math.pow(concurrency - 16, 1.45) * 14;
	});

	const litestarLatencyMs = $derived.by(() => {
		// Litestar ASGI handles non-blocking event loop smoothly
		return 165 + concurrency * 2.8;
	});

	const flaskThroughputTokSec = $derived.by(() => {
		const base = 48;
		if (concurrency <= 16) {
			return Math.min(220, base * (concurrency / 2.5));
		}
		// Saturated threadpool starts dropping throughput due to OS context switching
		return Math.max(90, 240 - (concurrency - 16) * 1.8);
	});

	const litestarThroughputTokSec = $derived.by(() => {
		// Litestar scales linearly with async I/O
		return Math.min(880, 52 + concurrency * 4.4);
	});

	const judgeScores = [
		{
			category: 'Deterministic Schema Validity',
			gpt4o: 99.8,
			gpt4oMini: 98.4,
			legacyBaseline: 74.2
		},
		{
			category: 'RAG Groundedness & Factual Recall',
			gpt4o: 94.2,
			gpt4oMini: 91.0,
			legacyBaseline: 62.5
		},
		{
			category: 'Tool Call Argument Precision',
			gpt4o: 98.6,
			gpt4oMini: 96.1,
			legacyBaseline: 68.0
		},
		{
			category: 'Safety & Hallucination Resistance',
			gpt4o: 97.4,
			gpt4oMini: 93.8,
			legacyBaseline: 58.2
		}
	];
</script>

<div
	class="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl {className}"
>
	<!-- Top Bar -->
	<div
		class="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 md:flex-row md:items-center md:justify-between"
	>
		<div>
			<div class="flex items-center gap-2">
				<Activity class="h-5 w-5 text-cyan-400" />
				<h3 class="text-base font-semibold text-zinc-100">
					Interactive AI Backend Benchmarks & Evals
				</h3>
			</div>
			<p class="mt-1 text-xs text-zinc-400">
				Live concurrency load simulation comparing Flask WSGI vs Litestar ASGI, streaming latency,
				and LLM-as-a-Judge quality rubrics.
			</p>
		</div>

		<!-- Tab Navigation -->
		<div class="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 text-xs">
			<button
				type="button"
				onclick={() => (activeTab = 'throughput')}
				class="rounded-lg px-3 py-1.5 font-medium transition-colors {activeTab === 'throughput'
					? 'bg-cyan-600 text-white shadow'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				Throughput & Load
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'latency')}
				class="rounded-lg px-3 py-1.5 font-medium transition-colors {activeTab === 'latency'
					? 'bg-cyan-600 text-white shadow'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				TTFT & Latency
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'judge')}
				class="rounded-lg px-3 py-1.5 font-medium transition-colors {activeTab === 'judge'
					? 'bg-cyan-600 text-white shadow'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				LLM-as-a-Judge
			</button>
		</div>
	</div>

	<!-- Interactive Concurrency Slider -->
	<div class="my-6 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
			<div class="flex items-center gap-2.5">
				<Users class="h-4 w-4 text-cyan-400" />
				<div>
					<span class="text-xs font-semibold text-zinc-200">Concurrent Streaming Users:</span>
					<span class="ml-2 font-mono text-xs font-bold text-cyan-400"
						>{concurrency} concurrent requests</span
					>
				</div>
			</div>
			<input
				type="range"
				min="1"
				max="150"
				step="1"
				bind:value={concurrency}
				class="w-full accent-cyan-500 sm:w-64"
			/>
		</div>
		<p class="mt-2 text-[11px] text-zinc-500">
			Drag to simulate cluster traffic. Observe how Flask's synchronous threadpool exhausts workers,
			causing queueing latency to spike non-linearly.
		</p>
	</div>

	{#if activeTab === 'throughput'}
		<!-- Throughput Chart (Bar comparison) -->
		<div class="space-y-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- Litestar Card -->
				<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wider text-emerald-400 uppercase"
							>Litestar 2.24 (ASGI)</span
						>
						<Zap class="h-4 w-4 text-emerald-400" />
					</div>
					<div class="mt-3 flex items-baseline gap-2">
						<span class="font-mono text-2xl font-bold text-zinc-100"
							>{Math.round(litestarThroughputTokSec)}</span
						>
						<span class="text-xs text-zinc-400">tokens / sec aggregate</span>
					</div>
					<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
						<div
							class="h-full rounded-full bg-emerald-400 transition-all duration-200"
							style="width: {Math.min(100, (litestarThroughputTokSec / 880) * 100)}%"
						></div>
					</div>
					<p class="mt-2 text-[11px] text-zinc-400">
						Non-blocking async event loop yields between token chunks. Zero worker exhaustion.
					</p>
				</div>

				<!-- Flask Card -->
				<div class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wider text-amber-400 uppercase"
							>Flask 3.x (WSGI Threadpool)</span
						>
						<Cpu class="h-4 w-4 text-amber-400" />
					</div>
					<div class="mt-3 flex items-baseline gap-2">
						<span class="font-mono text-2xl font-bold text-zinc-100"
							>{Math.round(flaskThroughputTokSec)}</span
						>
						<span class="text-xs text-zinc-400">tokens / sec aggregate</span>
					</div>
					<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
						<div
							class="h-full rounded-full bg-amber-400 transition-all duration-200"
							style="width: {Math.min(100, (flaskThroughputTokSec / 880) * 100)}%"
						></div>
					</div>
					<p class="mt-2 text-[11px] text-zinc-400">
						{#if concurrency > 16}
							<span class="font-semibold text-amber-400">Worker Starvation:</span> 16 OS threads saturated
							with long-running SSE streams.
						{:else}
							Operating normally within 16 worker thread capacity.
						{/if}
					</p>
				</div>
			</div>
		</div>
	{:else if activeTab === 'latency'}
		<!-- Latency Comparison -->
		<div class="space-y-4">
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
				<h4 class="mb-4 text-xs font-semibold tracking-wider text-zinc-200 uppercase">
					Time To First Token (TTFT) Under Concurrency ({concurrency} users)
				</h4>

				<!-- Litestar Bar -->
				<div class="mb-4">
					<div class="mb-1.5 flex justify-between font-mono text-xs">
						<span class="font-semibold text-emerald-400">Litestar 2.24 (ASGI)</span>
						<span class="text-zinc-200">{Math.round(litestarLatencyMs)} ms</span>
					</div>
					<div class="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
						<div
							class="h-full rounded-full bg-emerald-400 transition-all duration-200"
							style="width: {Math.min(100, (litestarLatencyMs / 2000) * 100)}%"
						></div>
					</div>
				</div>

				<!-- Flask Bar -->
				<div>
					<div class="mb-1.5 flex justify-between font-mono text-xs">
						<span class="font-semibold text-amber-400">Flask 3.x (WSGI)</span>
						<span class="text-zinc-200">{Math.round(flaskLatencyMs)} ms</span>
					</div>
					<div class="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
						<div
							class="h-full rounded-full bg-amber-400 transition-all duration-200"
							style="width: {Math.min(100, (flaskLatencyMs / 2000) * 100)}%"
						></div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- LLM-as-a-Judge Table -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs text-zinc-300">
				<thead
					class="border-b border-zinc-800 font-mono text-[11px] tracking-wider text-zinc-500 uppercase"
				>
					<tr>
						<th class="px-3 py-2.5">Evaluation Rubric</th>
						<th class="px-3 py-2.5 text-cyan-400">GPT-4o (Judge)</th>
						<th class="px-3 py-2.5 text-emerald-400">GPT-4o-Mini</th>
						<th class="px-3 py-2.5 text-zinc-500">Untyped Prototype</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-800/60 font-mono">
					{#each judgeScores as item (item.category)}
						<tr>
							<td class="px-3 py-3 font-sans font-medium text-zinc-200">{item.category}</td>
							<td class="px-3 py-3 font-bold text-cyan-300">{item.gpt4o}%</td>
							<td class="px-3 py-3 font-bold text-emerald-300">{item.gpt4oMini}%</td>
							<td class="px-3 py-3 text-zinc-500">{item.legacyBaseline}%</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
