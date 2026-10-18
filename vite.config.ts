import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: true
			},
			adapter: adapter({ fallback: '404.html' })
		})
	],
	resolve: {
		alias: {
			'#lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	}
});
