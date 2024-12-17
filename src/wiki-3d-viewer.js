import { addPrefetch, addScript, html } from './common.js'
import LazyLoadMixin from './mixins/LazyLoadMixin.js'
import WikiElement from './wiki-element.js'

const scriptURL = new URL('./libs/stl_viewer/stl_viewer.min.js', import.meta.url)
class Wiki3DViewer extends LazyLoadMixin(WikiElement) {
    constructor() {
        super()
    }

    static get template() {
        return html`
            <section class="wiki-3d-viewer">
                <progress id="loading"></progress>
                <div id="wiki-3d-viewer-container"></div>
                <div class="info"></div>
            </section>
        `
    }

    static get stylesheetURL() {
        return new URL('./wiki-3d-viewer.css', import.meta.url)
    }

    static get properties() {
        return {
            source: {
                type: String,
            },
        }
    }

    connectedCallback() {
        super.connectedCallback()
        addPrefetch('preconnect', 'https://commons.wikimedia.org')
    }

    async render() {
        if (!this.source) {
            return
        }
        this.progress = this.shadowRoot.getElementById('loading')
        await this.init3d(this.source)
    }

    async fetchImageData(filename) {
        if (!filename.startsWith('File:')) {
            filename = 'File:' + filename
        }
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|user|extmetadata&format=json&origin=*`
        const response = await fetch(apiUrl)
        const data = await response.json()
        const page = Object.values(data.query.pages)[0]

        return page.imageinfo[0]
    }

    async init3d(stlUrl) {
        await addScript(scriptURL)
        const filename = stlUrl.split('/').pop()

        const container = this.shadowRoot.getElementById('wiki-3d-viewer-container')
        const imageData = await this.fetchImageData(filename)
        // eslint-disable-next-line no-unused-vars
        const stl_viewer = new window.StlViewer(container, {
            models: [{ id: 0, filename: imageData.url }],
            auto_rotate: true,
            all_loaded_callback: () => {
                this.progress.style.display = 'none'
            },
        })

        const attribution = this.shadowRoot.querySelector('.info')
        const author = imageData.user
        const description = imageData.extmetadata.ImageDescription.value
        const license = imageData.extmetadata.LicenseShortName.value
        const descriptionElement = document.createElement('p')
        descriptionElement.innerHTML = description
        attribution.appendChild(descriptionElement)
        const metaElement = document.createElement('p')
        const commonsUrl = imageData.descriptionurl
        metaElement.innerHTML = `${author} | ${license} | <a href="${commonsUrl}">Wikimedia Commons</a>`
        attribution.appendChild(metaElement)
    }
}

if (!customElements.get('wiki-3d-viewer')) {
    customElements.define('wiki-3d-viewer', Wiki3DViewer)
}
