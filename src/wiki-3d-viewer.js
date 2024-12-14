import { addPrefetch,html } from "./common.js";
import * as THREE from "./libs/threejs/build/three.module.js";
import { OrbitControls } from "./libs/threejs/examples/jsm/loaders/OrbitControls.js";
import { STLLoader } from "./libs/threejs/examples/jsm/loaders/STLLoader.js";
import LazyLoadMixin from "./mixins/LazyLoadMixin.js";
import WikiElement from "./wiki-element.js";

const styleURL = new URL("./wiki-3d-viewer.css", import.meta.url);


class Wiki3DViewer extends LazyLoadMixin(WikiElement) {
    constructor() {
        super();
    }

    static get template() {
        return html`
            <div id="wiki-3d-viewer-container">
                <progress id="loading"></progress>
            </div>
            <style>
                @import url(${styleURL});
                #wiki-3d-viewer-container {
                    position: relative;
                    width: 100%;
                    height: 75vh;
                }
            </style>
        `;
    }

    static get properties() {
        return {
            source: {
                type: String,
            },
        };
    }

    connectedCallback() {
        super.connectedCallback();
        addPrefetch("preconnect", "https://commons.wikimedia.org");
    }

    async render() {
        if (!this.source) {
            return;
        }

        this.init3d(this.source);
    }

    init3d(url) {
        const container = this.shadowRoot.getElementById("wiki-3d-viewer-container");

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xcccccc);

        const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 1, 1000);

        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        let mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const controls = new OrbitControls(camera, renderer.domElement);
        function render() {
            renderer.render(scene, camera);
        }
        controls.addEventListener("change", render);
        controls.target.set(0, 0, 2);
        controls.enableZoom = true;
        controls.rotateSpeed = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = .75;
        controls.update();

        const loader = new STLLoader();
        loader.load(
            url,
            (geometry) => {
                const params = {
                    wireframe: false,
                    color: "#cccccc",
                };

                const material = new THREE.MeshPhongMaterial({
                    color: params.color,
                    wireframe: params.wireframe,
                });
                mesh = new THREE.Mesh(geometry, material);

                // Center the model
                geometry.computeBoundingBox();
                const center = geometry.boundingBox.getCenter(new THREE.Vector3());
                geometry.translate(-center.x, -center.y, -center.z);

                // Scale to reasonable size
                const size = geometry.boundingBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5 / maxDim;
                mesh.scale.set(scale, scale, scale);

                scene.add(mesh);

                var animate = function () {
                    requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                };
                animate();
                this.shadowRoot.getElementById("loading").style.display = "none";
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            },
            function (error) {
                console.error("Error loading STL:", error);
                document.getElementById("loading").textContent = "Error loading STL file";
            },
        );
    }
}

if (!customElements.get("wiki-3d-viewer")) {
    customElements.define("wiki-3d-viewer", Wiki3DViewer);
}
