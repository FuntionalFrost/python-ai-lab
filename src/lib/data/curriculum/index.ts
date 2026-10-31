import type { CurriculumLesson, TrackSummary } from '../../types/curriculum';
import { track01 } from './01-frameworks-mvc';
import { track02 } from './02-pydantic-settings';
import { track03 } from './03-resilient-httpx-clients';
import { track04 } from './04-llm-chat-streaming';
import { track05 } from './05-evals-benchmarks';
import { track06 } from './06-tool-calling-testing';
import { track07 } from './07-rag-pipelines';
import { track08 } from './08-agent-harnesses';
import { track09 } from './09-htmx-hypermedia-prototypes';
import { track10 } from './10-prototype-to-production';
import { track11 } from './11-migrating-flask-to-litestar';
import { track12 } from './12-connecting-to-sveltekit';

export const ALL_TRACKS: CurriculumLesson[] = [
	track01,
	track02,
	track03,
	track04,
	track05,
	track06,
	track07,
	track08,
	track09,
	track10,
	track11,
	track12
];

export const TRACK_SUMMARIES: TrackSummary[] = ALL_TRACKS.map((t) => ({
	id: t.id,
	slug: t.slug,
	trackNumber: t.trackNumber,
	title: t.title,
	shortTitle: t.shortTitle,
	subtitle: t.subtitle,
	estimatedMinutes: t.estimatedMinutes,
	topics: t.topics,
	frameworks: t.frameworks,
	tags: t.tags
}));

export function getTrackBySlug(slug: string): CurriculumLesson | undefined {
	return ALL_TRACKS.find((t) => t.slug === slug);
}

export function getTrackByNumber(num: number): CurriculumLesson | undefined {
	return ALL_TRACKS.find((t) => t.trackNumber === num);
}

export function getNextTrack(currentTrackNumber: number): CurriculumLesson | undefined {
	return ALL_TRACKS.find((t) => t.trackNumber === currentTrackNumber + 1);
}

export function getPreviousTrack(currentTrackNumber: number): CurriculumLesson | undefined {
	return ALL_TRACKS.find((t) => t.trackNumber === currentTrackNumber - 1);
}

export function searchTracks(query: string): CurriculumLesson[] {
	if (!query.trim()) return ALL_TRACKS;
	const q = query.toLowerCase().trim();
	return ALL_TRACKS.filter((t) => {
		return (
			t.title.toLowerCase().includes(q) ||
			t.shortTitle.toLowerCase().includes(q) ||
			t.subtitle.toLowerCase().includes(q) ||
			t.summary.toLowerCase().includes(q) ||
			t.topics.some((topic: string) => topic.toLowerCase().includes(q)) ||
			t.frameworks.some((fw: string) => fw.toLowerCase().includes(q)) ||
			t.tags.some((tag: string) => tag.toLowerCase().includes(q))
		);
	});
}
