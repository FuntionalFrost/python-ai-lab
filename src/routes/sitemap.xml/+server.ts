import { createSitemapHandler } from 'yaxa-svelte/seo';
import { siteConfig } from '#lib/site.config';
import { ALL_TRACKS } from '#lib/data/curriculum/index';

export const prerender = true;
export const GET = createSitemapHandler({
	config: siteConfig,
	staticRoutes: [
		'/',
		'/playground/chat',
		'/benchmarks',
		...ALL_TRACKS.map((t) => `/module/${t.slug}`)
	]
});
