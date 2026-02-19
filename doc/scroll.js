import "../src/wiki-article.js";
import "../src/wiki-language-selector.js";

const params = {
	action: "query",
	format: "json",
	generator: "random",
	grnnamespace: 0,
	prop: "extracts|pageimages|info",
	inprop: "url",
	grnlimit: 20,
	exintro: 1,
	exlimit: "max",
	exsentences: 5,
	explaintext: 1,
	piprop: "thumbnail",
	pithumbsize: 80,
	origin: "*",
};

let isLoading = false;
let language = "en";
const articleListContainer = document.querySelector(".article-list");

const observer = new IntersectionObserver(
	async (entries) => {
		if (entries[0].isIntersecting) {
			await fetchArticles(language);
		} else {
			console.log("Not intersecting");
		}
	},
	{
		root: null,
		rootMargin: "100px",
		threshold: 1.0,
	},
);

async function fetchArticles(language = "en") {
	const baseUrl = `https://${language}.wikipedia.org/w/api.php`;
	const url = new URL(baseUrl);
	url.search = new URLSearchParams(params).toString();
	if (isLoading) return;
	isLoading = true;
	const response = await fetch(url);
	const data = await response.json();
	const pages = data.query.pages;

	for (const key in pages) {
		const article = pages[key];
		if (
			article.thumbnail === undefined ||
			article.thumbnail.source === undefined
		) {
			continue;
		}
		const articleEl = document.createElement("wiki-article");
		articleEl.dataset.article = encodeURIComponent(JSON.stringify(article));
		articleEl.language = language;
		const listItem = document.createElement("li");
		listItem.appendChild(articleEl);
		articleListContainer.appendChild(listItem);
	}
	observeLastArticle();
	isLoading = false;
}

const observeLastArticle = () => {
	const articles = articleListContainer.querySelectorAll("li");
	if (articles.length > 0) {
		observer.observe(articles[articles.length - 2]);
	}
};

document.addEventListener("DOMContentLoaded", async () => {
	await fetchArticles(language);

	document
		.getElementById("wikilanguageselector")
		.addEventListener("select", async (event) => {
			language = event.detail.value;
			articleListContainer.innerHTML = "";
			await fetchArticles(language);
			document.getElementById("languageselector_dialog").hidePopover();
		});
});
