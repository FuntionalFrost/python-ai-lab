<script lang="ts">
	import { ALL_TRACKS } from '#lib/data/curriculum/index';
	import {
		Terminal,
		Sparkles,
		Layers,
		ArrowRight,
		Bot,
		Activity,
		ShieldCheck,
		Clock
	} from '@lucide/svelte';
</script>

<div class="space-y-12">
	<!-- Hero Section -->
	<section
		class="relative overflow-hidden rounded-3xl border border-zinc-800 bg-linear-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 p-8 shadow-2xl md:p-12"
	>
		<div class="relative z-10 max-w-3xl space-y-6">
			<div
				class="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400"
			>
				<Sparkles class="h-3.5 w-3.5" />
				<span>Rapid Prototyping & Testing Lab for Python AI</span>
			</div>

			<h1 class="text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
				Rapid Prototyping & Testing <br />
				<span
					class="bg-linear-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent"
				>
					for Python AI Backends
				</span>
			</h1>

			<p class="text-sm leading-relaxed text-zinc-300 sm:text-base">
				Build, test, and iterate rapidly on AI prototypes. Master fast prototyping with
				<strong class="font-semibold text-white">Flask 3.x</strong>,
				<strong class="font-semibold text-white">Litestar</strong>, and
				<strong class="font-semibold text-white">htmx</strong>, modern async networking with
				<strong class="font-semibold text-white">HTTPX</strong> and
				<strong class="font-semibold text-white">OpenAI</strong>, instant schema validation with
				<strong class="font-semibold text-white">Pydantic v2</strong>, real-time streaming
				playgrounds, and deterministic test harnesses using
				<strong class="font-semibold text-white">pytest-mock</strong>
				and
				<strong class="font-semibold text-white">uv</strong>.
			</p>

			<!-- Hero CTAs -->
			<div class="flex flex-wrap items-center gap-3 pt-2">
				<a
					href="/module/01-frameworks-mvc"
					class="flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-xs font-semibold text-zinc-950 shadow-lg shadow-cyan-500/20 transition-all hover:opacity-95 sm:text-sm"
				>
					<span>Start Track 1: Modern Flask Architecture</span>
					<ArrowRight class="h-4 w-4" />
				</a>

				<a
					href="/playground/chat"
					class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3 text-xs font-semibold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 sm:text-sm"
				>
					<Bot class="h-4 w-4 text-cyan-400" />
					<span>Streaming Playground</span>
				</a>

				<a
					href="/benchmarks"
					class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3 text-xs font-semibold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 sm:text-sm"
				>
					<Activity class="h-4 w-4 text-emerald-400" />
					<span>Eval Benchmarks</span>
				</a>
			</div>
		</div>

		<!-- Subtle Background Glow -->
		<div
			class="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
		></div>
	</section>

	<!-- Quick Stats Row -->
	<section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between text-zinc-400">
				<span class="text-xs font-medium">Curriculum Tracks</span>
				<Layers class="h-4 w-4 text-cyan-400" />
			</div>
			<div class="mt-2 font-mono text-2xl font-bold text-zinc-100">{ALL_TRACKS.length} Tracks</div>
			<p class="mt-1 text-[11px] text-zinc-500">From Flask & HTTPX to htmx & Litestar</p>
		</div>

		<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between text-zinc-400">
				<span class="text-xs font-medium">Runnable Code</span>
				<Terminal class="h-4 w-4 text-emerald-400" />
			</div>
			<div class="mt-2 font-mono text-2xl font-bold text-zinc-100">100% Tested</div>
			<p class="mt-1 text-[11px] text-zinc-500">Python 3.13+ verified with uv</p>
		</div>

		<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
			<div class="flex items-center justify-between text-zinc-400">
				<span class="text-xs font-medium">Quality Gate</span>
				<ShieldCheck class="h-4 w-4 text-cyan-400" />
			</div>
			<div class="mt-2 font-mono text-2xl font-bold text-zinc-100">&ge; 90% Cov</div>
			<p class="mt-1 text-[11px] text-zinc-500">pytest-cov enforced coverage</p>
		</div>
	</section>

	<!-- Curriculum Tracks Grid -->
	<section class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-zinc-100">Curriculum Roadmap</h2>
				<p class="text-xs text-zinc-400">
					Select any module to inspect architecture patterns, code comparisons, and simulated pytest
					suites.
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			{#each ALL_TRACKS as track (track.id)}
				<div
					class="group flex min-w-0 flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
				>
					<div class="space-y-4">
						<!-- Card Header -->
						<div class="flex items-start justify-between gap-3">
							<div class="flex items-center gap-2.5">
								<span
									class="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 font-mono text-xs font-bold text-cyan-400"
								>
									{track.trackNumber}
								</span>
								<span class="font-mono text-xs font-medium text-zinc-400">
									Track {track.trackNumber}
								</span>
							</div>

							<div class="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
								<Clock class="h-3.5 w-3.5 text-zinc-500" />
								<span>{track.estimatedMinutes} min</span>
							</div>
						</div>

						<!-- Title & Subtitle -->
						<div>
							<h3 class="text-base font-bold text-zinc-100 group-hover:text-cyan-300">
								{track.title}
							</h3>
							<p class="mt-1 text-xs text-zinc-400">
								{track.subtitle}
							</p>
						</div>

						<!-- Summary -->
						<p class="line-clamp-2 text-xs leading-relaxed text-zinc-400">
							{track.summary}
						</p>

						<!-- Framework Badges -->
						<div class="flex flex-wrap gap-1.5 pt-1">
							{#each track.frameworks as fw (fw)}
								<span
									class="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-300"
								>
									{fw}
								</span>
							{/each}
						</div>
					</div>

					<!-- Card Footer Action -->
					<div class="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
						<span class="font-mono text-xs text-zinc-500"
							>{track.testSuite.coverage.total.cover} Cov</span
						>

						<a
							href="/module/{track.slug}"
							class="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-cyan-600 hover:text-white"
						>
							<span>Explore Module</span>
							<ArrowRight class="h-3.5 w-3.5" />
						</a>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
