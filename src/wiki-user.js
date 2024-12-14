
import { addPrefetch, getSourceSetFromCommonsUrl,html } from "./common.js";
import LazyLoadMixin from "./mixins/LazyLoadMixin.js";
import WikiElement from "./wiki-element.js";

const styleURL = new URL("./wiki-user.css", import.meta.url);

class WikiUser extends LazyLoadMixin(WikiElement) {
    constructor() {
        super();
    }

    static get template() {
        return html`
        <div class="wiki-user">
        <img class="avatar" alt="User avatar" loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/220px-Wikipedia-logo-v2.svg.webp"/>

        <span class="user-label">Wikipedia User</span>
        <h1 class="username">Wiki User</h1>
        <div class="editcount-wrapper"><span class="editcount"></span></
        span>Edits</div>
        <div class="wikicount-wrapper">In <span class="wikicount"></span></
        span>Wiki projects</div>
        <div  class="registration-wrapper">Since<span class="registration"><span></div>
        <style>
            @import url(${styleURL});
        </style>
        </div>
       `;
    }


    static get properties() {
        return {
            username: {
                type: String
            },
            avatar: {
                type: String
            },
        };
    }

    connectedCallback() {
        super.connectedCallback();
        addPrefetch("preconnect", "https://en.wikipedia.org");
    }

    async render() {
        if (!this.username) {
return;
}
        this.shadowRoot.querySelector(".username").textContent = this.username;

        if (this.avatar) {
            this.shadowRoot.querySelector("img.avatar").src = this.avatar;
        }

        try {
            const userData = await this.fetchUserData(this.username);
            this.updateUser(userData);
        }
 catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    async fetchUserData() {
        if (!this.username) {
return;
}
        const url = `https://en.wikipedia.org/w/api.php?action=query&guiprop=groups|merged|unattached&guiuser=${this.username}&meta=globaluserinfo&format=json&origin=*`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
throw new Error("Network response was not ok");
}
            const data = await response.json();
            return data.query.globaluserinfo;
        }
 catch (error) {
            this.shadowRoot.querySelector(".description").innerText = "Failed to load article.";
            console.error("Fetch error:", error);
        }
    }

    getTotalEditCount(userData) {
        const wikiedits = userData.merged;
        let editcount = 0;
        for (const wiki of wikiedits) {
            editcount += wiki.editcount;
        }
        return editcount;
    }

    getTotalWikis(userData) {
        const wikiedits = userData.merged;
        let wikicount = 0;
        for (const wiki of wikiedits) {
            if (wiki.editcount > 0) {
                wikicount++;
            }
        }
        return wikicount;
    }


    updateUser(userData) {
        this.shadowRoot.querySelector(".username").textContent = userData.name;
        this.shadowRoot.querySelector(".editcount").textContent = this.getTotalEditCount(userData);
        this.shadowRoot.querySelector(".wikicount").textContent = this.getTotalWikis(userData);
        const registrationDate = new Date(userData.registration);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDate = registrationDate.toLocaleDateString(undefined, options);
        // FIXME. Get first registration date in any wiki
        this.shadowRoot.querySelector(".registration").textContent = formattedDate;
    }
}

if (!customElements.get("wiki-user")) {
    customElements.define("wiki-user", WikiUser);
}
