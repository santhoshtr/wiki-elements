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

    async connectedCallback() {
        this.article= this.getAttribute("article");
        this.longitude = this.getAttribute("longitude")
        this.latitude = this.getAttribute("latitude")
        this.language = this.getAttribute("language") || "en";
        this.zoom = this.getAttribute("zoom") || 12;
        this.render();
        const mapData = await this.fetchMapData()
        this.renderMap(mapData);
    }

    async renderMap(mapData) {
        if (!leaflet) {
            await addStyle(URLs.leafletcss);
            await addScript(URLs.leaflet);
            leaflet = window.L;
        }
        console.log(mapData)
        const map = leaflet.map(this.querySelector('.wiki-map'))
            .setView([mapData.latitude, mapData.longitude], mapData.zoom);
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
        if (!this.longitude || !this.latitude){
            if (!this.article) {
                throw new Error("No article or coordinates provided");
            }

            const response = await fetch(`https://${this.language}.wikipedia.org/api/rest_v1/page/summary/${this.article}?redirect=true`);
            if (!response.ok) throw new Error("Network response was not ok");
            const {coordinates} = await response.json();
            this.longitude = coordinates.lon;
            this.latitude = coordinates.lat;
        }

        return {
            longitude: parseFloat(this.longitude),
            latitude: parseFloat(this.latitude),
            zoom: this.zoom,
        };
    }


    render() {
        this.innerHTML = `<div class="wiki-map" style="width: 100%;height:100%;min-height:500px;"></div>`;
    }
}

customElements.define("wiki-map", WikiMap);
