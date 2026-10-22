<script lang="ts">
	import {
		Wrench,
		Play,
		RotateCcw,
		CircleCheck,
		CircleAlert,
		ArrowRight,
		FileBraces,
		Sparkles,
		ShieldCheck,
		Bug
	} from '@lucide/svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	type Step = 'idle' | 'prompt' | 'llm_call' | 'pydantic_check' | 'tool_exec' | 'synthesis';

	let currentStep = $state<Step>('idle');
	let isInjectingError = $state(false);
	let isPlaying = $state(false);
	let playInterval: ReturnType<typeof setInterval> | null = null;

	const stepsOrder: Step[] = ['prompt', 'llm_call', 'pydantic_check', 'tool_exec', 'synthesis'];

	function stepIndex(step: Step): number {
		return stepsOrder.indexOf(step);
	}

	function nextStep() {
		if (currentStep === 'idle') {
			currentStep = 'prompt';
		} else {
			const idx = stepIndex(currentStep);
			if (idx < stepsOrder.length - 1) {
				currentStep = stepsOrder[idx + 1];
			} else {
				stopAutoPlay();
			}
		}
	}

	function reset() {
		stopAutoPlay();
		currentStep = 'idle';
	}

	function toggleAutoPlay() {
		if (isPlaying) {
			stopAutoPlay();
		} else {
			isPlaying = true;
			if (currentStep === 'synthesis' || currentStep === 'idle') {
				currentStep = 'prompt';
			}
			playInterval = setInterval(() => {
				const idx = stepIndex(currentStep);
				if (idx < stepsOrder.length - 1) {
					currentStep = stepsOrder[idx + 1];
				} else {
					stopAutoPlay();
				}
			}, 1400);
		}
	}

	function stopAutoPlay() {
		isPlaying = false;
		if (playInterval) {
			clearInterval(playInterval);
			playInterval = null;
		}
	}
</script>

<div
	class="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl {className}"
