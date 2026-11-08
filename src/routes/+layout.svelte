<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ALL_TRACKS } from '#lib/data/curriculum/index';
	import BrandLogo from '#lib/components/BrandLogo.svelte';
	import { CommandPalette, Kbd, type CommandItem } from 'yaxa-svelte';
	import { Bot, Activity, Search, Menu, X, Layers, Terminal } from '@lucide/svelte';

	let { children }: LayoutProps = $props();

	let isSearchOpen = $state(false);
	let isMobileSidebarOpen = $state(false);

	const commandItems = $derived.by<CommandItem[]>(() => {
		const pages: CommandItem[] = [
			{
				id: 'home',
				label: 'Curriculum Overview',
				description: `Explore all ${ALL_TRACKS.length} prototyping, testing, and iteration modules`,
				icon: Layers,
				shortcut: 'G H',
				group: 'Navigation',
				onSelect: () => goto('/')
			},
			{
				id: 'playground',
				label: 'Live Chat SSE Playground',
				description: 'Inspect streaming chunks, jitter, and tokens in real time',
				icon: Bot,
				shortcut: 'G P',
				group: 'Navigation',
				onSelect: () => goto('/playground/chat')
			},
			{
				id: 'benchmarks',
				label: 'Telemetry & Benchmarks',
				description: 'Flask WSGI vs Litestar ASGI latency and evals',
				icon: Activity,
				shortcut: 'G B',
				group: 'Navigation',
				onSelect: () => goto('/benchmarks')
			}
		];

		const tracks: CommandItem[] = ALL_TRACKS.map((t) => ({
			id: t.slug,
			label: `Track ${t.trackNumber}: ${t.title}`,
			description: `${t.estimatedMinutes} min · ${t.frameworks.slice(0, 3).join(', ')}`,
			icon: Terminal,
			shortcut: `T${t.trackNumber}`,
			group: 'Curriculum Tracks',
			onSelect: () => goto(`/module/${t.slug}`)
		}));

		return [...pages, ...tracks];
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={favicon} />
	<title>Python AI Lab — Prototyping & Testing Modern AI Backends</title>
	<meta
		name="description"
		content="An interactive lab for rapidly prototyping, testing, benchmarking, and iterating on modern Python Web & AI backend architectures (Flask, Litestar, Pydantic v2, HTTPX, htmx) with SvelteKit 3."
	/>
	<meta property="og:site_name" content="Python AI Lab" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Python AI Lab — Prototyping & Testing Modern AI Backends" />
	<meta
		property="og:description"
		content="Interactive curriculum and runnable prototype patterns for Flask, Litestar, Pydantic v2, HTTPX, htmx, SSE streaming, and deterministic pytest testing."
	/>
	<meta property="og:url" content="https://python-ai-lab.pages.dev{page.url.pathname}" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Python AI Lab — Prototyping & Testing Modern AI Backends" />
	<meta
		name="twitter:description"
		content="Interactive curriculum and runnable prototype patterns for Flask, Litestar, Pydantic v2, HTTPX, htmx, and pytest."
	/>
</svelte:head>

<div
	class="flex min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200"
>
	<!-- Mobile Sidebar Overlay Backdrop -->
	{#if isMobileSidebarOpen}
		<div
			class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
			onclick={() => (isMobileSidebarOpen = false)}
			aria-hidden="true"
		></div>
	{/if}

	<!-- Sidebar Navigation -->
	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-800/80 bg-zinc-950 transition-transform duration-300 lg:translate-x-0 {isMobileSidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<!-- Brand Header -->
		<div class="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
			<a
				href="/"
				class="flex items-center gap-2.5 font-bold tracking-tight text-white transition-opacity hover:opacity-90"
				onclick={() => (isMobileSidebarOpen = false)}
			>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-900/90 p-1 shadow-md shadow-cyan-950/40"
				>
					<BrandLogo class="h-full w-full" />
				</div>
				<div>
					<span class="text-sm font-semibold tracking-wide text-zinc-100">Python AI Lab</span>
				</div>
			</a>

			<button
				type="button"
				class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
				onclick={() => (isMobileSidebarOpen = false)}
				aria-label="Close sidebar"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Navigation Links -->
		<div class="flex-1 space-y-6 overflow-y-auto px-3 py-4">
			<!-- Platform Section -->
			<div>
				<div
					class="mb-1.5 px-2 font-mono text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
				>
					Overview
				</div>
				<nav class="space-y-0.5">
					<a
						href="/"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors {page
							.url.pathname === '/'
							? 'border border-cyan-500/20 bg-cyan-500/10 font-semibold text-cyan-400'
							: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
					>
						<Layers class="h-4 w-4" />
						<span>Curriculum Dashboard</span>
					</a>
					<a
						href="/playground/chat"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors {page
							.url.pathname === '/playground/chat'
							? 'border border-cyan-500/20 bg-cyan-500/10 font-semibold text-cyan-400'
							: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
					>
						<Bot class="h-4 w-4" />
						<span>Streaming Playground</span>
					</a>
					<a
						href="/benchmarks"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors {page
							.url.pathname === '/benchmarks'
							? 'border border-cyan-500/20 bg-cyan-500/10 font-semibold text-cyan-400'
							: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
					>
						<Activity class="h-4 w-4" />
						<span>Evaluations & Benchmarks</span>
					</a>
				</nav>
			</div>

			<!-- Tracks Section -->
			<div>
				<div
					class="mb-1.5 px-2 font-mono text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
				>
					Curriculum Tracks ({ALL_TRACKS.length})
				</div>
				<nav class="space-y-1">
					{#each ALL_TRACKS as track (track.id)}
						{@const isCurrent = page.url.pathname === `/module/${track.slug}`}
						<a
							href="/module/{track.slug}"
							onclick={() => (isMobileSidebarOpen = false)}
							class="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors {isCurrent
								? 'border border-cyan-500/20 bg-cyan-500/10 font-semibold text-cyan-300'
								: 'text-zinc-400 hover:bg-zinc-900/90 hover:text-zinc-200'}"
						>
							<div class="flex min-w-0 items-center gap-2">
								<span
									class="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] {isCurrent
										? 'bg-cyan-500/20 font-bold text-cyan-400'
										: 'bg-zinc-800 text-zinc-500'}"
								>
									{track.trackNumber}
								</span>
								<span class="truncate">{track.shortTitle}</span>
							</div>

							<span
								class="ml-1 shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 transition-colors group-hover:text-zinc-400"
							>
								{track.estimatedMinutes}m
							</span>
						</a>
					{/each}
				</nav>
			</div>
		</div>
	</aside>

	<!-- Main Content Wrapper -->
	<div class="flex min-w-0 flex-1 flex-col overflow-x-clip lg:pl-72">
		<!-- Top Navigation Header -->
		<header
			class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 backdrop-blur-md md:px-8"
		>
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (isMobileSidebarOpen = true)}
					class="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white lg:hidden"
					aria-label="Open sidebar"
				>
					<Menu class="h-4 w-4" />
				</button>

				<div class="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
					<a href="/" class="hover:text-zinc-200">Python AI Lab</a>
					<span>/</span>
					<span class="font-medium text-zinc-200">
						{#if page.error}
							System Notice ({page.status || 404})
						{:else if page.url.pathname === '/'}
							Curriculum Dashboard
						{:else if page.url.pathname === '/playground/chat'}
							Streaming Chat Playground
						{:else if page.url.pathname === '/benchmarks'}
							Evaluations & Benchmarks
						{:else}
							Lesson Module
						{/if}
					</span>
				</div>
			</div>

			<!-- Header Right Quick Actions -->
			<div class="flex items-center gap-2.5">
				<button
					type="button"
					onclick={() => (isSearchOpen = true)}
					class="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
				>
					<Search class="h-3.5 w-3.5 text-zinc-400" />
					<span class="hidden sm:inline">Search Curriculum</span>
					<Kbd combo={['meta', 'k']} size="xs" class="ml-1" />
				</button>

				<a
					href="/playground/chat"
					class="hidden items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-cyan-500 sm:flex"
				>
					<Bot class="h-3.5 w-3.5" />
					<span>Open Playground</span>
				</a>

				<a
					href="https://github.com/FuntionalFrost/python-ai-lab"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
					aria-label="GitHub Repository"
				>
					<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
						/>
					</svg>
					<span class="hidden md:inline">GitHub</span>
				</a>
			</div>
		</header>

		<!-- Page Content -->
		<main class="mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 md:p-8">
			{@render children()}
		</main>
	</div>
</div>

<!-- Global Quick Search Command Palette (Cmd+K / Ctrl+K) -->
<CommandPalette
	bind:open={isSearchOpen}
	items={commandItems}
	placeholder="Search curriculum tracks, patterns (e.g. 'Flask', 'RAG', 'streaming')..."
	ui={{
		overlay: 'bg-black/80 backdrop-blur-sm',
		content: 'border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl',
		input: 'text-zinc-100 placeholder:text-zinc-500',
		group: 'text-zinc-500 font-mono text-[10px] tracking-wider uppercase',
		item: 'text-zinc-300 hover:bg-zinc-900/80 hover:text-cyan-300',
		shortcut:
			'text-zinc-500 font-mono text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded'
	}}
/>
