import { error } from '@sveltejs/kit';
import type { PageLoad, EntryGenerator } from './$types';
import {
	getTrackBySlug,
	getNextTrack,
	getPreviousTrack,
	ALL_TRACKS
} from '#lib/data/curriculum/index';

export const entries: EntryGenerator = () => {
	return ALL_TRACKS.map((t) => ({ slug: t.slug }));
};

export const load: PageLoad = ({ params }) => {
	const track = getTrackBySlug(params.slug);
	if (!track) {
		throw error(404, `Curriculum track "${params.slug}" not found.`);
	}

	const nextTrack = getNextTrack(track.trackNumber);
	const prevTrack = getPreviousTrack(track.trackNumber);

	return {
		track,
		nextTrack,
		prevTrack
	};
};
