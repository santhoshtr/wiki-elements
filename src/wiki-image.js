import { addPrefetch, debounce, getSourceSetFromCommonsUrl, html } from './common.js'
import LazyLoadMixin from './mixins/LazyLoadMixin.js'
import WikiElement from './wiki-element.js'

const styleURL = new URL('./wiki-image.css', import.meta.url)

class WikiImage extends LazyLoadMixin(WikiElement) {
    constructor() {
        super()
    }

    static get template() {
        return html`
            <figure>
                <img alt="Wikimedia Commons image" />
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
                type: String,
            },
            loading: {
                type: String,
                options: ['lazy', 'eager'],
                default: 'lazy',
            },
            decoding: {
                type: String,
                options: ['sync', 'async', 'auto'],
                default: 'auto',
            },
            fetchpriority: {
                type: String,
                options: ['auto', 'high', 'low'],
                default: 'auto',
            },
            height: {
                type: Number,
            },
            width: {
                type: Number,
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
        var imageTitle = this.source
        if (this.source.startsWith('http://') || this.source.startsWith('https://')) {
            const sourceUrl = new URL(this.source)
            imageTitle = sourceUrl.pathname.split('/').pop()
        }
        try {
            this.internals.states.delete('error')
            this.internals.states.add('progress')
            const imageData = await this.fetchImageData(imageTitle)
            this.internals.states.delete('progress')
            this.updateImage(imageData)
        } catch (error) {
            this.internals.states.delete('progress')
            this.internals.states.add('error')
            console.error('Error fetching image data:', error)
        }
    }

    async fetchImageData(filename) {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|user|extmetadata&format=json&origin=*`
        const response = await fetch(apiUrl)
        const data = await response.json()
        const page = Object.values(data.query.pages)[0]

        return page.imageinfo[0]
    }

    updateImage(imageData) {
        const figure = this.shadowRoot.querySelector('figure')
        const img = figure.querySelector('img')
        const attribution = figure.querySelector('figcaption')
        const commonsUrl = imageData.descriptionurl
        // Set srcset
        const srcset = getSourceSetFromCommonsUrl(imageData.url)
        img.setAttribute('srcset', srcset)
        img.setAttribute('src', imageData.url)
        img.setAttribute('sizes', this.shadowRoot.querySelector('figure').clientWidth + 'px')

        // Set attribution
        const author = imageData.user
        const description = imageData.extmetadata.ImageDescription.value
        const license = imageData.extmetadata.LicenseShortName.value
        const descriptionElement = document.createElement('h1')
        descriptionElement.innerHTML = description
        attribution.appendChild(descriptionElement)
        const metaElement = document.createElement('p')
        metaElement.innerHTML = `${author} | ${license} | <a href="${commonsUrl}">Wikimedia Commons</a>`
        attribution.appendChild(metaElement)
        img.setAttribute('alt', description)
        function imageSizesSetter() {
            img.setAttribute('sizes', this.shadowRoot.querySelector('figure').clientWidth + 'px')
        }
        imageSizesSetter.bind(this)()
        if (this.width && this.height) {
            img.setAttribute('width', this.width)
            img.setAttribute('height', this.height)
        }
        if (this.loading) {
            img.setAttribute('loading', this.loading)
        }
        if (this.decoding) {
            img.setAttribute('decoding', this.decoding)
        }
        if (this.fetchpriority) {
            img.setAttribute('fetchpriority', this.fetchpriority)
        }
        window.addEventListener('resize', debounce(imageSizesSetter.bind(this), 300))
    }
}

if (!customElements.get('wiki-image')) {
    customElements.define('wiki-image', WikiImage)
}
