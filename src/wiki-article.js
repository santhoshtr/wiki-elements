import './common.js';
import { editIcon, historyIcon, talkIcon } from './icons.js'; './icons.js';

class WikiArticle extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.article = this.getAttribute('article');
        this.language = this.getAttribute('language', 'en');
        this.render();
        this.fetchArticleData();
    }

    async fetchArticleData() {
        const url = `https://${this.language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(this.article)}?redirect=true`;
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
        const { title, description, extract, thumbnail, lang, dir, content_urls } = data;
        this.lang = lang | this.language;
        this.dir = dir;
        this.querySelector('.title').innerText = title;
        this.querySelector('.title').href = content_urls.desktop.page;
        this.querySelector('.edit').href = content_urls.desktop.edit;
        this.querySelector('.history').href = content_urls.desktop.revisions;
        this.querySelector('.talk').href = content_urls.desktop.talk;
        this.querySelector('.description').innerText = description;
        this.querySelector('.extract').innerText = extract;
        if (thumbnail && thumbnail.source) {
            if (thumbnail.source.includes('/wikipedia/')) {
                // not a commons image. local wiki image
                this.querySelector('.wiki-article-thumbnail > .webp').remove();
                this.querySelector('.wiki-article-thumbnail > .png').remove();
            } else {
                this.querySelector('.wiki-article-thumbnail > .webp').srcset = thumbnail.source.replace(
                    /\.(jpg|png|jpeg)$/,
                    '.webp',
                );
                this.querySelector('.wiki-article-thumbnail > .png').srcset = thumbnail.source.replace(/\.(jpg|webp|jpeg)$/, '.png');
            }
            this.querySelector('.wiki-article-thumbnail > img').src = thumbnail.source;
        }
    }

    render() {
        this.innerHTML = `
              <div class="wiki-article">
                  <picture class="wiki-article-thumbnail">
                   <source class="webp" type="image/webp">
                   <source class="png" type="image/png">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/220px-Wikipedia-logo-v2.svg.webp" alt="" />
                  </picture>
                  <div class="wiki-article-title-desc-container">
                    <h2 class="title-header">
                    <a class="title" href="" target="_blank"></a>
                    </h2>
                    <p class="description">Loading...</p>
                    <p class="extract">Loading...</p>
                    <div class="wiki-article-meta">
                        <span class="logo">Wikipedia</span>
                        <a class="edit icon" href="" target="_blank">${editIcon}
                        </a>
                        <a class="history icon" href="" target="_blank">${historyIcon}</a>
                        <a class="talk icon" href="" target="_blank">${talkIcon}</a>

                    </div>
                  </div>
              </div>
          `;
    }
}

customElements.define('wiki-article', WikiArticle);
