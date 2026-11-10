import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

const base = process.env.DOCS_BASE ?? "/";

export default defineConfig({
	site: "https://im-theslimeguy.github.io",
	base,
	trailingSlash: "always",
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		shikiConfig: {
			theme: "github-dark",
		},
	},
});
