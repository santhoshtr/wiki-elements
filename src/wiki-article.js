import { html } from "./common.js";
import LazyLoadMixin from "./mixins/LazyLoadMixin.js";
import WikiElement from "./wiki-element.js";

const styleURL = new URL("./wiki-article.css", import.meta.url);

function clamp(v, lo, hi) {
	return Math.min(Math.max(v, lo), hi);
}

function rgbToHsl(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	const mx = Math.max(r, g, b);
	const mn = Math.min(r, g, b);
	let h;
	let s;
	const l = (mx + mn) / 2;
	if (mx === mn) {
		h = s = 0;
	} else {
		const d = mx - mn;
		s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
		switch (mx) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}
	return [h * 360, s * 100, l * 100];
}

// Minimum width/height ratio to classify an image as landscape.
// 1.6 avoids treating near-square images as landscape — the image
// must be meaningfully wide before we switch the card layout.
const LANDSCAPE_RATIO_THRESHOLD = 1.6;

// Shared 64×64 canvas for color extraction. Created once per module,
// reused across all wiki-article instances to avoid repeated allocation.
const _colorCanvas = document.createElement("canvas");
_colorCanvas.width = 64;
_colorCanvas.height = 64;
const _colorCtx = _colorCanvas.getContext("2d");

const ARROW_ICON = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

class WikiArticle extends LazyLoadMixin(WikiElement) {
	constructor() {
		super();
		// Cache stable shadow DOM nodes once after the base class sets up
		// the shadow root, avoiding repeated querySelector on every render.
		const sr = this.shadowRoot;
		this._root = sr.querySelector(".wiki-article");
		this._articleImg = sr.querySelector("figure > img");
		this._title = sr.querySelector("h2");
		this._desc = sr.querySelector("p");
		this._link = sr.querySelector("footer a");
	}

	static get properties() {
		return {
			article: { type: String },
			language: { type: String, default: "en" },
			layout: { type: String, default: "card", options: ["card", "compact"] },
			"data-article": { type: Object },
		};
	}

	static get template() {
		return html`
            <div class="wiki-article">
                <figure>
                    <img crossorigin="anonymous" loading="lazy" alt="" src="" />
                    <figcaption>
                        <div class="wiki-article-accent"></div>
                        <h2></h2>
                        <p></p>
                        <footer>
                            <a href="" target="_blank" rel="noopener">
                                Read article ${ARROW_ICON}
                            </a>
                            <span class="wiki-article-logo">
                                <img src="https://upload.wikimedia.org/wikipedia/en/8/80/Wikipedia-logo-v2.svg" alt="Wikipedia" width="20" height="20" loading="lazy" />
                            </span>
                        </footer>
                    </figcaption>
                </figure>
            </div>
            <style>@import url(${styleURL});</style>
        `;
	}

	async render() {
		// Abort any in-flight fetch from a previous render call. This prevents
		// a stale response from a slow request overwriting a newer one when
		// the article or language attribute changes rapidly.
		this._abortController?.abort();
		this._abortController = new AbortController();
		const { signal } = this._abortController;

		let data;
		if (this["data-article"]) {
			data = this["data-article"];
		} else {
			if (!this.article || !this.language) {
				return;
			}
			// Apply layout first so the skeleton shimmer has the correct
			// dimensions (e.g. figure needs aspect-ratio from the card class).
			this._applyLayout();
			this._setProgress(true);
			data = await this._fetchArticleData(signal);
			// If this render was superseded by a newer one, the signal will
			// have been aborted. Bail out silently — the newer render owns the DOM.
			if (signal.aborted) {
				return;
			}
		}
		if (!data) {
			this._setProgress(false);
			this._setError(true);
			return;
		}
		this._applyLayout();
		this._updateArticle(data);
		this._setProgress(false);
	}

	_setProgress(on) {
		if (on) {
			this.internals?.states?.add("progress");
		} else {
			this.internals?.states?.delete("progress");
		}
	}

	_setError(on) {
		if (on) {
			this.internals?.states?.add("error");
		} else {
			this.internals?.states?.delete("error");
		}
	}

	_applyLayout() {
		this._root.classList.remove("card", "compact");
		this._root.classList.add(this.layout || "card");
	}

	async _fetchArticleData(signal) {
		const url = `https://${this.language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(this.article)}?redirect=true`;
		try {
			const response = await fetch(url, { signal });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			// AbortError is expected when a newer render() call supersedes this
			// one — not a real error, so we return null silently.
			if (error.name === "AbortError") {
				return null;
			}
			console.error("wiki-article fetch error:", error);
			return null;
		}
	}

	_updateArticle(data) {
		const {
			title,
			extract,
			lang,
			dir,
			content_urls,
			thumbnail,
			originalimage,
		} = data;

		this._root.dir = dir || "";

		const pageUrl =
			content_urls?.desktop?.page ??
			`https://${lang || this.language}.wikipedia.org/wiki/${encodeURIComponent(title)}`;

		this._title.textContent = title;
		this._desc.textContent = extract || "";
		this._link.href = pageUrl;

		this._updateImage(thumbnail, originalimage, title);
	}

