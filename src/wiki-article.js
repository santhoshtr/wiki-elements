import { html, getSourceSetFromCommonsUrl } from './common.js';
import { editIcon, historyIcon, talkIcon } from './icons.js';
import { getContinuousColor, getColorTheme } from './utils/color.js';
import LazyLoadMixin from './mixins/LazyLoadMixin.js';
import ResizeMixin from './mixins/ResizeMixin.js';
import WikiElement from './wiki-element.js';

const styleURL = new URL('./wiki-article.css', import.meta.url)


class WikiArticle extends ResizeMixin(LazyLoadMixin(WikiElement)) {
    constructor() {
        super();
        this.articleData = null;
    }

    static get properties() {
        return {
            article: {
                type: String
            },
            language: {
                type: String
            },
            layout: {
                type: String,
                default: 'card',
                options: ['compact', 'card', 'simple']
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
        this.articleData = await this.fetchArticleData();
        this.orientation = null;
        await this.updateArticle();
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

    isOrientationChanged(containerDimension) {
        if (containerDimension && containerDimension.width <= 640) {
            return this.orientation !== 'portrait';
        } else {
            return this.orientation !== 'landscape';
        }
    }

    async updateImage(containerDimension) {
        const imageData = this.articleData.thumbnail;

        const picture = this.shadowRoot.querySelector('.image')
        const wikiarticleEl = this.shadowRoot.querySelector('.wiki-article');
        // resets
        picture.classList.add('empty');
        picture.classList.remove('light');
        picture.classList.remove('dark');
        picture.classList.remove('portrait');
        picture.classList.remove('landscape');
        picture.classList.remove('vertical');
        wikiarticleEl.classList.remove('portrait');
        wikiarticleEl.classList.remove('landscape');
        wikiarticleEl.classList.remove('card');
        wikiarticleEl.classList.remove('simple');
        wikiarticleEl.classList.remove('compact');
        wikiarticleEl.classList.add(this.layout);

        if (!containerDimension) {
            containerDimension = { width: this.offsetWidth, height: this.offsetHeight };
            this.style.setProperty('--container-width', containerDimension.width + 'px');
            this.style.setProperty('--container-height', containerDimension.height + 'px');
        }
        if (imageData && imageData.source) {
            picture.classList.remove('empty');
            const srcset = getSourceSetFromCommonsUrl(imageData.source);
            picture.src = imageData.source;
            picture.srcset = srcset;
            picture.sizes = '(min-width: 100ch) 33.3vw, (min-width: 200ch) 50vw, 100vw';


            let dominantColor;


            if (containerDimension && containerDimension.width <= 640) {
                this.orientation = 'portrait';
                wikiarticleEl.classList.add('portrait');
                dominantColor = await getContinuousColor(imageData.source, 'bottom');

            } else {
                this.orientation = 'landscape';
                wikiarticleEl.classList.add('landscape');
                dominantColor = await getContinuousColor(imageData.source, 'left');
            }
            if (this.layout === 'card') {
                const rgb = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
                const colorTheme = getColorTheme(rgb);
                this.style.setProperty('--dominant-color', `oklch(from ${rgb} l c h)`);

                const isPortrait = imageData.height / imageData.width > 1.2;

                const imageAspectRatio = imageData.width / imageData.height;

                if (imageAspectRatio < 0.8) {
                    picture.classList.add('vertical');
                }
                if (isPortrait) {
                    picture.classList.add('portrait');
                } else {
                    picture.classList.add('landscape');
                }
                this.style.setProperty('--image-width', imageData.width);
                this.style.setProperty('--image-height', imageData.height);
                picture.classList.add(colorTheme);
            }
        } else {
            this.style.setProperty('--dominant-color', '#f1f5f9');
            picture.classList.remove('light');
        }
    }

    async updateArticle() {
        const { title, description, extract, thumbnail, lang, dir, content_urls } = this.articleData;
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

        await this.updateImage();
    }

    updateDimensions(width, height) {
        // console.log('updateDimensions', width, height);
        if (this.articleData && this.articleData.thumbnail) {
            if (this.isOrientationChanged({ width, height })) {
                this.updateImage({ width, height });

            }
        }
        this.style.setProperty('--container-width', parseInt(width) + 'px');
        this.style.setProperty('--container-height', parseInt(height) + 'px');
    }
}

if (!customElements.get('wiki-article')) {
    customElements.define('wiki-article', WikiArticle);
}

