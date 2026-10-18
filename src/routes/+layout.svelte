<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { ALL_TRACKS, searchTracks } from '#lib/data/curriculum/index.ts';
	import { progress } from '#lib/progress.svelte';
	import { Bot, Activity, Search, Terminal, Menu, X, Layers, Check } from '@lucide/svelte';

	let { children }: LayoutProps = $props();

	let searchQuery = $state('');
	let isSearchOpen = $state(false);
	let isMobileSidebarOpen = $state(false);

	const searchResults = $derived.by(() => {
		if (!searchQuery.trim()) return ALL_TRACKS;
		return searchTracks(searchQuery);
	});

	const completedCount = $derived.by(() => {
		return ALL_TRACKS.filter((t) => progress.isCompleted(t.slug)).length;
	});

	const progressPercentage = $derived.by(() => {
		return Math.round((completedCount / ALL_TRACKS.length) * 100);
	});

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			isSearchOpen = !isSearchOpen;
		} else if (e.key === 'Escape' && isSearchOpen) {
			isSearchOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Python AI Lab - Interactive Self-Teaching Platform</title>
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
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-tr from-cyan-500 to-emerald-400 text-zinc-950 shadow-md"
				>
					<Terminal class="h-4 w-4" />
				</div>
				<div>
					<span class="text-sm font-semibold tracking-wide text-zinc-100">Python AI Lab</span>
					<span class="block font-mono text-[10px] text-cyan-400">3.13+ · SvelteKit</span>
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

		<!-- Quick Search Button -->
		<div class="px-4 py-3">
			<button
				type="button"
				onclick={() => (isSearchOpen = true)}
				class="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
			>
				<div class="flex items-center gap-2">
					<Search class="h-3.5 w-3.5 text-zinc-500" />
					<span>Search topics...</span>
				</div>
				<kbd
					class="rounded border border-zinc-700/60 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
				>
					⌘K
				</kbd>
			</button>
		</div>

		<!-- Progress Tracker Widget -->
		<div class="mx-4 mb-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
			<div class="flex items-center justify-between text-xs">
				<span class="font-medium text-zinc-400">Curriculum Progress</span>
				<span class="font-mono font-bold text-cyan-400">{progressPercentage}%</span>
			</div>
			<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
				<div
					class="h-full rounded-full bg-linear-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
					style="width: {progressPercentage}%"
				></div>
			</div>
			<div class="mt-1.5 flex justify-between font-mono text-[10px] text-zinc-500">
				<span>{completedCount} of {ALL_TRACKS.length} Completed</span>
				<span>{ALL_TRACKS.length} Tracks Total</span>
			</div>
		</div>

		<!-- Navigation Links -->
		<div class="flex-1 space-y-6 overflow-y-auto px-3 py-2">
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
						{@const isDone = progress.isCompleted(track.slug)}
						<a
							href="/module/{track.slug}"
							onclick={() => (isMobileSidebarOpen = false)}
							class="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors {isCurrent
								? 'border border-cyan-500/20 bg-cyan-500/10 font-semibold text-cyan-300'
								: 'text-zinc-400 hover:bg-zinc-900/90 hover:text-zinc-200'}"
						>
							<div class="flex items-center gap-2 truncate">
								<span
									class="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] {isDone
										? 'bg-emerald-500/20 font-bold text-emerald-400'
										: isCurrent
											? 'bg-cyan-500/20 font-bold text-cyan-400'
											: 'bg-zinc-800 text-zinc-500'}"
								>
									{#if isDone}
										<Check class="h-3 w-3 text-emerald-400" />
									{:else}
										{track.trackNumber}
									{/if}
								</span>
								<span class="truncate">{track.shortTitle}</span>
							</div>

							<span
								class="py-0.2 ml-1 shrink-0 rounded px-1.5 font-mono text-[9px] uppercase {track.level ===
								'Beginner'
									? 'text-emerald-400/80'
									: track.level === 'Intermediate'
										? 'text-cyan-400/80'
										: 'text-amber-400/80'}"
							>
								{track.level}
							</span>
						</a>
					{/each}
				</nav>
			</div>
		</div>

		<!-- Footer Info -->
		<div class="border-t border-zinc-800/80 px-4 py-3 text-[11px] text-zinc-500">
			<div class="flex items-center justify-between">
				<span>Python 3.13+ · Flask · Litestar</span>
				<span class="text-emerald-400">Production</span>
			</div>
		</div>
	</aside>

	<!-- Main Content Wrapper -->
	<div class="flex flex-1 flex-col lg:pl-72">
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
						{#if page.url.pathname === '/'}
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
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (isSearchOpen = true)}
					class="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
				>
					<Search class="h-3.5 w-3.5 text-zinc-400" />
					<span class="hidden sm:inline">Search Curriculum</span>
					<kbd
						class="ml-1 rounded border border-zinc-700 bg-zinc-800 px-1 font-mono text-[10px] text-zinc-400"
					>
						⌘K
					</kbd>
				</button>

				<a
					href="/playground/chat"
					class="hidden items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-cyan-500 sm:flex"
				>
					<Bot class="h-3.5 w-3.5" />
					<span>Open Playground</span>
				</a>
			</div>
		</header>

		<!-- Page Content -->
		<main class="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
			{@render children()}
		</main>
	</div>
</div>

<!-- Global Quick Search Modal (Cmd+K) -->
{#if isSearchOpen}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-20 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
		>
			<!-- Search Bar -->
			<div class="flex items-center border-b border-zinc-800 px-4 py-3">
				<Search class="mr-3 h-5 w-5 text-cyan-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search modules, patterns (e.g. 'Litestar', 'Pydantic', 'RAG', 'pytest')..."
					class="flex-1 bg-transparent font-sans text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => (isSearchOpen = false)}
					class="rounded p-1 text-zinc-400 hover:text-white"
					aria-label="Close search"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Search Results List -->
			<div class="max-h-96 space-y-1 overflow-y-auto p-2">
				{#if searchResults.length === 0}
					<div class="p-8 text-center text-xs text-zinc-500">
						No curriculum tracks matching "{searchQuery}".
					</div>
				{:else}
					{#each searchResults as track (track.id)}
						<a
							href="/module/{track.slug}"
							onclick={() => (isSearchOpen = false)}
							class="group flex flex-col gap-1 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-zinc-800 hover:bg-zinc-900"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span
										class="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400"
									>
										Track {track.trackNumber}
									</span>
									<span class="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300">
										{track.title}
									</span>
								</div>
								<span class="font-mono text-[10px] text-zinc-500">{track.estimatedMinutes} min</span
								>
							</div>
							<p class="line-clamp-1 text-[11px] text-zinc-400">
								{track.summary}
							</p>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each track.frameworks as fw (fw)}
									<span
										class="py-0.2 rounded bg-zinc-800/60 px-1.5 font-mono text-[9px] text-zinc-400"
									>
										{fw}
									</span>
								{/each}
							</div>
						</a>
					{/each}
				{/if}
			</div>

			<div
				class="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/50 px-4 py-2.5 font-mono text-[11px] text-zinc-500"
			>
				<span>Navigate: ↑↓ &nbsp; Select: ↵</span>
				<span>ESC to close</span>
			</div>
		</div>
	</div>
{/if}
