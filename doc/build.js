#!/usr/bin/env node

/**
 * Build script: renders doc/src/*.njk templates → doc/*.html using Nunjucks.
 * Run with: node doc/build.js
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nunjucks from "nunjucks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "src");
const outDir = __dirname; // doc/

// Configure nunjucks to load templates from doc/src/
const env = nunjucks.configure(srcDir, { autoescape: false });

// Pages: { template, outputFile, slug, rootpath }
// rootpath is the relative path back to the project root from the output file's location.
// All component pages live in doc/, which is one level below root, so rootpath = '../'
// index.html also lives in doc/, so rootpath = '../' as well.
const pages = [
	{
		template: "index.njk",
		output: "index.html",
		slug: "index",
		rootpath: "../",
	},
	{
		template: "wiki-article.njk",
		output: "wiki-article.html",
		slug: "wiki-article",
		rootpath: "../",
	},
	{
		template: "wiki-image.njk",
		output: "wiki-image.html",
		slug: "wiki-image",
		rootpath: "../",
	},
	{
		template: "wiki-video.njk",
		output: "wiki-video.html",
		slug: "wiki-video",
		rootpath: "../",
	},
	{
		template: "wiki-map.njk",
		output: "wiki-map.html",
		slug: "wiki-map",
		rootpath: "../",
	},
	{
		template: "wiki-graph.njk",
		output: "wiki-graph.html",
		slug: "wiki-graph",
		rootpath: "../",
	},
	{
		template: "wiki-profile.njk",
		output: "wiki-profile.html",
		slug: "wiki-profile",
		rootpath: "../",
	},
	{
		template: "wiki-wikitext.njk",
		output: "wiki-wikitext.html",
		slug: "wiki-wikitext",
		rootpath: "../",
	},
	{
		template: "wiki-user.njk",
		output: "wiki-user.html",
		slug: "wiki-user",
		rootpath: "../",
	},
	{
		template: "wiki-machine-translation.njk",
		output: "wiki-machine-translation.html",
		slug: "wiki-machine-translation",
		rootpath: "../",
	},
	{
		template: "wiki-language-selector.njk",
		output: "wiki-language-selector.html",
		slug: "wiki-language-selector",
		rootpath: "../",
	},
	{
		template: "wiki-3d-viewer.njk",
		output: "wiki-3d-viewer.html",
		slug: "wiki-3d-viewer",
		rootpath: "../",
	},
];

for (const page of pages) {
	const html = env.render(page.template, {
		slug: page.slug,
		rootpath: page.rootpath,
	});
	const outPath = join(outDir, page.output);
	writeFileSync(outPath, html, "utf8");
	console.log(`  wrote ${outPath}`);
}

console.log(`\nBuilt ${pages.length} pages.`);
