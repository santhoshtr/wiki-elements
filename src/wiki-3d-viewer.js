import { addPrefetch, html } from './common.js'
import { OrbitControls } from './libs/OrbitControls.js'
import { STLLoader } from './libs/STLLoader.js'
import {
    HemisphereLight,
    Matrix4,
    Mesh,
    MeshPhongMaterial,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
} from './libs/three.module.js'
import LazyLoadMixin from './mixins/LazyLoadMixin.js'
import WikiElement from './wiki-element.js'

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
        addPrefetch('preconnect', 'https://upload.wikimedia.org')
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

    STLViewer(elem, model, rotate = true, zoom = 2, callback = null) {
        var renderer = new WebGLRenderer({ antialias: true, alpha: true })
        var camera = new PerspectiveCamera(50, elem.clientWidth / elem.clientHeight, 1, 1000)

        renderer.setSize(elem.clientWidth, elem.clientHeight)
        elem.appendChild(renderer.domElement)

        window.addEventListener(
            'resize',
            function () {
                renderer.setSize(elem.clientWidth, elem.clientHeight)
                camera.aspect = elem.clientWidth / elem.clientHeight
                camera.updateProjectionMatrix()
            },
            false
        )

        var controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.rotateSpeed = 0.75
        controls.dampingFactor = 0.1
        controls.enableZoom = true
        controls.enablePan = false
        controls.autoRotate = true
        controls.autoRotateSpeed = 2

        var scene = new Scene()

        scene.add(new HemisphereLight(0xffffff, 0x080820, 1.5))

        new STLLoader().load(model, function (geometry) {
            var material = new MeshPhongMaterial({ color: 0xcccccc, specular: 100, shininess: 100 })
            var mesh = new Mesh(geometry, material)
            scene.add(mesh)

            // Compute the middle
            var middle = new Vector3()
            geometry.computeBoundingBox()
            geometry.boundingBox.getCenter(middle)

            // Center it
            mesh.geometry.applyMatrix4(new Matrix4().makeTranslation(-middle.x, -middle.y, -middle.z))

            // Rotate, if desired
            if (rotate) {
                mesh.rotation.x = -Math.PI / 2
            }

            // Pull the camera away as needed
            var largestDimension = Math.max(
                geometry.boundingBox.max.x,
                geometry.boundingBox.max.y,
                geometry.boundingBox.max.z
            )
            camera.position.z = largestDimension * zoom

            var animate = function () {
                requestAnimationFrame(animate)
                controls.update()
                renderer.render(scene, camera)
            }
            animate()
            if (callback) {
                callback()
            }
        })
    }

    async init3d(stlUrl) {
        const filename = stlUrl.split('/').pop()

        const container = this.shadowRoot.getElementById('wiki-3d-viewer-container')
        const imageData = await this.fetchImageData(filename)

        this.STLViewer(container, imageData.url, true, 3, () => {
            this.progress.style.display = 'none'
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
