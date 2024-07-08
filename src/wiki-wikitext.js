
/**
 * Removes the common indentation from a block of text.
 * @param {string} text - The text to de-indent.
 * @returns {string} - The de-indented text.
 */
function deIndent(text) {
    let indent = text.match(/^[\r\n]*([\t ]+)/);

    if (indent) {
        indent = indent[1];

        text = text.replace(RegExp("^" + indent, "gm"), "");
    }

    return text;
}

/**
 * Represents a custom HTML element for rendering wiki content as HTML.
 */
class WikiWikiText extends HTMLElement {
    constructor() {
        super();
        this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        });
    }

    /**
     * Gets the value of the "rendered" attribute.
     * @returns {string} - The value of the "rendered" attribute.
     */
    get rendered() {
        return this.getAttribute("rendered");
    }

    /**
     * Gets the wikitext content of the element.
     * @returns {string} - The wikitext content.
     */
    get wikitextContent() {
        return this._wikitextContent;
    }

    /**
     * Sets the wikitext content of the element.
     * @param {string} html - The HTML content to set as the wikitext content.
     */
    set wikitextContent(html) {
        this._wikitextContent = html;
        this._contentFromHTML = false;

        this.render();
    }

    isWikiText(text) {
        return text.includes("{") || text.includes("[")
            || text.includes("* ") || text.includes("# ") || text.includes("==") || text.includes("<")
    }


    isWikiInternalLink(text) {
        text=text.trim();
        return text.startsWith("[[") && text.endsWith("]]") && !this.isWikiText(text.substring(2, text.length - 2));
    }

    isWikiExternalLink(text) {
        text=text.trim();
        return text.startsWith("[") && text.endsWith("]") && !this.isWikiText(text.substring(1, text.length - 1));
    }

    /**
     * Called when the element is connected to the DOM.
     */
    connectedCallback() {
        this.language = this.getAttribute('language')|| 'en';
        this.article = this.getAttribute('article');

        this.observer.observe(this);

        if (this._wikitextContent === undefined) {
            this._contentFromHTML = true;
            this._wikitextContent = deIndent(this.innerHTML);
        }

        this.render();
    }

    disconnectedCallback() {
        this.observer.unobserve(this);
    }


    onIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.observer.unobserve(this);
                this.render();
            }
        });
    }

    renderWikiInternalLink() {
        let linkLabel;
        var title = this._wikitextContent.trim().substring(2, this.textContent.length - 2);
        var linkParts = title.split("|");
        if (linkParts.length > 0) {
            title = linkParts[0];
        }
        if (linkParts.length > 1) {
            linkLabel = linkParts[1];
        }

        this.innerHTML = `<a href="./${title}" title="${title}" rel="mw:WikiLink">${linkLabel || title}</a>`;
        return
    }

    renderWikiExternalLink() {
        let linkLabel;
        var href = this._wikitextContent.trim().substring(1, this.textContent.length - 1);
        var linkParts = title.split(" ");
        if (linkParts.length > 0) {
            href = linkParts[0];
        }
        if (linkParts.length > 1) {
            linkLabel = linkParts[1];
        }

        this.innerHTML = `<a href="${href}" rel="mw:ExtLink nofollow">${linkLabel || href}</a>`;
        return;
    }

    async render() {
        if (!this.isConnected || this._wikitextContent === undefined) {
            return;
        }

        if (this.isWikiInternalLink(this._wikitextContent)) {
            this.renderWikiInternalLink();
            return;
        }

        if (this.isWikiExternalLink(this._wikitextContent)) {
            this.renderWikiExternalLink();
            return;
        }

        var api = `https://${this.language}.wikipedia.org/api/rest_v1/transform/wikitext/to/html`;
        if (this.title) {
            api += `/${encodeURIComponent(this.title)}`;
        }
        try {
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wikitext: this._wikitextContent,
                    "body_only": true,
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            this.innerHTML = await response.text();;
        } catch (error) {
            console.error(`Error while converting wikitext ${this._wikitextContent} error:${error}`);
        }

        // Fire event
        const event = new CustomEvent("wikitext-render", { bubbles: true, composed: true });
        this.dispatchEvent(event);
    }

}

// Register custom element
customElements.define('wiki-wikitext', WikiWikiText);