import { addPrefetch, html } from './common.js'
import * as THREE from './libs/threejs/build/three.module.js'
import { STLLoader } from './libs/threejs/examples/jsm/loaders/STLLoader.js'
import { TrackballControls } from './libs/threejs/examples/jsm/loaders/TrackballControls.js'
import LazyLoadMixin from './mixins/LazyLoadMixin.js'
import WikiElement from './wiki-element.js'

const styleURL = new URL('./wiki-3d-viewer.css', import.meta.url)

class Wiki3DViewer extends LazyLoadMixin(WikiElement) {
    constructor() {
        super()
    }

    static get template() {
        return html`
            <div id="wiki-3d-viewer-container">
                <progress id="loading"></progress>
            </div>
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

    async init3d(stlUrl) {
        const container = this.shadowRoot.getElementById('wiki-3d-viewer-container')

        const scene = new THREE.Scene()
        const dimensions = {
            width: Math.max(600, container.getClientRects()[0].width),
            height: Math.max(600, container.getClientRects()[0].height),
        }
        // Camera setup
        const camera = new THREE.PerspectiveCamera(60, dimensions.width / dimensions.height, 0.001, 1000)
        camera.position.set(0, 0, 5)
        camera.add(new THREE.PointLight(0xffffff, 0.3))

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setClearColor(0x222222)
        renderer.setSize(dimensions.width, dimensions.height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true
        container.appendChild(renderer.domElement)

        // Orbit controls for interaction
        const controls = new TrackballControls(camera, renderer.domElement)
        controls.rotateSpeed = 4
        controls.zoomSpeed = 4
        controls.panSpeed = 4

        // Lighting

        scene.add(new THREE.AmbientLight(0xffffff, 0.5))

        const light = new THREE.DirectionalLight(0xffffff, 0.8)
        light.position.set(-100, 50, 25).normalize()
        scene.add(light)

        // STL Loader
        const loader = new STLLoader()
        await loader.load(stlUrl, (geometry) => {
            const material = new THREE.MeshPhongMaterial({
                color: 0xf0ebe8,
                shininess: 5,
                flatShading: true,
                side: THREE.DoubleSide,
            })
            const object = new THREE.Mesh(geometry, material)

            // Center the model
            geometry.center()
            camera.lookAt(scene.position)
            // Scale the model to fit the view
            const box = new THREE.Box3().setFromObject(object)
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scaleFactor = 3 / maxDim
            object.scale.set(scaleFactor, scaleFactor, scaleFactor)

            scene.add(object)

            // center
            // object.geometry.center()
            // object.geometry.computeBoundingSphere()

            // const radius = object.geometry.boundingSphere.radius
            // camera.position.set(-radius * 1, -radius * 1, radius * 0.2)
            renderer.render(scene, camera)
        })

        // Window resize handling
        window.addEventListener('resize', () => {
            camera.aspect = dimensions.width / dimensions.height
            camera.updateProjectionMatrix()
            renderer.setSize(dimensions.width, dimensions.height)
        })

        // Animation loop
        function animate() {
            requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()
        this.progress.style.display = 'none'
        // Return cleanup function if needed
        return () => {
            document.getElementById('viewer').removeChild(renderer.domElement)
            controls.dispose()
            renderer.dispose()
        }
    }
}

if (!customElements.get('wiki-3d-viewer')) {
    customElements.define('wiki-3d-viewer', Wiki3DViewer)
}
