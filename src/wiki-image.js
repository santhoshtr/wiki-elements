
import { addPrefetch, getSourceSetFromCommonsUrl } from './common.js';


const styleURL = new URL('./wiki-image.css', import.meta.url)
const template = `
<figure>
    <img alt="Wikimedia Commons image" loading="lazy">
    <figcaption></figcaption>
</figure>
<style>
@import url(${styleURL});
</style>
`

class WikiImage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = template;
    }

    static get observedAttributes() {
        return ['source'];
    }

    connectedCallback() {
        addPrefetch('preconnect', 'https://commons.wikimedia.org');
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'source' && oldValue !== newValue) {
            this.render();
        }
    }

    async render() {
        const source = this.getAttribute('source');
        if (!source) return;
        var imageTitle = source;
        if (source.startsWith('http://') || source.startsWith('https://')) {
            const sourceUrl = new URL(source);
            imageTitle = sourceUrl.pathname.split('/').pop();

        }
        try {
            const imageData = await this.fetchImageData(imageTitle);
            this.updateImage(imageData);
        } catch (error) {
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

customElements.define('wiki-image', WikiImage);
