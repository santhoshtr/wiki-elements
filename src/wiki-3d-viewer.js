import { addPrefetch, html } from "./common.js";
import LazyLoadMixin from "./mixins/LazyLoadMixin.js";
import WikiElement from "./wiki-element.js";

const THREE_CDN = "https://esm.sh/three";
let _threeModules = null;

class Wiki3DViewer extends LazyLoadMixin(WikiElement) {
	static get template() {
		return html`
            <section class="wiki-3d-viewer">
                <progress id="loading"></progress>
                <div id="wiki-3d-viewer-container"></div>
                <div class="info"></div>
            </section>
        `;
	}

	static get stylesheetURL() {
		return new URL("./wiki-3d-viewer.css", import.meta.url);
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
		addPrefetch("preconnect", "https://upload.wikimedia.org");
		addPrefetch("preconnect", "https://esm.sh");
	}

	async _loadThree() {
		if (_threeModules) {
			return _threeModules;
		}
		const [THREE, { OrbitControls }, { STLLoader }] = await Promise.all([
			import(THREE_CDN),
			import(`${THREE_CDN}/examples/jsm/controls/OrbitControls`),
			import(`${THREE_CDN}/examples/jsm/loaders/STLLoader`),
		]);
		_threeModules = { THREE, OrbitControls, STLLoader };
		return _threeModules;
	}

	async render() {
		if (!this.source) {
			return;
		}
		this.progress = this.shadowRoot.getElementById("loading");
		const three = await this._loadThree();
		await this.init3d(this.source, three);
	}

	async fetchImageData(filename) {
		if (!filename.startsWith("File:")) {
			filename = `File:${filename}`;
		}
		const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|user|extmetadata&format=json&origin=*`;
		const response = await fetch(apiUrl);
		const data = await response.json();
		const page = Object.values(data.query.pages)[0];

		return page.imageinfo[0];
	}

	STLViewer(
		elem,
		model,
		{ THREE, OrbitControls, STLLoader },
		rotate = true,
		zoom = 2,
		callback = null,
	) {
		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		const camera = new THREE.PerspectiveCamera(
			50,
			elem.clientWidth / elem.clientHeight,
			1,
			1000,
		);

		renderer.setSize(elem.clientWidth, elem.clientHeight);
		elem.appendChild(renderer.domElement);

		window.addEventListener(
			"resize",
			() => {
				renderer.setSize(elem.clientWidth, elem.clientHeight);
				camera.aspect = elem.clientWidth / elem.clientHeight;
				camera.updateProjectionMatrix();
			},
			false,
		);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.rotateSpeed = 0.75;
		controls.dampingFactor = 0.1;
		controls.enableZoom = true;
		controls.enablePan = false;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 2;

		const scene = new THREE.Scene();

		scene.add(new THREE.HemisphereLight(0xffffff, 0x080820, 1.5));

		new STLLoader().load(model, (geometry) => {
			const material = new THREE.MeshPhongMaterial({
				color: 0xcccccc,
				specular: 100,
				shininess: 100,
			});
			const mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);

			// Compute the middle
			const middle = new THREE.Vector3();
			geometry.computeBoundingBox();
			geometry.boundingBox.getCenter(middle);

			// Center it
			mesh.geometry.applyMatrix4(
				new THREE.Matrix4().makeTranslation(-middle.x, -middle.y, -middle.z),
			);

			// Rotate, if desired
			if (rotate) {
				mesh.rotation.x = -Math.PI / 2;
			}

			// Pull the camera away as needed
			const largestDimension = Math.max(
				geometry.boundingBox.max.x,
				geometry.boundingBox.max.y,
				geometry.boundingBox.max.z,
			);
			camera.position.z = largestDimension * zoom;

			const animate = () => {
				requestAnimationFrame(animate);
				controls.update();
				renderer.render(scene, camera);
			};
			animate();
			if (callback) {
				callback();
			}
		});
	}

	async init3d(stlUrl, three) {
		const filename = stlUrl.split("/").pop();

		const container = this.shadowRoot.getElementById(
			"wiki-3d-viewer-container",
		);
		const imageData = await this.fetchImageData(filename);

		this.STLViewer(container, imageData.url, three, true, 3, () => {
			this.progress.style.display = "none";
		});

		const attribution = this.shadowRoot.querySelector(".info");
		const author = imageData.user;
		const description = imageData.extmetadata.ImageDescription.value;
		const license = imageData.extmetadata.LicenseShortName.value;
		const descriptionElement = document.createElement("p");
		descriptionElement.innerHTML = description;
		attribution.appendChild(descriptionElement);
		const metaElement = document.createElement("p");
		const commonsUrl = imageData.descriptionurl;
		metaElement.innerHTML = `${author} | ${license} | <a href="${commonsUrl}">Wikimedia Commons</a>`;
		attribution.appendChild(metaElement);
	}
}

if (!customElements.get("wiki-3d-viewer")) {
	customElements.define("wiki-3d-viewer", Wiki3DViewer);
}
