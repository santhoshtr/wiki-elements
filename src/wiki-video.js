
import { addPrefetch, getSourceSetFromCommonsUrl, addScript } from './common.js';

const styleURL = new URL('./wiki-video.css', import.meta.url)

const template = `
<figure>
<video controls autoplay muted loop>
</video>
<figcaption></figcaption>
</figure>
<style>

@import url(${styleURL});
</style>
`

class WikiVideo extends HTMLElement {
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
        var videoTitle = source;
        if (source.startsWith('http://') || source.startsWith('https://')) {
            const sourceUrl = new URL(source);
            videoTitle = sourceUrl.pathname.split('/').pop();
        }

        try {
            const videoData = await this.fetchVideoData(videoTitle);
            this.preparePlayer(videoData);
        } catch (error) {
            console.error('Error fetching image data:', error);
        }
    }


    async fetchVideoData(filename) {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|user|extmetadata&format=json&origin=*`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        const page = Object.values(data.query.pages)[0];
        return page.imageinfo[0];
    }


    preparePlayer(videoData) {
        const player = this.shadowRoot.querySelector('video');
        const attribution = this.shadowRoot.querySelector('figcaption');
        const commonsUrl = videoData.descriptionurl;
        const source_el = document.createElement('source');
        source_el.setAttribute('src', videoData.url);
        player.appendChild(source_el);


        // Set attribution
        const author = videoData.user;
        const description = videoData.extmetadata.ImageDescription.value;
        const license = videoData.extmetadata.LicenseShortName.value;
        attribution.innerHTML = `${description} | ${author} | ${license} | <a href="${commonsUrl}">Wikimedia Commons</a>`;
        player.setAttribute('alt', attribution.textContent);
    }
}

customElements.define('wiki-video', WikiVideo);