import { defineConfig } from "vite";

export default defineConfig({
	root: "./",
	build: {
		outDir: "dist",
		sourcemap: true,
		lib: {
			entry: ["src/index.js"],
			name: "wiki-elements",
			fileName: "wiki-elements",
		},
	},
});