>
	<!-- Top Bar -->
	<div
		class="mb-6 flex flex-col gap-3 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<div class="flex items-center gap-2">
				<Wrench class="h-5 w-5 text-cyan-400" />
				<h3 class="text-base font-semibold text-zinc-100">Interactive LLM Tool Execution Loop</h3>
			</div>
			<p class="mt-1 text-xs text-zinc-400">
				Step-by-step visualizer for OpenAI tool selection, Pydantic v2 argument validation, and
				execution.
			</p>
		</div>

		<!-- Action Controls -->
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={() => {
					isInjectingError = !isInjectingError;
					reset();
				}}
				class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {isInjectingError
					? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
					: 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
			>
				<Bug class="h-3.5 w-3.5" />
				<span>{isInjectingError ? 'Injecting Error (Active)' : 'Simulate Schema Error'}</span>
			</button>

			<button
				type="button"
				onclick={toggleAutoPlay}
				class="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-500"
			>
				<Play class="h-3.5 w-3.5 {isPlaying ? 'fill-white' : ''}" />
				<span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
			</button>

			<button
				type="button"
				onclick={nextStep}
				disabled={currentStep === 'synthesis' || isPlaying}
				class="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-40"
			>
				<span>Next Step</span>
				<ArrowRight class="h-3.5 w-3.5" />
			</button>

			<button
				type="button"
				onclick={reset}
				class="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-colors hover:text-white"
				title="Reset"
				aria-label="Reset"
			>
				<RotateCcw class="h-4 w-4" />
			</button>
		</div>
	</div>

	<!-- Step Progress Indicator -->
	<div class="mb-8 grid grid-cols-2 gap-2 md:grid-cols-5">
		{#each stepsOrder as step, i (step)}
			{@const isActive = currentStep === step}
			{@const isPassed = stepIndex(currentStep) > i}
			<div
				class="flex flex-col items-center rounded-xl border p-3 text-center transition-all {i === 4
					? 'col-span-2 md:col-span-1'
					: ''} {isActive
					? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-md shadow-cyan-500/10'
					: isPassed
						? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
						: 'border-zinc-800/80 bg-zinc-900/40 text-zinc-500'}"
			>
				<div class="mb-1 font-mono text-[10px] tracking-wider uppercase">
					Step {i + 1}
				</div>
				<div class="text-xs font-semibold">
					{#if step === 'prompt'}
						User Prompt
					{:else if step === 'llm_call'}
						Tool Selected
					{:else if step === 'pydantic_check'}
						Pydantic v2 Check
					{:else if step === 'tool_exec'}
						Execute Python
					{:else}
						Final Synthesis
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Active Stage Card -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
		{#if currentStep === 'idle'}
			<div class="py-8 text-center text-zinc-400">
				<Sparkles class="mx-auto mb-2 h-8 w-8 text-cyan-400/60" />
				<p class="text-sm font-medium text-zinc-200">Execution loop is idle.</p>
				<p class="mt-1 text-xs text-zinc-500">
					Click <span class="font-semibold text-cyan-400">"Auto-Play"</span> or
					<span class="font-semibold text-zinc-300">"Next Step"</span> to observe how the AI agent safely
					runs tools.
				</p>
			</div>
		{:else if currentStep === 'prompt'}
			<div class="space-y-3">
				<div class="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase">
					<Sparkles class="h-4 w-4" />
					<span>Stage 1: User Request Ingested</span>
				</div>
				<div
					class="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200"
				>
					{#if isInjectingError}
						"What is the current temperature in Vienna in kelvin?"
					{:else}
						"What is the current temperature in Vienna in celsius?"
					{/if}
				</div>
				<p class="text-xs text-zinc-400">
					The agent registers registered tool schemas generated directly from Pydantic models with
					the OpenAI client.
				</p>
			</div>
		{:else if currentStep === 'llm_call'}
			<div class="space-y-3">
				<div class="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase">
					<FileBraces class="h-4 w-4" />
					<span>Stage 2: Model Proposes Tool Call</span>
				</div>
				<div
					class="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200"
				>
					<span class="text-purple-400">tool_calls</span>: [
					<br />&nbsp;&nbsp;&#123;
					<br />&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-cyan-300">"name"</span>:
					<span class="text-emerald-400">"get_current_weather"</span>,
					<br />&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-cyan-300">"arguments"</span>:
					<span class="text-emerald-300"
						>'{#if isInjectingError}&#123;"location": "Vienna", "unit": "kelvin"&#125;{:else}&#123;"location":
							"Vienna, Austria", "unit": "celsius"&#125;{/if}'</span
					>
					<br />&nbsp;&nbsp;&#125;
					<br />]
				</div>
				<p class="text-xs text-zinc-400">
					The LLM produced JSON arguments. <span class="font-semibold text-amber-400">WARNING:</span
					> This data is untrusted user input from a neural network; never execute without schema validation!
				</p>
			</div>
		{:else if currentStep === 'pydantic_check'}
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div
						class="flex items-center gap-2 text-xs font-semibold uppercase {isInjectingError
							? 'text-amber-400'
							: 'text-emerald-400'}"
					>
						{#if isInjectingError}
							<CircleAlert class="h-4 w-4" />
							<span>Stage 3: Pydantic Validation Error (Caught Gracefully)</span>
						{:else}
							<ShieldCheck class="h-4 w-4" />
							<span>Stage 3: Pydantic v2 Schema Passed</span>
						{/if}
					</div>
				</div>

				<div
					class="rounded-lg border bg-zinc-950 p-4 font-mono text-xs {isInjectingError
						? 'border-amber-500/40 text-amber-200'
						: 'border-emerald-500/40 text-emerald-300'}"
				>
					{#if isInjectingError}
						<div>
							<span class="text-red-400">pydantic.ValidationError</span>: 1 validation error for
							WeatherQuery
							<br /><span class="text-zinc-400">&nbsp;&nbsp;unit</span>
							<br /><span class="text-amber-300"
								>&nbsp;&nbsp;&nbsp;&nbsp;String should match pattern '^(celsius|fahrenheit)$'
								[type=string_pattern_mismatch]</span
							>
						</div>
					{:else}
						<div>
							WeatherQuery.model_validate_json(arguments) -> <span class="text-emerald-400"
								>Success</span
							>
							<br />Validated Model: WeatherQuery(location='Vienna, Austria', unit='celsius')
						</div>
					{/if}
				</div>

				<p class="text-xs text-zinc-400">
					{#if isInjectingError}
						The validation error is captured and returned back into the chat loop as tool feedback,
						allowing the model to self-correct instead of crashing the server.
					{:else}
						The payload matches the regex pattern <code class="font-mono text-cyan-400"
							>^(celsius|fahrenheit)$</code
						> and types are guaranteed before Python code runs.
					{/if}
				</p>
			</div>
		{:else if currentStep === 'tool_exec'}
			<div class="space-y-3">
				<div class="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase">
					<Wrench class="h-4 w-4" />
					<span>Stage 4: Python Function Dispatched</span>
				</div>
				<div
					class="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200"
				>
					{#if isInjectingError}
						<span class="text-amber-400"># Tool execution bypassed due to validation error</span>
						<br /><span class="text-zinc-400">Feedback dispatched to LLM:</span>
						<br />&#123;"error": "Invalid unit 'kelvin'. Supported units are celsius or
						fahrenheit."&#125;
					{:else}
						<span class="text-emerald-400">get_current_weather(query=WeatherQuery(...))</span>
						<br />Output: &#123;"location": "Vienna, Austria", "temperature": 18.5, "unit":
						"celsius", "condition": "Sunny"&#125;
					{/if}
				</div>
			</div>
		{:else if currentStep === 'synthesis'}
			<div class="space-y-3">
				<div class="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase">
					<CircleCheck class="h-4 w-4" />
					<span>Stage 5: Final LLM Answer Synthesized</span>
				</div>
				<div
					class="rounded-lg border border-emerald-500/30 bg-zinc-950 p-4 font-mono text-xs text-zinc-100"
				>
					{#if isInjectingError}
						"I could not fetch the weather in Kelvin because only Celsius and Fahrenheit are
						supported by the weather service. Would you like me to retrieve it in Celsius instead?"
					{:else}
						"The current temperature in Vienna, Austria is 18.5°C and Sunny."
					{/if}
				</div>
				<div class="flex items-center gap-2 text-xs text-emerald-400">
					<CircleCheck class="h-3.5 w-3.5" />
					<span>Turn completed successfully with strict schema safety.</span>
				</div>
			</div>
		{/if}
	</div>
</div>
