<script lang="ts">
	import type { TestSuite } from '../types/curriculum';
	import { Modal, useClipboard } from 'yaxa-svelte';
	import { Terminal, CircleCheck, CircleX, RotateCw, Copy, Check } from '@lucide/svelte';

	interface Props {
		isOpen: boolean;
		testSuite: TestSuite;
		onClose: () => void;
	}

	let { isOpen = $bindable(false), testSuite, onClose }: Props = $props();

	const clipboard = useClipboard({ timeout: 2000 });

	let isRunning = $state(false);
	let isComplete = $state(false);
	let simulateFailure = $state(false);
	let useUv = $state(true);
	let isVerbose = $state(true);
	let withCoverage = $state(true);
	let outputLines = $state<string[]>([]);

	function startTestExecution() {
		isRunning = true;
		isComplete = false;
		outputLines = [];

		const rawLines = testSuite.simulatedStdout.split('\n');

		// Modify command line based on flags and runner
		const runnerPrefix = useUv ? 'uv run pytest' : 'pytest';
		const flagStr = `${isVerbose ? '-v ' : ''}${withCoverage ? '--cov=app ' : ''}`;
		outputLines = [`$ ${runnerPrefix} ${flagStr}${testSuite.testFilePath}`];

		let lineIndex = 0;
		const interval = setInterval(() => {
			if (lineIndex < rawLines.length) {
				let line = rawLines[lineIndex];
				if (simulateFailure && line.includes('PASSED [100%]')) {
					line = line.replace('PASSED [100%]', 'FAILED [100%]');
				}
				outputLines = [...outputLines, line];
				lineIndex++;
			} else {
				clearInterval(interval);
				if (simulateFailure) {
					outputLines = [
						...outputLines,
						'',
						'============================== FAILURES ==============================',
						`___ test_edge_case_failure ___`,
						`AssertionError: Expected status 200, got 422: Validation error on input`,
						'========================= 1 failed, 1 passed in 0.92s ========================='
					];
				}
				isRunning = false;
				isComplete = true;
			}
		}, 60);
	}

	$effect(() => {
		if (isOpen) {
			startTestExecution();
		} else {
			outputLines = [];
			isRunning = false;
			isComplete = false;
		}
	});

	function handleClose() {
		isOpen = false;
		onClose?.();
	}
</script>

<Modal
	bind:open={isOpen}
	size="xl"
	ui={{
		content: 'p-0 overflow-hidden border-zinc-800 bg-zinc-950 max-w-4xl max-h-[85vh] flex flex-col',
		close: 'top-3 right-3 text-zinc-400 hover:bg-zinc-800 hover:text-white'
	}}
