import { deIndent, addPrefetch, detectLanguage, sha256 } from './common.js';
import LazyLoadMixin from './mixins/LazyLoadMixin.js';
import WikiElement from './wiki-element.js';

class WikiMachineTranslation extends LazyLoadMixin(WikiElement) {

    constructor() {
        super();
    }

    static get properties() {
        return {
            source: {
                type: String
            },
            target: {
                type: String
            },
            source_html: {
                type: String
            },
            source_text: {
                type: String
            }
        }
    }


    /**
     * Called when the element is connected to the DOM.
     */
    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback();
        }

        this.source_html = deIndent(this.innerHTML).trim();
        this.source_text = deIndent(this.innerText).trim();
        this.translation = null;

        addPrefetch('preconnect', 'https://cxserver.wikimedia.org');
        addPrefetch('preconnect', 'https://api.wikimedia.org');
    }


    propertyChangedCallback(name, oldValue, newValue) {
        this.render();
    }


    async render() {
        if (!this.isConnected || this.source_html === undefined || !this.target) {
            return;
        }
        const MTProvider = 'MinT';

        this.innerHTML = '<progress style="width:100%;height:2px;"></progress>';
        if (this.source === this.target) {
            this.innerHTML = this.source_html;
            return;
        }
        if (!this.source) {
            this.source = await detectLanguage(this.innerText);
        }
        const api = `https://cxserver.wikimedia.org/v2/translate/${this.source}/${this.target}/${MTProvider}`;
        try {
            const hash = await sha256(`${this.source}-${this.target}-${this.source_html}`);
            // check if translation is in localstorage
            const cachedTranslation = hash && localStorage.getItem(hash);
            if (cachedTranslation) {
                this.translation = cachedTranslation;
                this.innerHTML = this.translation;
            }
            else {
                const payload = JSON.stringify({
                    html: `<div>${this.source_html}</div>`,
                    //cache: true
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
