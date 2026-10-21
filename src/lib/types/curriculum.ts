export interface KeyConcept {
	name: string;
	description: string;
	pythonCode?: string;
}

export interface ArchitectureSection {
	patternName: string;
	diagram?: string;
	explanation: string;
	keyConcepts: KeyConcept[];
}

export interface CodeComparisonItem {
	title: string;
	description: string;
	leftTitle: string;
	leftLanguage: string;
	leftCode: string;
	rightTitle: string;
	rightLanguage: string;
	rightCode: string;
	diffHighlights?: string[];
}

export interface CodeSnippet {
	id: string;
	title: string;
	filePath: string;
	description: string;
	language: string;
	code: string;
	runnable?: boolean;
}

export interface CoverageFile {
	name: string;
	stmts: number;
	miss: number;
	cover: string;
	missing: string;
}

export interface TestSuite {
	title: string;
	testFilePath: string;
	testCode: string;
	command: string;
	executionTimeSec: number;
	simulatedStdout: string;
	coverage: {
		files: CoverageFile[];
		total: {
			stmts: number;
			miss: number;
			cover: string;
		};
	};
	summary: string;
}

export interface CurriculumLesson {
	id: string;
	slug: string;
	trackNumber: number;
	title: string;
	shortTitle: string;
	subtitle: string;
	estimatedMinutes: number;
	topics: string[];
	frameworks: string[];
	tags: string[];
	summary: string;
	objectives: string[];
	architecture: ArchitectureSection;
	comparisons: CodeComparisonItem[];
	codeSnippets: CodeSnippet[];
	testSuite: TestSuite;
	interactiveComponent?: 'chat' | 'tool-visualizer' | 'benchmark' | 'code-comparison';
}

export interface TrackSummary {
	id: string;
	slug: string;
	trackNumber: number;
	title: string;
	shortTitle: string;
	subtitle: string;
	estimatedMinutes: number;
	topics: string[];
	frameworks: string[];
	tags: string[];
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	toolCalls?: {
		id: string;
		name: string;
		arguments: Record<string, unknown>;
	}[];
	toolCallId?: string;
	timestamp: string;
}

export interface ToolCallStep {
	id: string;
	timestamp: string;
	stage: 'prompt' | 'llm_generation' | 'pydantic_validation' | 'execution' | 'response_synthesis';
	title: string;
	description: string;
	status: 'pending' | 'success' | 'error' | 'running';
	data: Record<string, unknown>;
}

export interface BenchmarkMetric {
	model: string;
	framework: string;
	ttftMs: number;
	itlMs: number;
	tokensPerSec: number;
	accuracy: number;
	costPer1kTokens: number;
}
