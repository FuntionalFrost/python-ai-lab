<script lang="ts">
	import { page } from '$app/state';
	import { Home, Bot, Activity, Search } from '@lucide/svelte';
	import BrandLogo from '#lib/components/BrandLogo.svelte';
	import { Kbd } from 'yaxa-svelte';
</script>

<svelte:head>
	<title>{page.status} · {page.status === 404 ? 'Page Not Found' : 'Error'} - Python AI Lab</title>
</svelte:head>

<div class="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
	<!-- Brand Flask Emblem with Error Badge -->
	<div class="relative mb-6">
		<div
			class="flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 shadow-2xl shadow-cyan-950/30"
		>
			<BrandLogo class="h-full w-full" />
		</div>
		<span
			class="absolute -top-2 -right-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-400"
		>
			{page.status || 404}
		</span>
	</div>

	<!-- Status & Heading -->
	<h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
		{page.status === 404 ? 'Module or Page Not Found' : 'An Unexpected Error Occurred'}
	</h1>

	<!-- Descriptive Subtitle -->
	<p class="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
		{page.error?.message ||
			'The requested curriculum track or endpoint does not exist, was moved, or failed to render.'}
	</p>

	<!-- Primary Recovery Actions -->
	<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
		<a
			href="/"
			class="flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-cyan-500/20 transition-all hover:opacity-95 sm:text-sm"
		>
			<Home class="h-4 w-4" />
			<span>Curriculum Roadmap</span>
		</a>

		<a
			href="/playground/chat"
			class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white sm:text-sm"
		>
			<Bot class="h-4 w-4 text-cyan-400" />
			<span>Chat Playground</span>
		</a>

		<a
			href="/benchmarks"
			class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white sm:text-sm"
		>
			<Activity class="h-4 w-4 text-emerald-400" />
			<span>Telemetry & Evals</span>
		</a>
	</div>

	<!-- Command Palette Search Shortcut Hint -->
	<div
		class="mt-10 flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5 text-xs text-zinc-400"
	>
		<Search class="h-3.5 w-3.5 text-zinc-500" />
		<span>Press</span>
		<Kbd combo={['meta', 'k']} size="xs" />
		<span>to search all 10 production modules</span>
	</div>
</div>
