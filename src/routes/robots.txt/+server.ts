import { createRobotsHandler } from 'yaxa-svelte/seo';
import { siteConfig } from '#lib/site.config';

export const prerender = true;
export const GET = createRobotsHandler(siteConfig);
