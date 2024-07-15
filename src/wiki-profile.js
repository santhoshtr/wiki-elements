class WikiProfile extends HTMLElement {
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
        this.querySelector('.title').innerText = title;
        this.querySelector('.title').href = content_urls.desktop.page;

        if (thumbnail && thumbnail.source) {
            this.querySelector('.thumbnail').src = thumbnail.source;
        } else {
            this.querySelector('.thumbnail').style.display = 'none';
        }
    }

    render() {
        this.innerHTML = `
              <div class="wiki-profile">
                  <img class="thumbnail" src="" alt="" />
                  <h2 class="title-header">
                  <a class="title" href="" target="_blank"></a>
                  </h2>

              </div>
          `;
    }
}

customElements.define('wiki-profile', WikiProfile);
