import { html, getSourceSetFromCommonsUrl } from './common.js';
import { editIcon, historyIcon, talkIcon } from './icons.js';
import { getContinuousColor, getColorTheme } from './utils/color.js';
import LazyLoadMixin from './mixins/LazyLoadMixin.js';
import WikiElement from './wiki-element.js';

const styleURL = new URL('./wiki-article.css', import.meta.url)


class WikiArticle extends LazyLoadMixin(WikiElement) {
    constructor() {
        super();
    }

    static get properties() {
        return {
            article: {
                type: String
            },
            language: {
                type: String
            }
        }
    }

    static get template() {
        return html`
        <div class="wiki-article">
            <img class="image" src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/220px-Wikipedia-logo-v2.svg.webp" alt="" />
            <div class="overlay"></div>
            <div class="content">
                <h2 class="title-header">
                <a class="title" href="" target="_blank"></a>
                </h2>
                <h2 class="meta attribution">From wikipedia, the free encylopedia
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
        `
    }

    async render() {
        const articleData = await this.fetchArticleData();
        this.updateArticle(articleData);
    }

    async fetchArticleData() {
        if (!this.article) return;
        if (!this.language) return;
        const url = `https://${this.language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(this.article)}?redirect=true`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data;
        } catch (error) {
            this.shadowRoot.querySelector('.description').innerText = 'Failed to load article.';
            console.error('Fetch error:', error);
        }
    }

    async updateImage(imageData) {
        const picture = this.shadowRoot.querySelector('.image')
        // resets
        picture.classList.add('empty');
        picture.classList.remove('light');
        picture.classList.remove('dark');
        picture.classList.remove('portrait');
        picture.classList.remove('landscape');

        if (imageData && imageData.source) {
            const srcset = getSourceSetFromCommonsUrl(imageData.source);
            picture.src = imageData.source;
            picture.srcset = srcset;
            picture.sizes = '(min-width: 100ch) 33.3vw, (min-width: 200ch) 50vw, 100vw';

            const dominantColor = await getContinuousColor(imageData.source);
            const rgb = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
            const colorTheme = getColorTheme(rgb);
            this.style.setProperty('--dominant-color', `oklch(from ${rgb} l c h)`);

            const isPortrait = imageData.height / imageData.width > 1.2;

            picture.classList.remove('empty');
            if (isPortrait) {
                picture.classList.add('portrait');
            } else {
                picture.classList.add('landscape');
            }
            this.style.setProperty('--image-width', imageData.width);
            this.style.setProperty('--image-height', imageData.height);
            picture.classList.add(colorTheme);
        } else {
            this.style.setProperty('--dominant-color', '#f1f5f9');
            picture.classList.remove('light');
        }
    }

    async updateArticle(data) {
        const { title, description, extract, thumbnail, lang, dir, content_urls } = data;
        this.lang = lang || this.language;
        this.dir = dir;
        this.shadowRoot.querySelector('.wiki-article').dir = dir;
        this.shadowRoot.querySelector('.title').innerText = title;
        this.shadowRoot.querySelector('.title').href = content_urls.desktop.page;
        this.shadowRoot.querySelector('.edit').href = content_urls.desktop.edit;
        this.shadowRoot.querySelector('.history').href = content_urls.desktop.revisions;
        this.shadowRoot.querySelector('.talk').href = content_urls.desktop.talk;
        this.shadowRoot.querySelector('.description').innerText = description;
        this.shadowRoot.querySelector('.extract').innerText = extract;

        await this.updateImage(data.thumbnail, data.original);
    }
}

if (!customElements.get('wiki-article')) {
    customElements.define('wiki-article', WikiArticle);
}

