import { defineSiteConfig } from 'yaxa-svelte';

export const siteConfig = defineSiteConfig({
	name: 'Python AI Lab',
	title: 'Python AI Lab — Prototyping & Testing Modern AI Backends',
	url: 'https://python-ai-lab.pages.dev',
	description:
		'An interactive lab for rapidly prototyping, testing, benchmarking, and iterating on modern Python Web & AI backend architectures (Flask 3.x, Quart, Litestar, Pydantic v2, HTTPX) with SvelteKit 3.',
	author: {
		name: 'FuntionalFrost',
		github: 'https://github.com/FuntionalFrost'
	},
	project: {
		type: 'open-source',
		license: 'MIT',
		badge: 'MIT Open Source',
		repositoryUrl: 'https://github.com/FuntionalFrost/python-ai-lab',
		isAccessibleForFree: true
	},
	theme: {
		primaryColor: '#3b82f6',
		defaultMode: 'dark'
	},
	seo: {
		twitterCard: 'summary_large_image',
		keywords: [
			'Python AI',
			'Flask 3',
			'Quart',
			'Litestar',
			'Pydantic v2',
			'LLM Benchmarking',
			'SvelteKit 3',
			'Prototyping',
			'Pytest Mocks'
		]
	},
	socials: {
		github: 'https://github.com/FuntionalFrost/python-ai-lab'
	},
	sitemap: {
		changefreq: 'weekly',
		priority: 0.8
	}
});
