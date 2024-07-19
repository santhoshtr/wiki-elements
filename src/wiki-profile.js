const styleURL = new URL('./wiki-profile.css', import.meta.url)
const template = `
<div class="wiki-profile">
    <picture class="thumbnail">
        <source class="webp" type="image/webp">
        <source class="png" type="image/png">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/220px-Wikipedia-logo-v2.svg.webp" alt="" />
    </picture>
    <h2 class="title-header">
    <a class="title" href="" target="_blank"></a>
    </h2>
</div>
<style>
@import url(${styleURL});
</style>
`

class WikiProfile extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = template;
    }

    static get observedAttributes() {
        return ['article', 'language'];
    }


    attributeChangedCallback(attrName, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            this[attrName] = newValue;
            this.fetchArticleData();
        }
    }

    connectedCallback() {
        this.article = this.getAttribute('article');
        this.language = this.getAttribute('language', 'en');
        this.fetchArticleData();
    }

    async fetchArticleData() {
        const url = `https://${this.language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(this.article)}?redirect=True`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            this.updateArticle(data);
        } catch (error) {
            this.querySelector('.description').innerText = 'Failed to load article.';
            console.error('Fetch error:', error);
        }
    }

    updateArticle(data) {
        const { title, extract, thumbnail, lang, dir, content_urls } = data;
        this.lang = lang | this.language;
        this.dir = dir;
        this.shadowRoot.querySelector('.title').innerText = title;
        this.shadowRoot.querySelector('.title').href = content_urls.desktop.page;

        if (thumbnail && thumbnail.source) {
            if (!thumbnail.source.includes('/wikipedia/commons')) {
                // not a commons image. local wiki image
                this.shadowRoot.querySelector('.thumbnail > .webp')?.remove();
                this.shadowRoot.querySelector('.thumbnail > .png')?.remove();
            } else {
                this.shadowRoot.querySelector('.thumbnail > .webp').srcset = thumbnail.source.replace(
                    /\.(jpg|png|jpeg)$/,
                    '.webp',
                );
                this.shadowRoot.querySelector('.thumbnail > .png').srcset = thumbnail.source.replace(/\.(jpg|webp|jpeg)$/, '.png');
            }
            this.shadowRoot.querySelector('.thumbnail > img').src = thumbnail.source;
        }
    }


}

customElements.define('wiki-profile', WikiProfile);
