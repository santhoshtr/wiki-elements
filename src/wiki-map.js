import { addScript, addStyle } from "./common.js";

const URLs = {
    leaflet: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    leafletcss: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
}

let leaflet = window.L;
class WikiMap extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.longitude = this.getAttribute("longitude") || 8.4906
        this.latitude = this.getAttribute("latitude") || 76.9545;
        this.zoom = this.getAttribute("zoom") || 12;
        this.render();
        this.fetchMapData().then(mapData => this.renderMap(mapData));
    }

    async renderMap(mapData) {
        if (!leaflet) {
            await addStyle(URLs.leafletcss);
            await addScript(URLs.leaflet);
            leaflet = window.L;
        }

        const map = leaflet.map(this.querySelector('.wiki-map'))
            .setView([mapData.longitude, mapData.latitude], mapData.zoom);
        leaflet.tileLayer(
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            id: 'map-01',
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        }).addTo(map);
        // Add a km/miles scale
        leaflet.control.scale().addTo(map);
    }

    async fetchMapData() {
        return {
            longitude: this.longitude,
            latitude: this.latitude,
            zoom: this.zoom,
        };
    }


    render() {
        this.innerHTML = `<div class="wiki-map" style="width: 100%;height:100%;min-height:500px;"></div>`;
    }
}

customElements.define("wiki-map", WikiMap);
