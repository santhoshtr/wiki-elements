import { deIndent, addPrefetch } from './common.js';

class WikiMachineTranslation extends HTMLElement {
    constructor() {
        super();
        this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        });
    }

    /**
     * Gets the value of the "rendered" attribute.
     * @returns {string} - The value of the "rendered" attribute.
     */
    get rendered() {
        return this.getAttribute('rendered');
    }

    /**
     * Gets the wikitext content of the element.
     * @returns {string} - The wikitext content.
     */
    get htmlContent() {
        return this._htmlContent;
    }

    set htmlContent(html) {
        this._htmlContent = html.trim();
        this.render();
    }

    /**
     * Called when the element is connected to the DOM.
     */
    connectedCallback() {
        this.source = this.getAttribute('source');
        this.target = this.getAttribute('target');

        this.observer.observe(this);
        addPrefetch('preconnect', 'https://cxserver.wikimedia.org');
        if (this._htmlContent === undefined) {
            this._htmlContent = deIndent(this.innerHTML);
        }

        this.render();
    }

    disconnectedCallback() {
        this.observer.unobserve(this);
    }

    onIntersection(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                this.observer.unobserve(this);
                this.render();
            }
        });
    }

    async render() {
        if (!this.isConnected || this._htmlContent === undefined) {
            return;
        }

        var api = `https://cxserver.wikimedia.org/v2/translate/${this.source}/${this.target}/MinT`;

        try {
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    html: `<div>${this._htmlContent}</div>`,
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
            this.innerHTML = (await response.json()).contents;
        } catch (error) {
            console.error(`Error while converting wikitext ${this._htmlContent} error:${error}`);
        }

        // Fire event
        const event = new CustomEvent('wikitext-render', { bubbles: true, composed: true });
        this.dispatchEvent(event);
    }
}

// Register custom element
if (!customElements.get('wiki-machine-translation')) {
    customElements.define('wiki-machine-translation', WikiMachineTranslation);
}
