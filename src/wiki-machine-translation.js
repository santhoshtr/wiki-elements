import { deIndent, addPrefetch, detectLanguage, sha256 } from './common.js';

class WikiMachineTranslation extends HTMLElement {

    constructor() {
        super();
        this.intersectionObserver = new IntersectionObserver(this.onIntersection.bind(this), {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        });

    }

    static get observedAttributes() {
        return ['source', 'target'];
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
        this._htmlContent = deIndent(html.trim());
        this.render();
    }

    /**
     * Called when the element is connected to the DOM.
     */
    connectedCallback() {
        this.source = this.getAttribute('source');
        this.target = this.getAttribute('target');
        this.translation = null;
        this.intersectionObserver.observe(this);
        addPrefetch('preconnect', 'https://cxserver.wikimedia.org');
        addPrefetch('preconnect', 'https://api.wikimedia.org');

        if (this._htmlContent === undefined) {
            this._htmlContent = deIndent(this.innerHTML);
        }

    }

    attributeChangedCallback(attrName, oldValue, newValue) {
        if (newValue !== oldValue) {
            this[attrName] = newValue;
            this.render();
        }
    }

    disconnectedCallback() {
        this.intersectionObserver.unobserve(this);
    }

    onIntersection(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                this.intersectionObserver.unobserve(this);
                this.render();
            }
        });
    }

    async render() {
        if (!this.isConnected || this._htmlContent === undefined) {
            return;
        }
        const MTProvider = 'MinT';

        this.innerHTML = '<progress style="width:100%;height:2px;"></progress>';
        if (this.source === this.target) {
            this.innerHTML = this._htmlContent;
            return;
        }
        if (!this.source) {
            this.source = await detectLanguage(this.innerText);
        }
        const api = `https://cxserver.wikimedia.org/v2/translate/${this.source}/${this.target}/${MTProvider}`;
        try {
            const hash = await sha256(`${this.source}-${this.target}-${this.translation}`);
            // check if translation is in localstorage
            const cachedTranslation = hash && localStorage.getItem(hash);
            if (cachedTranslation) {
                this.translation = cachedTranslation;
                this.innerHTML = this.translation;
            }
            else {
                const payload = JSON.stringify({
                    html: `<div>${this._htmlContent}</div>`,
                });

                const response = await fetch(api, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: payload
                });

                if (!response.ok) throw new Error('Network response was not ok');
                this.translation = (await response.json()).contents;
                this.innerHTML = this.translation
                // store in localstorage
                if (hash) {
                    localStorage.setItem(hash, this.translation);
                }
            }

        } catch (error) {
            const errormsg = `Failed to load translation: ${error}`;
            this.innerHTML = errormsg;
            console.error(errormsg);
        }

        // Fire event
        const event = new CustomEvent('wiki-machine-translation-ready', {
            detail: {
                source: this.source,
                target: this.target,
                originalContent: this._htmlContent,
                translation: this.translation,
            },
        });
        this.dispatchEvent(event);
    }
}

// Register custom element
if (!customElements.get('wiki-machine-translation')) {
    customElements.define('wiki-machine-translation', WikiMachineTranslation);
}
