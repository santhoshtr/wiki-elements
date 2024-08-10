
import { html, addPrefetch, getSourceSetFromCommonsUrl } from './common.js';
import WikiElement from './wiki-element.js';
import LazyLoadMixin from './mixins/LazyLoadMixin.js';

const styleURL = new URL('./wiki-image.css', import.meta.url)

class WikiImage extends LazyLoadMixin(WikiElement) {
    constructor() {
        super();
    }

    static get template() {
        return html`
       <figure>
           <img alt="Wikimedia Commons image" loading="lazy">
           <figcaption></figcaption>
       </figure>
       <style>
       @import url(${styleURL});
       </style>
       `
    }


    static get properties() {
        return {
            source: {
                type: String
            }
        }
    }

    connectedCallback() {
        super.connectedCallback();
        addPrefetch('preconnect', 'https://commons.wikimedia.org');
    }

    async render() {
        if (!this.source) return;
        var imageTitle = this.source;
        if (this.source.startsWith('http://') || this.source.startsWith('https://')) {
            const sourceUrl = new URL(this.source);
            imageTitle = sourceUrl.pathname.split('/').pop();

        }
        try {
            this.internals.states.delete('error');
            this.internals.states.add('progress');
            const imageData = await this.fetchImageData(imageTitle);
            this.internals.states.delete('progress');
            this.updateImage(imageData);
        } catch (error) {
            this.internals.states.delete('progress');
            this.internals.states.add('error');
            console.error('Error fetching image data:', error);
        }
    }

    async fetchImageData(filename) {

        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|user|extmetadata&format=json&origin=*`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        const page = Object.values(data.query.pages)[0];

        return page.imageinfo[0];
    }



    updateImage(imageData) {
        const figure = this.shadowRoot.querySelector('figure');
        const img = figure.querySelector('img');
        const attribution = figure.querySelector('figcaption');
        const commonsUrl = imageData.descriptionurl;
        // Set srcset
        const srcset = getSourceSetFromCommonsUrl(imageData.url);
        img.setAttribute('srcset', srcset);
        img.setAttribute('src', imageData.url);


        // Set attribution
        const author = imageData.user;
        const description = imageData.extmetadata.ImageDescription.value;
        const license = imageData.extmetadata.LicenseShortName.value;
        attribution.innerHTML = `${description} | ${author} | ${license} | <a href="${commonsUrl}">Wikimedia Commons</a>`;
        img.setAttribute('alt', attribution.textContent);

    }
}

if (!customElements.get('wiki-image')) {
    customElements.define('wiki-image', WikiImage);
}
