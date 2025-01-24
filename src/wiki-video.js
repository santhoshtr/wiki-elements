import { addPrefetch, html } from './common.js'
import LazyLoadMixin from './mixins/LazyLoadMixin.js'
import WikiElement from './wiki-element.js'

const styleURL = new URL('./wiki-video.css', import.meta.url)

class WikiVideo extends LazyLoadMixin(WikiElement) {
    constructor() {
        super()
    }
    static get properties() {
        return {
            source: {
                type: String,
            },
        }
    }

    static get template() {
        return html`
            <figure>
                <video controls preload="metadata"></video>
                <figcaption></figcaption>
            </figure>
            <style>
                @import url(${styleURL});
            </style>
        `
    }

    connectedCallback() {
        super.connectedCallback()
        addPrefetch('preconnect', 'https://commons.wikimedia.org')
    }

    async render() {
        const source = this.getAttribute('source')
        if (!source) {
            return
        }
        var videoTitle = source
        if (source.startsWith('http://') || source.startsWith('https://')) {
            const sourceUrl = new URL(source)
            videoTitle = sourceUrl.pathname.split('/').pop()
        }

        try {
            const videoData = await this.fetchVideoData(videoTitle)
            this.preparePlayer(videoData)
        } catch (error) {
            console.error('Error fetching image data:', error)
        }
    }

    async fetchVideoData(filename) {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|user|extmetadata&format=json&origin=*`
        const response = await fetch(apiUrl)
        const data = await response.json()
        const page = Object.values(data.query.pages)[0]
        return page.imageinfo[0]
    }

    preparePlayer(videoData) {
        const player = this.shadowRoot.querySelector('video')
        const attribution = this.shadowRoot.querySelector('figcaption')
        const commonsUrl = videoData.descriptionurl
        const source_el = document.createElement('source')

        source_el.setAttribute('src', videoData.url)

        const video_file_name = videoData.url.split('/').pop()
        const poster = `${videoData.url.replace('/commons', '/commons/thumb')}/640px-${video_file_name}.webp`

        player.setAttribute('poster', poster)
        player.appendChild(source_el)

        // Add transcoded sources
        const variants = [
            ['480p.vp9.webm', 854, 480, 'video/webm; codecs="vp9, opus"'],
            ['720p.vp9.webm', 1280, 720, 'video/webm; codecs="vp9, opus"'],
            ['1080p.vp9.webm', 1920, 1080, 'video/webm; codecs="vp9, opus"'],
            ['240p.vp9.webm', 426, 240, 'video/webm; codecs="vp9, opus"'],
            ['360p.webm', 640, 360, 'video/webm; codecs="vp8, vorbis"'],
            ['360p.vp9.webm', 640, 360, 'video/webm; codecs="vp9, opus"'],
            ['webm.144p.mjpeg.mov', 256, 144, 'video/quicktime'],
        ]
        variants.forEach(([key, width, height, type]) => {
            const source = document.createElement('source')
            source.src = `${videoData.url.replace('/commons', '/commons/transcoded')}/${video_file_name}.${key}`
            source.type = type
            source.dataset.transcodekey = key
            source.dataset.width = width
            source.dataset.height = height
            player.appendChild(source)
        })
        // Set attribution
        const descriptionElement = document.createElement('h1')

        const metaElement = document.createElement('p')

        const author = videoData.user
        const description = videoData.extmetadata.ImageDescription.value
        descriptionElement.innerHTML = description
        attribution.appendChild(descriptionElement)
        const license = videoData.extmetadata.LicenseShortName.value
        metaElement.innerHTML = `${author} | ${license} | <a href="${commonsUrl}">Wikimedia Commons</a>`
        attribution.appendChild(metaElement)
        player.setAttribute('alt', description)
    }
}

customElements.define('wiki-video', WikiVideo)