	// Not async: color extraction + theme happen in an image load callback,
	// not in the method body itself. The await in the old code resolved
	// immediately and gave a false impression of waiting for the theme.
	_updateImage(thumbnail, originalimage, alt) {
		const img = this._articleImg;

		if (!thumbnail?.source) {
			img.removeAttribute("src");
			return;
		}

		img.alt = alt || "";
		// Wikipedia thumbnail URLs encode the width as /NNNpx-. We pin
		// to 640px — enough for the card without over-fetching.
		img.src = thumbnail.source.replace(/\/\d+px-/, "/960px-");

		if (this.layout === "card") {
			// Detect landscape from the API's reported original dimensions.
			// This is cheap — no image download needed at this stage.
			// We use originalimage (full res) dims rather than the thumbnail
			// dims, because thumbnails are often cropped and unreliable.
			const isLandscape =
				originalimage?.width && originalimage?.height
					? originalimage.width / originalimage.height >
						LANDSCAPE_RATIO_THRESHOLD
					: false;

			const onLoad = () => {
				const hsl = this._extractColor(img);
				this._applyTheme(hsl, isLandscape);
			};
			if (img.complete && img.naturalWidth) {
				onLoad();
			} else {
				img.addEventListener("load", onLoad, { once: true });
			}
		}
	}

	_extractColor(img) {
		try {
			_colorCtx.drawImage(img, 0, 0, 64, 64);
			const px = _colorCtx.getImageData(0, 0, 64, 64).data;
			let rs = 0;
			let gs = 0;
			let bs = 0;
			let n = 0;
			for (let i = 0; i < px.length; i += 16) {
				const r = px[i];
				const g = px[i + 1];
				const b = px[i + 2];
				const a = px[i + 3];
				if (a < 128) {
					continue;
				}
				const br = (r + g + b) / 3;
				if (br < 25 || br > 230) {
					continue;
				}
				if (Math.max(r, g, b) - Math.min(r, g, b) < 20) {
					continue;
				}
				rs += r;
				gs += g;
				bs += b;
				n++;
			}
			if (n < 20) {
				rs = gs = bs = n = 0;
				for (let i = 0; i < px.length; i += 8) {
					const r = px[i];
					const g = px[i + 1];
					const b = px[i + 2];
					const a = px[i + 3];
					if (a < 128) {
						continue;
					}
					const br = (r + g + b) / 3;
					if (br < 15 || br > 240) {
						continue;
					}
					rs += r;
					gs += g;
					bs += b;
					n++;
				}
			}
			return n > 0 ? rgbToHsl(rs / n, gs / n, bs / n) : null;
		} catch {
			return null;
		}
	}

	_applyTheme(hsl, isLandscape = false) {
		const card = this._root;

		// Derive accent and shadow colors from the extracted image hue.
		// Fallback [220, 55, 45] is Wikipedia blue.
		const [h, s, l] = hsl || [220, 55, 45];
		const accentS = clamp(s, 50, 80);
		const accentL = clamp(l * 0.85, 56, 76);

		this.style.setProperty("--card-h", h | 0);
		this.style.setProperty("--card-s", `${accentS | 0}%`);
		this.style.setProperty(
			"--card-accent",
			`hsl(${h | 0}, ${accentS.toFixed(1)}%, ${accentL.toFixed(1)}%)`,
		);
		this.style.setProperty(
			"--card-shadow",
			`hsla(${h | 0}, ${Math.min(s * 0.6, 45).toFixed(1)}%, 5%, 0.72)`,
		);

		// Portrait: set the glass tint as a custom property so CSS consumes it
		// without an inline style on the element fighting the cascade.
		// Landscape: the CSS gradient connector owns figcaption's background
		// entirely, so we leave the property unset (CSS fallback takes over).
		if (!isLandscape) {
			const glassHint = `hsla(${h | 0}, ${Math.min(s * 0.28, 24).toFixed(1)}%, 98%, 0.12)`;
			this.style.setProperty("--wiki-article-glass-bg", glassHint);
		} else {
			this.style.removeProperty("--wiki-article-glass-bg");
		}

		// Toggle the layout class — all structural CSS differences between
		// portrait and landscape are handled in the stylesheet via this class.
		card.classList.toggle("is-landscape", isLandscape);

		// Fade the card in by adding .ready — CSS starts at opacity:0 and
		// transitions to opacity:1 on .ready, avoiding a flash of default
		// colors before color extraction completes.
		requestAnimationFrame(() => card.classList.add("ready"));
	}
}

if (!customElements.get("wiki-article")) {
	customElements.define("wiki-article", WikiArticle);
}
