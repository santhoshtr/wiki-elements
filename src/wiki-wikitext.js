import { deIndent, addPrefetch } from "./common.js";
import WikiElement from "./wiki-element.js";
import LazyLoadMixin from "./mixins/LazyLoadMixin.js";

/**
 * Represents a custom HTML element for rendering wiki content as HTML.
 */
class WikiWikiText extends LazyLoadMixin(WikiElement) {
    constructor() {
        super();
    }

    static get properties() {
        return {
            article: {
                type: String
            },
            language: {
                type: String,
                default: "en"
            },
            wiki_text: {
                type: String
            },
        };
    }

    /**
     * Called when the element is connected to the DOM.
     */
    connectedCallback() {
        super.connectedCallback();
        addPrefetch("preconnect", `https://${this.language}.wikipedia.org`);
        this.wiki_text = deIndent(this.innerHTML);
    }

    async render() {
        if (!this.isConnected || this.wiki_text === undefined) {
            return;
        }


        var api = `https://${this.language}.wikipedia.org/api/rest_v1/transform/wikitext/to/html`;
        if (this.article) {
            api += `/${encodeURIComponent(this.article)}`;
        }
        try {
            const response = await fetch(api, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    wikitext: this.wiki_text,
                    body_only: true,
                }),
            });

            if (!response.ok) {
throw new Error("Network response was not ok");
}
            this.shadowRoot.innerHTML = await response.text();
        }
 catch (error) {
            console.error(`Error while converting wikitext ${this._wikitextContent} error:${error}`);
        }

        // Fire event
        const event = new CustomEvent("wikitext-render", { bubbles: true, composed: true });
        this.dispatchEvent(event);
    }
}

// Register custom element
customElements.define("wiki-wikitext", WikiWikiText);