>
	<!-- Modal Content Window -->
	<div class="flex max-h-[85vh] w-full flex-col overflow-hidden">
		<!-- Top Mac-Style Title Bar -->
		<div
			class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3"
		>
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-3 w-3 rounded-full bg-red-500/80"></span>
					<span class="inline-block h-3 w-3 rounded-full bg-amber-500/80"></span>
					<span class="inline-block h-3 w-3 rounded-full bg-emerald-500/80"></span>
				</div>
				<div class="ml-3 flex items-center gap-2 font-mono text-xs text-zinc-300">
					<Terminal class="h-3.5 w-3.5 text-cyan-400" />
					<span class="font-semibold text-zinc-200">pytest execution terminal</span>
					<span class="text-zinc-500">|</span>
					<span class="max-w-xs truncate text-zinc-400">{testSuite.testFilePath}</span>
				</div>
			</div>

			<div class="flex items-center gap-2 pr-8">
				<button
					type="button"
					onclick={() => clipboard.copy(outputLines.join('\n'))}
					class="flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
					title="Copy terminal output"
				>
					{#if clipboard.copied}
						<Check class="h-3 w-3 text-emerald-400" />
						<span class="text-[11px] text-emerald-400">Copied</span>
					{:else}
						<Copy class="h-3 w-3 text-zinc-400" />
						<span class="text-[11px]">Copy</span>
					{/if}
				</button>
			</div>
		</div>

		<!-- Terminal Controls / Flags -->
		<div
			class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-2 text-xs"
		>
			<div class="flex items-center gap-4 text-zinc-400">
				<label class="flex cursor-pointer items-center gap-1.5 select-none">
					<input
						type="checkbox"
						bind:checked={useUv}
						disabled={isRunning}
						class="rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-0"
					/>
					<span class="font-mono text-xs font-semibold text-purple-300">uv run</span>
				</label>

				<label class="flex cursor-pointer items-center gap-1.5 select-none">
					<input
						type="checkbox"
						bind:checked={isVerbose}
						disabled={isRunning}
						class="rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-0"
					/>
					<span class="font-mono text-xs text-zinc-300">-v (Verbose)</span>
				</label>

				<label class="flex cursor-pointer items-center gap-1.5 select-none">
					<input
						type="checkbox"
						bind:checked={withCoverage}
						disabled={isRunning}
						class="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0"
					/>
					<span class="font-mono text-xs text-zinc-300">--cov (Coverage)</span>
				</label>

				<label class="flex cursor-pointer items-center gap-1.5 select-none">
					<input
						type="checkbox"
						bind:checked={simulateFailure}
						disabled={isRunning}
						class="rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-0"
					/>
					<span class="font-mono text-xs text-amber-400">Simulate Assertion Failure</span>
				</label>
			</div>

			<button
				type="button"
				onclick={startTestExecution}
				disabled={isRunning}
				class="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1 font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
			>
				<RotateCw class="h-3 w-3 {isRunning ? 'animate-spin' : ''}" />
				<span>{isRunning ? 'Running tests...' : 'Re-run Tests'}</span>
			</button>
		</div>

		<!-- Terminal Body -->
		<div
			class="min-h-75 flex-1 overflow-y-auto bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 select-text"
		>
			{#each outputLines as line, idx (idx)}
				{#if line.includes('PASSED')}
					<div class="text-emerald-400">
						{line}
					</div>
				{:else if line.includes('FAILED') || line.includes('AssertionError')}
					<div class="font-semibold text-red-400">
						{line}
					</div>
				{:else if line.startsWith('tests/')}
					<div class="text-zinc-200">
						{line}
					</div>
				{:else if line.includes('coverage:') || line.includes('TOTAL')}
					<div class="font-semibold text-cyan-300">
						{line}
					</div>
				{:else if line.startsWith('$')}
					<div class="mb-2 font-bold text-zinc-400">
						{line}
					</div>
				{:else if line.includes('== 2 passed') || line.includes('== 4 passed')}
					<div class="my-1 font-bold text-emerald-400">
						{line}
					</div>
				{:else}
					<div class="text-zinc-400">
						{line}
					</div>
				{/if}
			{/each}

			{#if isRunning}
				<div class="mt-2 flex items-center gap-2 text-cyan-400">
					<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400"></span>
					<span class="animate-pulse">Executing pytest in container...</span>
				</div>
			{/if}
		</div>

		<!-- Footer Summary Bar -->
		<div
			class="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs"
		>
			<div class="flex items-center gap-2">
				{#if isComplete && !simulateFailure}
					<CircleCheck class="h-4 w-4 text-emerald-400" />
					<span class="font-medium text-emerald-400">Test Suite Passed</span>
					<span
						class="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400"
					>
						{testSuite.coverage.total.cover} Coverage
					</span>
				{:else if isComplete && simulateFailure}
					<CircleX class="h-4 w-4 text-red-400" />
					<span class="font-medium text-red-400">1 Failure Caught (Simulation)</span>
				{:else}
					<span class="text-zinc-400">Running simulated test suite...</span>
				{/if}
			</div>

			<button
				type="button"
				onclick={handleClose}
				class="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
			>
				Close
			</button>
		</div>
	</div>
</Modal>
