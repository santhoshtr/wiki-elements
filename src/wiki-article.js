import { getSourceSetFromCommonsUrl, html } from "./common.js";
import { editIcon, historyIcon, talkIcon } from "./icons.js";
import { FastAverageColor } from "./libs/fast-average-color.js";
import LazyLoadMixin from "./mixins/LazyLoadMixin.js";
import WikiElement from "./wiki-element.js";

const styleURL = new URL("./wiki-article.css", import.meta.url);

class WikiArticle extends LazyLoadMixin(WikiElement) {
	constructor() {
		super();
		this.articleData = null;
	}

	static get properties() {
		return {
			article: {
				type: String,
			},
			language: {
				type: String,
			},
			layout: {
				type: String,
				default: "card",
				options: ["compact", "card", "simple"],
			},
			"data-article": {
				type: Object,
			},
		};
	}

	static get template() {
		return html`
            <div class="wiki-article">
			 	<div class="image-container">
					<img
						class="image"
						src=""
						alt=""
						crossorigin="anonymous"
					/>
					<div class="overlay"></div>
                </div>
                <div class="content">
                    <h2 class="title-header">
                        <a class="title" href="" target="_blank"></a>
                    </h2>
                    <h2 class="meta attribution">
                        From wikipedia, the free encylopedia
                        <a class="edit icon" href="" target="_blank">${editIcon}</a>
                        <a class="history icon" href="" target="_blank">${historyIcon}</a>
                        <a class="talk icon" href="" target="_blank">${talkIcon}</a>
                    </h2>
                    <p class="description">Loading...</p>
                    <p class="extract">Loading...</p>
                </div>
            </div>
            <style>
                @import url(${styleURL});
            </style>
        `;
	}

	async render() {
		if (this["data-article"]) {
			this.articleData = this["data-article"];
		} else {
			this.articleData = await this.fetchArticleData();
		}
		await this.updateArticle();
	}

	async fetchArticleData() {
		if (!this.article) {
			return;
		}
		if (!this.language) {
			return;
		}
		const url = `https://${this.language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(this.article)}?redirect=true`;
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			const data = await response.json();
			return data;
		} catch (error) {
			this.shadowRoot.querySelector(".description").innerText =
				"Failed to load article.";
			console.error("Fetch error:", error);
		}
	}

	getDominantColor(image, isBottom = true) {
		const fac = new FastAverageColor();
		const height = image.naturalHeight;
		const size = 50;
		const options = {
			height: size,
			algorithm: "simple",
		};
		if (isBottom) {
			options.top = isBottom ? height - size : height;
		}
		const color = fac.getColor(image, options);
		return color;
	}

	async updateImage() {
		const imageData = this.articleData.thumbnail;

		const picture = this.shadowRoot.querySelector(".image");
		const wikiarticleEl = this.shadowRoot.querySelector(".wiki-article");

		// resets
		picture.src = null;
		picture.classList.add("empty");
		wikiarticleEl.classList.remove("card", "simple", "compact");
		wikiarticleEl.classList.add(this.layout);

		if (imageData?.source) {
			picture.classList.remove("empty");
			const srcset = getSourceSetFromCommonsUrl(imageData.source);
			picture.src = imageData.source;
			picture.srcset = srcset;
			picture.sizes =
				"(min-width: 100ch) 33.3vw, (min-width: 200ch) 50vw, 100vw";

			if (this.layout === "card") {
				const onload = (img) => {
					const dominantColor = this.getDominantColor(img, true);
					this.style.setProperty("--continuous-color", dominantColor.rgba);
					this.style.setProperty(
						"--is-dark-image",
						dominantColor.isDark ? 1 : 0,
					);
				};
				if (picture.complete) {
					onload(picture);
				} else {
					picture.addEventListener("load", () => {
						onload(picture);
					});
					picture.addEventListener("error", () => {
						picture.src =
							"https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/220px-Wikipedia-logo-v2.svg.webp";
					});
				}
			}
		}
	}

	async updateArticle() {
		let { title, description, extract, lang, dir, content_urls } =
			this.articleData;
		this.lang = lang || this.language;
		this.dir = dir;
		this.shadowRoot.querySelector(".wiki-article").dir = dir;
		this.shadowRoot.querySelector(".title").innerText = title;

		if (!content_urls) {
			// construct content_urls from title and language
			const titleEncoded = encodeURIComponent(title.replace(/ /g, "_"));
			const lang = this.lang || this.language;
			const domain = `${lang}.wikipedia.org`;
			const base = `https://${domain}/wiki/${titleEncoded}`;
			content_urls = {
				desktop: {
					page: base,
					edit: `${base}?action=edit`,
					revisions: `${base}?action=history`,
					talk: `${base}?action=discussion`,
				},
				mobile: {
					page: `https://${domain}/wiki/${titleEncoded}?useformat=mobile`,
					edit: `https://${domain}/w/index.php?title=${titleEncoded}&action=edit`,
					revisions: `https://${domain}/w/index.php?title=${titleEncoded}&action=history`,
					talk: `https://${domain}/wiki/${titleEncoded}?action=discussion`,
				},
			};
		}

		this.shadowRoot.querySelector(".title").href = content_urls.desktop.page;
		this.shadowRoot.querySelector(".edit").href = content_urls.desktop.edit;
		this.shadowRoot.querySelector(".history").href =
			content_urls.desktop.revisions;
		this.shadowRoot.querySelector(".talk").href = content_urls.desktop.talk;
		this.shadowRoot.querySelector(".description").innerText = description;
		this.shadowRoot.querySelector(".extract").innerText = extract;

		await this.updateImage();
	}
}

if (!customElements.get("wiki-article")) {
	customElements.define("wiki-article", WikiArticle);
}
