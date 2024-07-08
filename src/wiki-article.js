import "./common.js";

class WikiArticle extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.article = this.getAttribute("article");
      this.language = this.getAttribute("language", "en");
      this.render();
      this.fetchArticleData();
    }

    async fetchArticleData() {
      const url = `https://${
        this.language
      }.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        this.article
      )}?redirect=true`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        this.updateArticle(data);
      } catch (error) {
        this.querySelector(".description").innerText = "Failed to load article.";
        console.error("Fetch error:", error);
      }
    }

    updateArticle(data) {
      const { title, extract, thumbnail, lang, dir, content_urls } = data;
      this.lang = lang | this.language;
      this.dir = dir;
      this.querySelector(".title").innerText = title;
      this.querySelector(".title").href = content_urls.desktop.page;
      this.querySelector(".edit").href = content_urls.desktop.edit;
      this.querySelector(".history").href = content_urls.desktop.revisions;
      this.querySelector(".talk").href = content_urls.desktop.talk;
      this.querySelector(".description").innerText = extract;
      if (thumbnail && thumbnail.source) {
        if (thumbnail.source.includes("/wikipedia/")) {
          // not a commons image. local wiki image
          this.querySelector(".thumbnail > .webp").remove();
          this.querySelector(".thumbnail > .png").remove();
        } else {
          this.querySelector(
            ".thumbnail > .webp"
          ).srcset = thumbnail.source.replace(/\.(jpg|png|jpeg)$/, ".webp");
          this.querySelector(
            ".thumbnail > .png"
          ).srcset = thumbnail.source.replace(/\.(jpg|webp|jpeg)$/, ".png");
        }
        this.querySelector(".thumbnail > img").src = thumbnail.source;
      }
    }

    render() {
      this.innerHTML = `
              <div class="wiki-article">
                  <picture class="thumbnail">
                   <source class="webp"  type="image/webp">
                   <source class="png" type="image/png">
                   <img  src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/220px-Wikipedia-logo-v2.svg.webp" alt="" />
                  </picture>
                  <h2 class="title-header">
                  <a class="title" href="" target="_blank"></a>
                  </h2>
                  <p class="description">Loading...</p>
                  <div class="meta">
                  <span class="logo"></span>

                  <span class="moto">Wikipedia, The free encyclopedia</span>
                  <a class="edit" href="" target="_blank">Edit</a>
                  <a  class="history" href="" target="_blank">History</a>
                    <a  class="talk" href="" target="_blank">Talk</a>
                    <a href="https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License" class="cc"> </a>
                  </div>
              </div>
          `;
    }
  }

customElements.define("wiki-article", WikiArticle);
